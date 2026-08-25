import LeaveActionHistory from '../models/LeaveActionHistory.js'
import leaveService from '../services/leaveService.js'
import Leave from '../models/Leave.js'
import User from '../models/User.js'
import recordAudit from '../utils/audit.js'

export async function getPolicy(req, res) {
  const policy = await leaveService.getPolicy(req.user.companyId)
  return res.status(200).json({ policy })
}

export async function updatePolicy(req, res) {
  try {
    const policy = await leaveService.upsertPolicy(req.user.companyId, req.body?.leaveTypes, req.user.id)
    await recordAudit(req, 'leave_policy_updated', { companyId: req.user.companyId, entityId: policy._id, module: 'leaves', newValue: { leaveTypes: policy.leaveTypes } })
    return res.status(200).json({ message: 'Leave policy updated', policy })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getMyBalances(req, res) {
  try {
    const balances = await leaveService.ensureAccrual(req.user.companyId, req.user.id)
    const policy = await leaveService.getPolicy(req.user.companyId)
    return res.status(200).json({ balances, policy })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getEmployeeBalances(req, res) {
  try {
    const employee = await User.findOne({ _id: req.params.employeeId, companyId: req.user.companyId }).select('_id name email role')
    if (!employee) return res.status(404).json({ message: 'Employee not found' })
    const balances = await leaveService.ensureAccrual(req.user.companyId, employee._id)
    return res.status(200).json({ employee, balances })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getEmployeeLedger(req, res) {
  try {
    const employee = await User.findOne({ _id: req.params.employeeId, companyId: req.user.companyId }).select('_id name email role')
    if (!employee) return res.status(404).json({ message: 'Employee not found' })
    const ledger = await leaveService.getLedger(req.user.companyId, employee._id, req.query.leaveTypeCode)
    return res.status(200).json({ employee, ledger })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function adjustBalance(req, res) {
  try {
    const employee = await User.findOne({ _id: req.params.employeeId, companyId: req.user.companyId }).select('_id')
    if (!employee) return res.status(404).json({ message: 'Employee not found' })
    const amount = Number(req.body?.amount)
    if (!Number.isFinite(amount) || amount === 0) return res.status(400).json({ message: 'A non-zero adjustment amount is required' })
    if (!String(req.body?.reason || '').trim()) return res.status(400).json({ message: 'A reason is required for balance adjustment' })
    const balance = await leaveService.changeBalance({ companyId: req.user.companyId, employeeId: employee._id, leaveTypeCode: req.body.leaveTypeCode, amount, transactionType: 'MANUAL_ADJUSTMENT', source: 'manual_adjustment', description: req.body.reason.trim(), performedBy: req.user.id })
    await recordAudit(req, 'leave_balance_adjusted', { companyId: req.user.companyId, entityId: employee._id, module: 'leaves', newValue: { leaveTypeCode: req.body.leaveTypeCode, amount, reason: req.body.reason.trim() } })
    return res.status(200).json({ message: 'Leave balance adjusted', balance })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getLeaveHistory(req, res) {
  const leave = await Leave.findOne({ _id: req.params.leaveId, companyId: req.user.companyId }).select('_id userId leaveType fromDate toDate status reason reviewNote')
  if (!leave) return res.status(404).json({ message: 'Leave not found' })
  if (String(leave.userId) !== String(req.user.id) && !['admin', 'company_owner', 'hr_manager', 'hr', 'manager', 'project_manager'].includes(req.user.role)) return res.status(403).json({ message: 'Leave history access denied' })
  const history = await LeaveActionHistory.find({ leaveId: leave._id, companyId: req.user.companyId }).sort({ createdAt: 1 }).lean()
  return res.status(200).json({ leave, history })
}

export default { getPolicy, updatePolicy, getMyBalances, getEmployeeBalances, getEmployeeLedger, adjustBalance, getLeaveHistory }
