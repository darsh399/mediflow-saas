import Leave from '../models/Leave.js';
import { hasAnyRole } from '../utils/authorize.js';

const REVIEWER_ROLES = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager', 'project_manager', 'superadmin', 'super_admin'];

const isReviewer = (user) => hasAnyRole(user, REVIEWER_ROLES);

export const applyLeave = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const { leaveType, fromDate, toDate, reason } = req.body || {};
    if (!leaveType || !fromDate || !toDate || !reason?.trim()) {
      return res.status(400).json({ message: 'Leave type, dates, and reason are required' });
    }
    if (new Date(toDate) < new Date(fromDate)) {
      return res.status(400).json({ message: 'To date cannot be before from date' });
    }
    const data = {
      companyId, userId, appliedBy: req.user?.id,
      leaveType, fromDate, toDate, reason: reason.trim(),
      // Keep legacy fields populated for existing screens and reports.
      type: leaveType.toLowerCase() === 'sick' ? 'sick' : leaveType.toLowerCase() === 'unpaid' ? 'unpaid' : leaveType === 'OTHER' ? 'other' : 'annual',
      startDate: fromDate, endDate: toDate,
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
    return res.status(201).json({ message: 'Leave applied', leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Error applying leave', error: error.message });
  }
};

export const listLeaves = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const query = companyId ? { companyId } : {};
    // The personal endpoint is also used by reviewers on their own leave pages.
    if (req.query.mine === 'true' || !isReviewer(req.user)) query.userId = req.user.id;
    const leaves = await Leave.find(query).populate('userId appliedBy reviewedBy', '-password');
    return res.status(200).json({ leaves });
  } catch (error) {
    console.error('List leaves error:', error);
    return res.status(500).json({ message: 'Error listing leaves', error: error.message });
  }
};

export const reviewLeave = async (req, res) => {
  try {
    const id = req.params.id;
    const action = req.body.action; // 'approve' | 'reject' | 'cancel'
    if (!['approve','reject','cancel'].includes(action)) return res.status(400).json({ message: 'Invalid action' });
    const companyId = req.user?.companyId;
    const leave = await Leave.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    // Only users with privileged roles can review
    if (!isReviewer(req.user)) return res.status(403).json({ message: 'Insufficient permissions to review leave' });
    leave.status = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'cancelled');
    leave.reviewedBy = req.user.id;
    leave.reviewNote = String(req.body.reviewNote || '').trim();
    await leave.save();
    return res.status(200).json({ message: 'Leave updated', leave });
  } catch (error) {
    console.error('Review leave error:', error);
    return res.status(500).json({ message: 'Error reviewing leave', error: error.message });
  }
};

export default { applyLeave, listLeaves, reviewLeave };
