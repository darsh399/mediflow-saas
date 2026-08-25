import Leave from '../models/Leave.js'

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

// Clips a leave's [startDate, endDate] span to the given salary month and returns the overlapping day count.
export function daysWithinMonth(startDate, endDate, month, year) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 0))
  const start = new Date(Math.max(new Date(startDate).getTime(), monthStart.getTime()))
  const end = new Date(Math.min(new Date(endDate).getTime(), monthEnd.getTime()))
  if (end < start) return 0
  return Math.floor((end - start) / 86400000) + 1
}

// LOP leaves are the project's existing 'UNPAID' leave type (see leaveController.js reviewLeave),
// counted only once approved. Only the portion of the leave that falls within the selected month counts.
export async function getLopDaysForMonth({ companyId, employeeId, month, year }) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 0))
  const leaves = await Leave.find({ companyId, userId: employeeId, leaveType: 'UNPAID', status: 'approved', startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } }).select('startDate endDate').lean()
  return leaves.reduce((total, leave) => total + daysWithinMonth(leave.startDate, leave.endDate, month, year), 0)
}

export async function buildLopDeduction({ companyId, employeeId, month, year, monthlyCtc }) {
  const lopDays = await getLopDaysForMonth({ companyId, employeeId, month, year })
  const totalDays = daysInMonth(year, month)
  const lopDeduction = lopDays > 0 ? Number(((monthlyCtc / totalDays) * lopDays).toFixed(2)) : 0
  return { lopDays, lopDeduction, totalDays }
}

export function calculateSalary(structure, basis, value) {
  const monthlyCtc = basis === 'ANNUAL' ? Number(value) / 12 : Number(value)
  if (!Number.isFinite(monthlyCtc) || monthlyCtc < 0) throw new Error('A valid salary amount is required')
  const components = []
  let basic = 0
  let gross = 0
  for (const component of [...(structure.components || [])].filter((item) => item.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))) {
    let base = component.basedOn === 'BASIC' ? basic : component.basedOn === 'GROSS' ? gross : component.basedOn === 'ANNUAL_CTC' ? monthlyCtc * 12 : monthlyCtc
    let amount = component.calculationType === 'PERCENTAGE' ? base * Number(component.percentage || 0) / 100 : Number(component.fixedAmount || 0)
    amount = Number(amount.toFixed(2))
    components.push({ name: component.name, type: component.type, amount, calculationType: component.calculationType, percentage: component.percentage, basedOn: component.basedOn })
    if (component.type === 'EARNING') { gross += amount; if (component.name.toLowerCase() === 'basic') basic = amount }
  }
  const totalDeductions = Number(components.filter((item) => item.type === 'DEDUCTION').reduce((sum, item) => sum + item.amount, 0).toFixed(2))
  const grossSalary = Number(components.filter((item) => item.type === 'EARNING').reduce((sum, item) => sum + item.amount, 0).toFixed(2))
  return { annualCtc: Number((monthlyCtc * 12).toFixed(2)), monthlyCtc: Number(monthlyCtc.toFixed(2)), components, grossSalary, totalDeductions, netSalary: Number((grossSalary - totalDeductions).toFixed(2)) }
}
