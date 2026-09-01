import WorkforceShift from '../models/WorkforceShift.js'
import User from '../models/User.js'

const managerRoles = ['admin', 'company_owner', 'hr_manager', 'manager']

function dateWindow(query) {
  const from = query.from ? new Date(query.from) : new Date('1970-01-01')
  const to = query.to ? new Date(query.to) : new Date('2999-12-31')
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null
  to.setHours(23, 59, 59, 999)
  return { $gte: from, $lte: to }
}

export async function listShifts(req, res) {
  const date = dateWindow(req.query)
  if (!date) return res.status(400).json({ message: 'Invalid shift date range' })
  const filter = { companyId: req.user.companyId, date }
  if (managerRoles.includes(req.user.role)) {
    if (req.query.employeeId) filter.employeeId = req.query.employeeId
  } else {
    filter.employeeId = req.user.id
  }
  const shifts = await WorkforceShift.find(filter).populate('employeeId', 'name email role').sort({ date: 1, startTime: 1 }).lean()
  return res.json({ shifts })
}

export async function createShift(req, res) {
  if (!managerRoles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' })
  const { employeeId, date, startTime, endTime, notes } = req.body || {}
  if (!employeeId || !date || !startTime || !endTime) return res.status(400).json({ message: 'employeeId, date, startTime and endTime are required' })
  const employee = await User.findOne({ _id: employeeId, companyId: req.user.companyId }).select('_id')
  if (!employee) return res.status(404).json({ message: 'Employee not found in this company' })
  const shift = await WorkforceShift.create({ companyId: req.user.companyId, employeeId, date, startTime, endTime, notes, createdBy: req.user.id })
  return res.status(201).json({ shift })
}

export async function updateShift(req, res) {
  if (!managerRoles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' })
  const fields = ['employeeId', 'date', 'startTime', 'endTime', 'notes']
  const update = Object.fromEntries(fields.filter((field) => req.body?.[field] !== undefined).map((field) => [field, req.body[field]]))
  const shift = await WorkforceShift.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, { $set: update }, { new: true, runValidators: true })
  if (!shift) return res.status(404).json({ message: 'Shift not found' })
  return res.json({ shift })
}

export async function deleteShift(req, res) {
  if (!managerRoles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' })
  const shift = await WorkforceShift.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId })
  if (!shift) return res.status(404).json({ message: 'Shift not found' })
  return res.json({ message: 'Shift deleted' })
}
