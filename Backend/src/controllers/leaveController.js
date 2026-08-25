import Leave from '../models/Leave.js';
import User from '../models/User.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveActionHistory from '../models/LeaveActionHistory.js';
import Notification from '../models/Notification.js';
import leaveService from '../services/leaveService.js';
import recordAudit from '../utils/audit.js';

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
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return res.status(400).json({ message: 'Valid leave dates are required' });
    if (end < start) {
      return res.status(400).json({ message: 'To date cannot be before from date' });
    }
    const policy = await leaveService.getPolicy(companyId);
    const leavePolicy = policy.leaveTypes.find(type => type.code === String(leaveType).toUpperCase() && type.enabled);
    if (!leavePolicy) return res.status(400).json({ message: 'Leave type is not available for this company' });
    const days = Math.floor((new Date(end).setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0)) / 86400000) + 1;
    const now = new Date();
    const minimumDate = new Date(now);
    minimumDate.setHours(0, 0, 0, 0);
    minimumDate.setDate(minimumDate.getDate() + leavePolicy.minimumNoticeDays);
    if (start < minimumDate) return res.status(400).json({ message: `This leave requires ${leavePolicy.minimumNoticeDays} day(s) notice` });
    if (leavePolicy.maximumConsecutiveDays && days > leavePolicy.maximumConsecutiveDays) return res.status(400).json({ message: `Maximum consecutive days allowed is ${leavePolicy.maximumConsecutiveDays}` });
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
    const action = req.body.action;
    if (!['approve','reject','cancel'].includes(action)) return res.status(400).json({ message: 'Invalid action' });
    const companyId = req.user?.companyId;
    const leave = await Leave.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (!isReviewer(req.user)) return res.status(403).json({ message: 'Insufficient permissions to review leave' });
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

export default { applyLeave, listLeaves, reviewLeave };
