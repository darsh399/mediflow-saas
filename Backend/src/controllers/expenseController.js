import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import Company from '../models/Company.js';
import Visit from '../models/Visit.js';
import recordAudit from '../utils/audit.js';
import { hasAnyRole } from '../utils/authorize.js';
import { sendCsv } from '../utils/csv.js';
import { summariseTravelClaim } from '../utils/travelClaim.js';

// Only company_owner and hr_manager review expense claims (admin retains its
// platform-wide override) — same restriction already applied to leave review,
// onboarding review, and salary/offer management elsewhere in this app.
const APPROVER_ROLES = ['admin', 'company_owner', 'hr_manager', 'superadmin', 'super_admin'];
const isApprover = (user) => hasAnyRole(user, APPROVER_ROLES);

const CATEGORIES = ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'CLIENT_ENTERTAINMENT', 'OTHER'];

export const applyExpense = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.id;
    if (!companyId) return res.status(400).json({ message: 'Company context missing' });

    const { category, amount, expenseDate, description } = req.body || {};
    if (!category || !CATEGORIES.includes(String(category).toUpperCase())) {
      return res.status(400).json({ message: `category must be one of ${CATEGORIES.join(', ')}` });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'A valid amount greater than 0 is required' });
    const date = new Date(expenseDate);
    if (!expenseDate || Number.isNaN(date.getTime())) return res.status(400).json({ message: 'A valid expense date is required' });
    if (date > new Date()) return res.status(400).json({ message: 'Expense date cannot be in the future' });

    const data = {
      companyId,
      employeeId,
      category: String(category).toUpperCase(),
      amount: numericAmount,
      expenseDate: date,
      description: description ? String(description).trim() : undefined,
    };
    if (req.file) {
      data.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/expenses/${req.file.filename}`,
      };
    }

    const expense = await Expense.create(data);
    await recordAudit(req, 'expense_submitted', { companyId, entityId: expense._id, module: 'expenses', newValue: { category: expense.category, amount: expense.amount } });
    return res.status(201).json({ message: 'Expense submitted', expense });
  } catch (error) {
    console.error('Apply expense error:', error);
    return res.status(500).json({ message: 'Error submitting expense', error: error.message });
  }
};

// Shared by listExpenses and exportExpenses so the CSV export always
// reflects exactly the same company-scoping/visibility rules as the list.
function buildExpenseQuery(req) {
  const companyId = req.user?.companyId;
  const query = companyId ? { companyId } : {};
  if (req.query.mine === 'true' || !isApprover(req.user)) query.employeeId = req.user.id;
  if (req.query.status) query.status = String(req.query.status).toLowerCase();
  if (req.query.category) query.category = String(req.query.category).toUpperCase();
  if (req.query.employeeId && isApprover(req.user)) query.employeeId = req.query.employeeId;
  return query;
}

export const listExpenses = async (req, res) => {
  try {
    const query = buildExpenseQuery(req);
    const expenses = await Expense.find(query).populate('employeeId reviewedBy', 'name email role').sort({ createdAt: -1 });
    return res.status(200).json({ expenses });
  } catch (error) {
    console.error('List expenses error:', error);
    return res.status(500).json({ message: 'Error listing expenses', error: error.message });
  }
};

export const exportExpenses = async (req, res) => {
  try {
    const query = buildExpenseQuery(req);
    const expenses = await Expense.find(query).populate('employeeId reviewedBy', 'name email').sort({ createdAt: -1 }).lean();
    return sendCsv(res, 'expense-claims.csv', expenses, [
      { label: 'Employee', value: (expense) => expense.employeeId?.name || '' },
      { label: 'Email', value: (expense) => expense.employeeId?.email || '' },
      { label: 'Category', value: (expense) => expense.category || '' },
      { label: 'Amount', value: (expense) => expense.amount ?? '' },
      { label: 'Expense Date', value: (expense) => expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('en-IN') : '' },
      { label: 'Description', value: (expense) => expense.description || '' },
      { label: 'Status', value: (expense) => expense.status || '' },
      { label: 'Reviewed By', value: (expense) => expense.reviewedBy?.name || '' },
      { label: 'Review Note', value: (expense) => expense.reviewNote || '' },
      { label: 'Submitted On', value: (expense) => expense.createdAt ? new Date(expense.createdAt).toLocaleDateString('en-IN') : '' },
    ]);
  } catch (error) {
    console.error('Export expenses error:', error);
    return res.status(500).json({ message: 'Error exporting expenses', error: error.message });
  }
};

export const reviewExpense = async (req, res) => {
  try {
    const id = req.params.id;
    const action = req.body?.action;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });
    if (!isApprover(req.user)) return res.status(403).json({ message: 'Insufficient permissions to review expenses' });

    const companyId = req.user?.companyId;
    const expense = await Expense.findOne(companyId ? { _id: id, companyId } : { _id: id }).populate('employeeId', 'name email');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.status !== 'pending') return res.status(409).json({ message: 'This expense has already been reviewed' });
    if (action === 'reject' && !req.body?.reviewNote?.trim()) return res.status(400).json({ message: 'reviewNote is required when rejecting an expense' });

    const previousStatus = expense.status;
    expense.status = action === 'approve' ? 'approved' : 'rejected';
    expense.reviewedBy = req.user.id;
    expense.reviewedAt = new Date();
    expense.reviewNote = String(req.body?.reviewNote || '').trim();
    await expense.save();

    await Notification.create({
      companyId,
      recipientId: expense.employeeId._id,
      type: `EXPENSE_${expense.status.toUpperCase()}`,
      title: `Expense ${expense.status}`,
      message: `Your ${expense.category.toLowerCase().replace(/_/g, ' ')} expense of ${expense.amount} was ${expense.status}${expense.reviewNote ? `: ${expense.reviewNote}` : ''}`,
    });
    await recordAudit(req, `expense_${expense.status}`, { companyId, entityId: expense._id, module: 'expenses', oldValue: { status: previousStatus }, newValue: { status: expense.status, reviewNote: expense.reviewNote } });

    return res.status(200).json({ message: 'Expense updated', expense });
  } catch (error) {
    console.error('Review expense error:', error);
    return res.status(500).json({ message: 'Error reviewing expense', error: error.message });
  }
};

const defaultTravelAllowance = { ratePerKm: 0, dailyAllowance: 0 };

export const getExpenseSettings = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId).select('travelAllowance').lean();
    return res.status(200).json({ travelAllowance: company?.travelAllowance || defaultTravelAllowance });
  } catch (error) {
    return res.status(500).json({ message: 'Error loading expense settings', error: error.message });
  }
};

export const updateExpenseSettings = async (req, res) => {
  try {
    const ratePerKm = Number(req.body?.ratePerKm);
    const dailyAllowance = Number(req.body?.dailyAllowance);
    if (![ratePerKm, dailyAllowance].every((value) => Number.isFinite(value) && value >= 0)) {
      return res.status(400).json({ message: 'Rate per km and daily allowance must be zero or more' });
    }
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    const oldValue = company.travelAllowance;
    company.travelAllowance = { ratePerKm, dailyAllowance };
    await company.save();
    await recordAudit(req, 'expense_settings_updated', { companyId: company._id, entityId: company._id, module: 'expenses', oldValue, newValue: company.travelAllowance });
    return res.status(200).json({ travelAllowance: company.travelAllowance });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Sums point-to-point distance between a rep's logged visit locations per day
// and applies the company rate + daily allowance. Does not include home legs.
export const previewTravelClaim = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    let employeeId = req.user.id;
    if (req.query.employeeId && isApprover(req.user)) employeeId = req.query.employeeId;
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
      return res.status(400).json({ message: 'A valid from and to date is required' });
    }
    to.setHours(23, 59, 59, 999);
    const company = await Company.findById(companyId).select('travelAllowance').lean();
    const ratePerKm = Number(req.query.ratePerKm ?? company?.travelAllowance?.ratePerKm ?? 0);
    const dailyAllowance = Number(req.query.dailyAllowance ?? company?.travelAllowance?.dailyAllowance ?? 0);

    const visits = await Visit.find({
      companyId,
      employeeId,
      status: { $in: ['completed', 'approved'] },
      visitLatitude: { $ne: null },
      visitLongitude: { $ne: null },
      visitedAt: { $gte: from, $lte: to },
    }).select('visitLatitude visitLongitude visitedAt').sort({ visitedAt: 1 }).lean();

    const summary = summariseTravelClaim(visits, ratePerKm, dailyAllowance);
    return res.status(200).json({ from, to, ratePerKm, dailyAllowance, ...summary });
  } catch (error) {
    console.error('Preview travel claim error:', error);
    return res.status(500).json({ message: 'Error calculating travel claim', error: error.message });
  }
};

export default { applyExpense, listExpenses, exportExpenses, reviewExpense, getExpenseSettings, updateExpenseSettings, previewTravelClaim };
