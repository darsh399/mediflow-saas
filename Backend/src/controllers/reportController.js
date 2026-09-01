import mongoose from 'mongoose'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Expense from '../models/Expense.js'
import Visit from '../models/Visit.js'
import Sale from '../models/Sale.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { sendCsv } from '../utils/csv.js'
import { hasPermission } from '../config/permissions.js'
import { scopedEmployeeIds } from '../utils/teamScope.js'

const oid = (value) => new mongoose.Types.ObjectId(value)
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

// Resolve the reporting window from the query. Defaults to the current month.
function resolveWindow(query) {
  if (query.from || query.to) {
    const start = query.from ? new Date(query.from) : new Date('1970-01-01')
    const end = query.to ? new Date(query.to) : new Date()
    end.setDate(end.getDate() + 1)
    return { start, end, label: `${fmtDate(start)} – ${fmtDate(query.to || end)}` }
  }
  const now = new Date()
  const month = Number(query.month) || now.getMonth() + 1
  const year = Number(query.year) || now.getFullYear()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end, label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
}

// Employee scope for the caller, optionally narrowed to one employee.
async function resolveEmployeeScope(req) {
  const allowed = await scopedEmployeeIds(req.user)
  if (req.query.employeeId) {
    if (allowed && !allowed.includes(String(req.query.employeeId))) {
      throw Object.assign(new Error('Not allowed to report on that employee'), { status: 403 })
    }
    return [String(req.query.employeeId)]
  }
  return allowed // null = whole company
}

function applyEmployeeFilter(filter, employeeIds, field = 'employeeId') {
  if (employeeIds) filter[field] = { $in: employeeIds.map(oid) }
  return filter
}

async function buildAttendance(req, window, employeeIds) {
  const match = applyEmployeeFilter(
    { companyId: oid(req.user.companyId), date: { $gte: window.start, $lt: window.end } },
    employeeIds
  )
  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$employeeId',
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ['$status', 'HALF_DAY'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
        off: { $sum: { $cond: [{ $in: ['$status', ['HOLIDAY', 'WEEKLY_OFF']] }, 1, 0] } },
        hours: { $sum: '$totalWorkingHours' },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $project: { present: 1, late: 1, halfDay: 1, absent: 1, off: 1, hours: 1, name: { $arrayElemAt: ['$user.name', 0] } } },
    { $sort: { name: 1 } },
  ])

  const columns = [
    { key: 'name', label: 'Employee' },
    { key: 'present', label: 'Present' },
    { key: 'late', label: 'Late' },
    { key: 'halfDay', label: 'Half day' },
    { key: 'absent', label: 'Absent' },
    { key: 'off', label: 'Holiday / off' },
    { key: 'hours', label: 'Total hours' },
  ]
  const summary = {
    Employees: rows.length,
    'Present days': rows.reduce((s, r) => s + r.present, 0),
    'Absent days': rows.reduce((s, r) => s + r.absent, 0),
    'Total hours': rows.reduce((s, r) => s + (r.hours || 0), 0).toFixed(1),
  }
  return {
    columns,
    rows: rows.map((r) => ({ ...r, name: r.name || 'Unknown', hours: Number(r.hours || 0).toFixed(1) })),
    summary,
  }
}

async function buildLeave(req, window, employeeIds) {
  const filter = applyEmployeeFilter(
    { companyId: req.user.companyId, startDate: { $lt: window.end }, endDate: { $gte: window.start } },
    employeeIds,
    'userId'
  )
  const leaves = await Leave.find(filter).populate('userId', 'name').sort({ startDate: -1 }).lean()
  const rows = leaves.map((leave) => ({
    name: leave.userId?.name || 'Unknown',
    type: leave.leaveType || leave.type || '-',
    from: fmtDate(leave.fromDate || leave.startDate),
    to: fmtDate(leave.toDate || leave.endDate),
    days: leave.numberOfDays ?? '',
    status: leave.status,
    reason: leave.reason || '',
  }))
  const columns = [
    { key: 'name', label: 'Employee' },
    { key: 'type', label: 'Type' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' },
  ]
  const summary = {
    Requests: rows.length,
    Approved: rows.filter((r) => String(r.status).toLowerCase() === 'approved').length,
    Pending: rows.filter((r) => String(r.status).toLowerCase() === 'pending').length,
  }
  return { columns, rows, summary }
}

async function buildExpense(req, window, employeeIds) {
  const filter = applyEmployeeFilter(
    { companyId: req.user.companyId, expenseDate: { $gte: window.start, $lt: window.end } },
    employeeIds
  )
  const expenses = await Expense.find(filter).populate('employeeId', 'name').sort({ expenseDate: -1 }).lean()
  const rows = expenses.map((expense) => ({
    name: expense.employeeId?.name || 'Unknown',
    category: String(expense.category || '').replace(/_/g, ' '),
    amount: money(expense.amount),
    _amount: Number(expense.amount || 0),
    date: fmtDate(expense.expenseDate),
    status: expense.status,
    description: expense.description || '',
  }))
  const columns = [
    { key: 'name', label: 'Employee' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'description', label: 'Description' },
  ]
  const approved = rows.filter((r) => r.status === 'approved')
  const summary = {
    Claims: rows.length,
    'Approved value': money(approved.reduce((s, r) => s + r._amount, 0)),
    Pending: rows.filter((r) => r.status === 'pending').length,
  }
  return { columns, rows: rows.map(({ _amount, ...rest }) => rest), summary }
}

async function buildVisits(req, window, employeeIds) {
  const filter = applyEmployeeFilter(
    { companyId: req.user.companyId, visitedAt: { $gte: window.start, $lt: window.end } },
    employeeIds
  )
  if (req.query.doctorResponse) filter.doctorResponse = String(req.query.doctorResponse).toUpperCase()
  const visits = await Visit.find(filter)
    .populate('employeeId', 'name')
    .populate('doctorId', 'name')
    .populate('medicalId', 'name')
    .sort({ visitedAt: -1 })
    .lean()
  const rows = visits.map((visit) => ({
    date: fmtDate(visit.visitedAt),
    name: visit.employeeId?.name || 'Unknown',
    place: visit.doctorId?.name || visit.medicalId?.name || '-',
    response: (visit.doctorResponse || '').replace(/_/g, ' '),
    status: visit.status,
    discussion: visit.discussion || '',
  }))
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Employee' },
    { key: 'place', label: 'Doctor / Chemist' },
    { key: 'response', label: 'Response' },
    { key: 'status', label: 'Status' },
    { key: 'discussion', label: 'Discussion' },
  ]
  const summary = {
    Visits: rows.length,
    Completed: rows.filter((r) => ['completed', 'approved'].includes(r.status)).length,
    'Follow-ups': rows.filter((r) => r.response === 'FOLLOW UP REQUIRED').length,
  }
  return { columns, rows, summary }
}

async function buildSales(req, window, employeeIds) {
  const filter = applyEmployeeFilter(
    { companyId: req.user.companyId, saleDate: { $gte: window.start, $lt: window.end } },
    employeeIds
  )
  const sales = await Sale.find(filter)
    .populate('employeeId', 'name')
    .populate('doctorId', 'name')
    .populate('productId', 'name')
    .sort({ saleDate: -1 })
    .lean()
  const total = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0)
  const rows = sales.map((sale) => ({
    date: fmtDate(sale.saleDate),
    name: sale.employeeId?.name || 'Unknown',
    doctor: sale.doctorId?.name || '-',
    product: sale.productId?.name || '-',
    quantity: sale.quantity,
    amount: money(sale.amount),
  }))
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Rep' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Qty' },
    { key: 'amount', label: 'Amount' },
  ]
  const summary = {
    Sales: rows.length,
    'Total value': money(total),
    Reps: new Set(rows.map((r) => r.name)).size,
  }
  return { columns, rows, summary }
}

const BUILDERS = {
  attendance: buildAttendance,
  leave: buildLeave,
  expense: buildExpense,
  visits: buildVisits,
  sales: buildSales,
}

export async function getReport(req, res) {
  try {
    const type = String(req.params.type || '').toLowerCase()
    const builder = BUILDERS[type]
    if (!builder) return res.status(404).json({ message: 'Unknown report type' })

    const window = resolveWindow(req.query)
    const employeeIds = await resolveEmployeeScope(req)
    const { columns, rows, summary } = await builder(req, window, employeeIds)

    if (String(req.query.format).toLowerCase() === 'csv') {
      if (!hasPermission(req.user, 'report.export')) {
        return res.status(403).json({ message: 'You do not have permission to export reports' })
      }
      return sendCsv(
        res,
        `${type}-report.csv`,
        rows,
        columns.map((column) => ({ label: column.label, value: (row) => row[column.key] ?? '' }))
      )
    }

    return res.status(200).json({ type, period: window.label, columns, rows, summary, scope: employeeIds ? 'team' : 'company' })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function getAnalyticsSummary(req, res) {
  try {
    const window = resolveWindow(req.query)
    const companyId = oid(req.user.companyId)
    const [attendance, visits, sales, expenses, orders] = await Promise.all([
      Attendance.countDocuments({ companyId, date: { $gte: window.start, $lt: window.end } }),
      Visit.countDocuments({ companyId, visitedAt: { $gte: window.start, $lt: window.end } }),
      Sale.aggregate([{ $match: { companyId, saleDate: { $gte: window.start, $lt: window.end } } }, { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { companyId, expenseDate: { $gte: window.start, $lt: window.end } } }, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$amount' } } }]),
      Order.aggregate([{ $match: { companyId, createdAt: { $gte: window.start, $lt: window.end } } }, { $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } }]),
    ])
    return res.json({ period: window.label, attendance, visits, sales: sales[0] || { count: 0, value: 0 }, expenses, orders })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load analytics summary', error: error.message })
  }
}

// Employees the caller may filter reports by (for the dropdown).
export async function reportEmployees(req, res) {
  try {
    const allowed = await scopedEmployeeIds(req.user)
    const filter = { companyId: req.user.companyId, active: true, role: { $nin: ['super_admin', 'superadmin'] } }
    if (allowed) filter._id = { $in: allowed.map(oid) }
    const employees = await User.find(filter).select('name role').sort({ name: 1 }).lean()
    return res.status(200).json({ employees })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export default { getReport, reportEmployees }
