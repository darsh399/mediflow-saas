import Leave from '../models/Leave.js';
import { hasAnyRole } from '../utils/authorize.js';

export const applyLeave = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.body.userId || req.user?.id;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const data = { ...(req.body || {}), companyId, userId, appliedBy: req.user?.id };
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
    const allowed = ['admin','hr','manager','superadmin','super_admin'];
    if (!hasAnyRole(req.user, allowed)) return res.status(403).json({ message: 'Insufficient permissions to review leave' });
    leave.status = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'cancelled');
    leave.reviewedBy = req.user.id;
    await leave.save();
    return res.status(200).json({ message: 'Leave updated', leave });
  } catch (error) {
    console.error('Review leave error:', error);
    return res.status(500).json({ message: 'Error reviewing leave', error: error.message });
  }
};

export default { applyLeave, listLeaves, reviewLeave };
