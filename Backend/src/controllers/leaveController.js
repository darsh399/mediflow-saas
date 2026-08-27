import Leave from '../models/Leave.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Holiday from '../models/Holiday.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveActionHistory from '../models/LeaveActionHistory.js';
import Notification from '../models/Notification.js';
import leaveService from '../services/leaveService.js';
import recordAudit from '../utils/audit.js';
import { hasAnyRole } from '../utils/authorize.js';
import { countWorkingDays, calendarDaySpan } from '../utils/workingDays.js';
import { sendCsv } from '../utils/csv.js';

// Who can see every leave request in the company. Leave review is reserved for
// hr_manager, company_owner and admin (plus people managers over their own
// reports) — normal hr gets none of this, same as a plain employee: they only
// see their own leave requests.
const VIEWER_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager', 'project_manager', 'superadmin', 'super_admin'];
// Who can actually approve/reject/cancel a leave request. Same set as
// VIEWER_ROLES — reviewing implies acting here.
const APPROVER_ROLES = VIEWER_ROLES;

const isViewer = (user) => hasAnyRole(user, VIEWER_ROLES);
const isApprover = (user) => hasAnyRole(user, APPROVER_ROLES);

export const applyLeave = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const { leaveType, fromDate, toDate, reason } = req.body || {};
    if (!leaveType || !fromDate || !toDate || !reason?.trim()) {
      return res.status(400).json({ message: 'Leave type, dates, and reason are required' });
    }
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return res.status(400).json({ message: 'Valid leave dates are required' });
    if (end < start) {
      return res.status(400).json({ message: 'To date cannot be before from date' });
    }
    const policy = await leaveService.getPolicy(companyId);
    const leavePolicy = policy.leaveTypes.find(type => type.code === String(leaveType).toUpperCase() && type.enabled);
    if (!leavePolicy) return res.status(400).json({ message: 'Leave type is not available for this company' });
    // Charge leave only for the days the employee would actually have worked —
    // skip weekly off days and COMPANY holidays that fall inside the range.
    const [company, companyHolidays] = await Promise.all([
      Company.findById(companyId).select('weeklyWorkingDays').lean(),
      Holiday.find({
        companyId,
        active: true,
        type: 'COMPANY',
        date: { $lte: end },
        $or: [{ endDate: { $gte: start } }, { endDate: null, date: { $gte: start } }],
      }).select('date endDate').lean(),
    ]);
    const calendarDays = calendarDaySpan(start, end);
    const days = countWorkingDays(start, end, company?.weeklyWorkingDays, companyHolidays);
    if (days < 1) return res.status(400).json({ message: 'The selected dates fall entirely on weekly offs or company holidays' });
    const now = new Date();
    const minimumDate = new Date(now);
    minimumDate.setHours(0, 0, 0, 0);
    minimumDate.setDate(minimumDate.getDate() + leavePolicy.minimumNoticeDays);
    if (start < minimumDate) return res.status(400).json({ message: `This leave requires ${leavePolicy.minimumNoticeDays} day(s) notice` });
    if (leavePolicy.maximumConsecutiveDays && calendarDays > leavePolicy.maximumConsecutiveDays) return res.status(400).json({ message: `Maximum consecutive days allowed is ${leavePolicy.maximumConsecutiveDays}` });
    const employee = await User.findOne({ _id: userId, companyId }).select('employeeStatus role name');
    if (employee?.employeeStatus === 'PROBATION' && !leavePolicy.allowDuringProbation) return res.status(400).json({ message: 'This leave type is not available during probation' });
    if (leavePolicy.documentRequired && !req.file) return res.status(400).json({ message: 'A supporting document is required for this leave type' });
    if (leavePolicy.code !== 'UNPAID') {
      const balances = await leaveService.ensureAccrual(companyId, userId);
      const balance = balances.find(item => item.leaveTypeCode === leavePolicy.code);
      if (!balance || balance.available - balance.pending < days) return res.status(400).json({ message: `Insufficient ${leavePolicy.name} balance` });
    }
    const overlap = await Leave.findOne({ companyId, userId, status: { $in: ['pending', 'approved'] }, $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }, { fromDate: { $lte: end }, toDate: { $gte: start } }] });
    if (overlap) return res.status(409).json({ message: 'Leave dates overlap an existing request' });
    const data = {
      companyId, userId, appliedBy: req.user?.id,
      leaveType, fromDate, toDate, reason: reason.trim(),
      type: leaveType.toLowerCase() === 'sick' ? 'sick' : leaveType.toLowerCase() === 'unpaid' ? 'unpaid' : leaveType === 'OTHER' ? 'other' : 'annual',
      startDate: fromDate, endDate: toDate,
      numberOfDays: days,
      calendarDays,
    };
    if (req.file) data.document = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/leaves/${req.file.filename}`,
    };
    const leave = new Leave(data);
    await leave.save();
    if (leavePolicy.code !== 'UNPAID') await LeaveBalance.updateOne({ companyId, employeeId: userId, leaveTypeCode: leavePolicy.code }, { $inc: { pending: days } });
    await LeaveActionHistory.create({ companyId, leaveId: leave._id, action: 'APPLIED', actorId: req.user.id, actorName: employee?.name || req.user.email, actorRole: req.user.role, newStatus: leave.status });
    await recordAudit(req, 'leave_applied', { companyId, entityId: leave._id, module: 'leaves', newValue: { leaveType: leave.leaveType, numberOfDays: days } });
    return res.status(201).json({ message: 'Leave applied', leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Error applying leave', error: error.message });
  }
};

// Shared by listLeaves and exportLeaves so the CSV export always reflects
// exactly the same company-scoping/visibility rules as the on-screen list.
function buildLeaveQuery(req) {
  const companyId = req.user?.companyId;
  const query = companyId ? { companyId } : {};
  if (req.query.mine === 'true' || !isViewer(req.user)) query.userId = req.user.id;
  if (req.query.status) query.status = String(req.query.status).toLowerCase();
  if (req.query.leaveType) query.leaveType = String(req.query.leaveType).toUpperCase();
  if (req.query.from || req.query.to) {
    const from = new Date(`${req.query.from || req.query.to}T00:00:00.000Z`);
    const to = new Date(`${req.query.to || req.query.from}T23:59:59.999Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return { error: 'Invalid leave date range' };
    query.$or = [
      { startDate: { $lte: to }, endDate: { $gte: from } },
      { fromDate: { $lte: to }, toDate: { $gte: from } },
    ];
  }
  return { query };
}

export const listLeaves = async (req, res) => {
  try {
    const { query, error } = buildLeaveQuery(req);
    if (error) return res.status(400).json({ message: error });
    const leaves = await Leave.find(query).populate('userId appliedBy reviewedBy', '-password');
    return res.status(200).json({ leaves });
  } catch (error) {
    console.error('List leaves error:', error);
    return res.status(500).json({ message: 'Error listing leaves', error: error.message });
  }
};

export const exportLeaves = async (req, res) => {
  try {
    const { query, error } = buildLeaveQuery(req);
    if (error) return res.status(400).json({ message: error });
    const leaves = await Leave.find(query).populate('userId reviewedBy', 'name email').sort({ createdAt: -1 }).lean();
    return sendCsv(res, 'leave-requests.csv', leaves, [
      { label: 'Employee', value: (leave) => leave.userId?.name || '' },
      { label: 'Email', value: (leave) => leave.userId?.email || '' },
      { label: 'Leave Type', value: (leave) => leave.leaveType || leave.type || '' },
      { label: 'From', value: (leave) => (leave.fromDate || leave.startDate) ? new Date(leave.fromDate || leave.startDate).toLocaleDateString('en-IN') : '' },
      { label: 'To', value: (leave) => (leave.toDate || leave.endDate) ? new Date(leave.toDate || leave.endDate).toLocaleDateString('en-IN') : '' },
      { label: 'Days', value: (leave) => leave.numberOfDays ?? '' },
      { label: 'Reason', value: (leave) => leave.reason || '' },
      { label: 'Status', value: (leave) => leave.status || '' },
      { label: 'Reviewed By', value: (leave) => leave.reviewedBy?.name || '' },
      { label: 'Review Note', value: (leave) => leave.reviewNote || '' },
      { label: 'Applied On', value: (leave) => leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('en-IN') : '' },
    ]);
  } catch (error) {
    console.error('Export leaves error:', error);
    return res.status(500).json({ message: 'Error exporting leaves', error: error.message });
  }
};

export const reviewLeave = async (req, res) => {
  try {
    const id = req.params.id;
    const action = req.body.action;
    if (!['approve','reject','cancel'].includes(action)) return res.status(400).json({ message: 'Invalid action' });
    const companyId = req.user?.companyId;
    const leave = await Leave.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (!isApprover(req.user)) return res.status(403).json({ message: 'Insufficient permissions to review leave' });
    if (leave.status !== 'pending' && !(action === 'cancel' && leave.status === 'approved')) return res.status(409).json({ message: 'This leave request has already been processed' });
    const actor = await User.findById(req.user.id).select('name role');
    const previousStatus = leave.status;
    const leaveType = String(leave.leaveType || '').toUpperCase();
    const days = leave.numberOfDays || Math.floor((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
    if (action === 'approve' && leaveType !== 'UNPAID') await leaveService.changeBalance({ companyId, employeeId: leave.userId, leaveTypeCode: leaveType, amount: -days, transactionType: 'LEAVE_APPROVED', source: 'leave_approval', referenceId: leave._id, description: `Approved leave for ${days} day(s)`, performedBy: req.user.id });
    if (action === 'cancel' && previousStatus === 'approved' && leaveType !== 'UNPAID') await leaveService.changeBalance({ companyId, employeeId: leave.userId, leaveTypeCode: leaveType, amount: days, transactionType: 'LEAVE_CANCELLED', source: 'leave_cancellation', referenceId: leave._id, description: `Cancelled leave restored ${days} day(s)`, performedBy: req.user.id });
    if (leaveType !== 'UNPAID') await LeaveBalance.updateOne({ companyId, employeeId: leave.userId, leaveTypeCode: leaveType }, { $inc: { pending: previousStatus === 'pending' ? -days : 0 } });
    leave.status = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'cancelled');
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    leave.reviewNote = String(req.body.reviewNote || '').trim();
    await leave.save();
    const historyAction = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CANCELLED';
    await LeaveActionHistory.create({ companyId, leaveId: leave._id, action: historyAction, actorId: req.user.id, actorName: actor?.name || req.user.email, actorRole: req.user.role, comment: leave.reviewNote, previousStatus, newStatus: leave.status });
    const actionLabel = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled';
    await Notification.create({ companyId, recipientId: leave.userId, type: `LEAVE_${historyAction}`, title: `Leave ${actionLabel}`, message: `Your ${leave.leaveType} leave request was ${actionLabel} by ${actor?.name || req.user.email}${leave.reviewNote ? `: ${leave.reviewNote}` : ''}` });
    await recordAudit(req, `leave_${historyAction.toLowerCase()}`, { companyId, entityId: leave._id, module: 'leaves', oldValue: { status: previousStatus }, newValue: { status: leave.status, reviewNote: leave.reviewNote } });
    return res.status(200).json({ message: 'Leave updated', leave });
  } catch (error) {
    console.error('Review leave error:', error);
    return res.status(500).json({ message: 'Error reviewing leave', error: error.message });
  }
};

export default { applyLeave, listLeaves, exportLeaves, reviewLeave };
