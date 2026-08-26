import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import attendanceService, { calculateWorkingHours, startOfDay, endOfDay } from '../services/attendanceService.js'
import recordAudit from '../utils/audit.js'

const reviewerRoles = ['admin', 'company_owner', 'hr_manager', 'hr']

function isReviewer(user) {
  return reviewerRoles.includes(user.role)
}

function parseDate(value, field) {
  if (value === undefined || value === null || value === '') return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${field}`)
  return date
}

function addDays(value, days) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

// Mirrors how attendance dates are already stored (startOfDay/endOfDay use
// server-local time, not a fixed IST offset like the visits module), so the
// range presets here stay in sync with the plain calendar-date filtering
// listAttendance already does for month/year.
function getAttendanceDateRange(query, now = new Date()) {
  const range = String(query.range || 'LAST_7_DAYS').toUpperCase()
  let start = parseDate(query.startDate, 'startDate')
  let end = parseDate(query.endDate, 'endDate')
  if (!start && !end) {
    const today = startOfDay(now)
    if (range === 'TODAY') { start = today; end = today }
    else if (range === 'YESTERDAY') { start = addDays(today, -1); end = start }
    else if (range === 'LAST_7_DAYS') { start = addDays(today, -6); end = today }
    else if (range === 'THIS_MONTH') { start = new Date(today.getFullYear(), today.getMonth(), 1); end = today }
    else if (range === 'LAST_MONTH') { start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0) }
    else if (range === 'LAST_3_MONTHS') { start = new Date(today.getFullYear(), today.getMonth() - 2, 1); end = today }
    else { start = addDays(today, -6); end = today }
  }
  if (!start || !end) throw new Error('Both startDate and endDate are required')
  const rangeStart = startOfDay(start)
  const rangeEnd = endOfDay(end)
  if (rangeStart >= rangeEnd) throw new Error('startDate cannot be after endDate')
  return { start: rangeStart, end: rangeEnd }
}

export async function checkIn(req, res) {
  try {
    const attendance = await attendanceService.checkIn({ companyId: req.user.companyId, employeeId: req.user.id, location: req.body?.location, userAgent: req.get('user-agent'), platform: req.body?.platform })
    await recordAudit(req, 'attendance_check_in', { companyId: req.user.companyId, entityId: attendance._id, module: 'attendance' })
    return res.status(201).json({ message: 'Checked in', attendance })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function checkOut(req, res) {
  try {
    const attendance = await attendanceService.checkOut({ companyId: req.user.companyId, employeeId: req.user.id, location: req.body?.location })
    await recordAudit(req, 'attendance_check_out', { companyId: req.user.companyId, entityId: attendance._id, module: 'attendance', newValue: { totalWorkingHours: attendance.totalWorkingHours } })
    return res.status(200).json({ message: 'Checked out', attendance })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function toggleBreak(req, res) {
  try {
    const attendance = await attendanceService.toggleBreak({ companyId: req.user.companyId, employeeId: req.user.id })
    return res.status(200).json({ message: attendance.breaks.at(-1)?.endedAt ? 'Break ended' : 'Break started', attendance })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getTodayAttendance(req, res) {
  const attendance = await attendanceService.getToday(req.user.companyId, req.user.id)
  if (attendance) {
    const openSession = attendance.sessions?.find((session) => !session.checkOut)
    return res.status(200).json({ attendance, live: { checkedIn: Boolean(openSession), activeSession: openSession || null, totalWorkingHours: attendance.totalWorkingHours || 0, sessions: attendance.sessions || [] } })
  }
  return res.status(200).json({ attendance })
}

export async function requestCorrection(req, res) {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, companyId: req.user.companyId, employeeId: req.user.id })
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' })
    if (attendance.correction?.status === 'PENDING') return res.status(409).json({ message: 'A correction request is already pending' })
    const checkIn = parseDate(req.body?.checkIn, 'checkIn')
    const checkOut = parseDate(req.body?.checkOut, 'checkOut')
    if (!checkIn && !checkOut) return res.status(400).json({ message: 'A corrected check-in or check-out is required' })
    if (checkIn && checkOut && checkOut <= checkIn) return res.status(400).json({ message: 'Check-out must be after check-in' })
    attendance.correction = { checkIn, checkOut, reason: String(req.body?.reason || '').trim(), status: 'PENDING', requestedAt: new Date() }
    await attendance.save()
    await recordAudit(req, 'attendance_correction_requested', { companyId: req.user.companyId, entityId: attendance._id, module: 'attendance', newValue: attendance.correction })
    return res.status(201).json({ message: 'Correction requested', attendance })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function reviewCorrection(req, res) {
  try {
    if (!isReviewer(req.user)) return res.status(403).json({ message: 'Insufficient permissions' })
    const action = req.body?.action
    if (!['APPROVED', 'REJECTED'].includes(action)) return res.status(400).json({ message: 'Action must be APPROVED or REJECTED' })
    const attendance = await Attendance.findOne({ _id: req.params.id, companyId: req.user.companyId })
    if (!attendance?.correction || attendance.correction.status !== 'PENDING') return res.status(404).json({ message: 'Pending correction not found' })
    const oldValue = { checkIn: attendance.checkIn, checkOut: attendance.checkOut, status: attendance.status }
    if (action === 'APPROVED') {
      attendance.checkIn = attendance.correction.checkIn || attendance.checkIn
      attendance.checkOut = attendance.correction.checkOut || attendance.checkOut
      attendance.totalWorkingHours = calculateWorkingHours(attendance)
      attendance.status = attendance.totalWorkingHours < 4 ? 'HALF_DAY' : 'PRESENT'
    }
    attendance.correction.status = action
    attendance.correction.reviewedAt = new Date()
    attendance.correction.reviewedBy = req.user.id
    await attendance.save()
    await recordAudit(req, 'attendance_correction_reviewed', { companyId: req.user.companyId, entityId: attendance._id, module: 'attendance', oldValue, newValue: { action, checkIn: attendance.checkIn, checkOut: attendance.checkOut, status: attendance.status } })
    return res.status(200).json({ message: `Correction ${action.toLowerCase()}`, attendance })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function listAttendance(req, res) {
  try {
    const filter = { companyId: req.user.companyId }
    if (req.query.employeeId) filter.employeeId = req.query.employeeId
    if (req.query.status) filter.status = req.query.status
    if (req.query.date) {
      const date = parseDate(req.query.date, 'date')
      filter.date = { $gte: startOfDay(date), $lt: endOfDay(date) }
    } else if (req.query.month || req.query.year) {
      const now = new Date()
      const year = Number(req.query.year) || now.getFullYear()
      const month = req.query.month ? Number(req.query.month) : null
      if (month && (month < 1 || month > 12)) return res.status(400).json({ message: 'month must be between 1 and 12' })
      const rangeStart = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
      const rangeEnd = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1)
      filter.date = { $gte: rangeStart, $lt: rangeEnd }
    }
    if (!isReviewer(req.user)) filter.employeeId = req.user.id
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100)
    const [attendance, total] = await Promise.all([
      Attendance.find(filter).populate('employeeId', 'name email role').sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ])
    return res.status(200).json({ attendance, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function listEmployeeAttendance(req, res) {
  try {
    if (!isReviewer(req.user)) return res.status(403).json({ message: 'Insufficient permissions to view employee attendance records' })
    const employee = await User.findOne({ _id: req.params.employeeId, companyId: req.user.companyId }).select('_id name email role employeeId active').lean()
    if (!employee) return res.status(404).json({ message: 'Employee not found in this company' })
    const { start, end } = getAttendanceDateRange(req.query)
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 31, 1), 100)
    const filter = { companyId: req.user.companyId, employeeId: employee._id, date: { $gte: start, $lt: end } }
    const [attendance, total, summaryAgg] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Attendance.countDocuments(filter),
      Attendance.aggregate([
        { $match: filter },
        { $addFields: { breakMs: { $sum: { $map: { input: { $ifNull: ['$sessions', []] }, as: 'session', in: { $sum: { $map: { input: { $ifNull: ['$$session.breaks', []] }, as: 'brk', in: { $cond: [{ $and: ['$$brk.startedAt', '$$brk.endedAt'] }, { $subtract: ['$$brk.endedAt', '$$brk.startedAt'] }, 0] } } } } } } } } },
        { $group: { _id: null, totalWorkingHours: { $sum: '$totalWorkingHours' }, totalBreakMs: { $sum: '$breakMs' }, presentDays: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE', 'HALF_DAY']] }, 1, 0] } }, halfDays: { $sum: { $cond: [{ $eq: ['$status', 'HALF_DAY'] }, 1, 0] } }, absentDays: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } }, totalDays: { $sum: 1 } } },
      ]),
    ])
    const raw = summaryAgg[0] || { totalWorkingHours: 0, totalBreakMs: 0, presentDays: 0, halfDays: 0, absentDays: 0, totalDays: 0 }
    const summary = {
      totalDays: raw.totalDays,
      presentDays: raw.presentDays,
      halfDays: raw.halfDays,
      absentDays: raw.absentDays,
      totalWorkingHours: Number((raw.totalWorkingHours || 0).toFixed(2)),
      totalBreakHours: Number(((raw.totalBreakMs || 0) / 3600000).toFixed(2)),
      averageWorkingHours: raw.totalDays ? Number((raw.totalWorkingHours / raw.totalDays).toFixed(2)) : 0,
    }
    return res.status(200).json({ employee, attendance, summary, dateRange: { startDate: start, endDate: end }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to load employee attendance history' })
  }
}

export async function listEmployees(req, res) {
  const employees = await User.find({ companyId: req.user.companyId, role: { $nin: ['super_admin', 'admin'] } }).select('_id name email role').sort({ name: 1 }).lean()
  return res.status(200).json({ employees })
}

export default { checkIn, checkOut, toggleBreak, getTodayAttendance, requestCorrection, reviewCorrection, listAttendance, listEmployeeAttendance, listEmployees }
