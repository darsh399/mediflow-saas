import PayrollSettings from '../models/PayrollSettings.js'
import Salary from '../models/Salary.js'
import User from '../models/User.js'
import EmployeeProfile from '../models/EmployeeProfile.js'
import { buildLopDeduction } from './salaryService.js'

const round2 = (value) => Number(Number(value || 0).toFixed(2))

export async function getOrCreateSettings(companyId) {
  let settings = await PayrollSettings.findOne({ companyId })
  if (!settings) settings = await PayrollSettings.create({ companyId })
  return settings
}

// Employee-share statutory deductions for one salary line.
export function computeStatutory({ settings, basic, gross, tds = 0 }) {
  const result = { pf: 0, esi: 0, pt: 0, tds: round2(tds) }

  if (settings.pfEnabled && basic > 0) {
    const base = settings.pfOnFullBasic ? basic : Math.min(basic, settings.pfWageCeiling || basic)
    result.pf = round2((base * (settings.pfRate || 0)) / 100)
  }
  if (settings.esiEnabled && gross > 0 && gross <= (settings.esiGrossThreshold || 0)) {
    result.esi = round2((gross * (settings.esiRate || 0)) / 100)
  }
  if (settings.ptEnabled && gross > 0) {
    result.pt = round2(settings.ptAmount || 0)
  }
  result.total = round2(result.pf + result.esi + result.pt + result.tds)
  return result
}

function findBasic(components = []) {
  const basic = components.find((component) => String(component.name || '').toLowerCase() === 'basic')
  return basic ? Number(basic.amount || 0) : 0
}

// Build one payroll line for an employee for the given month. `tdsOverrides` maps
// employeeId -> monthly TDS amount.
export async function buildPayrollLine({ companyId, employee, settings, month, year, tds = 0 }) {
  const salary = await Salary.findOne({ companyId, employeeId: employee._id }).sort({ effectiveDate: -1 }).lean()
  if (!salary) return null

  const { lopDays, lopDeduction } = await buildLopDeduction({
    companyId, employeeId: employee._id, month, year, monthlyCtc: salary.monthlyCtc,
  })

  const basic = findBasic(salary.components)
  const gross = round2(salary.grossSalary)
  const statutory = computeStatutory({ settings, basic, gross, tds })

  const statutoryComponents = []
  if (statutory.pf > 0) statutoryComponents.push({ name: 'PF', type: 'DEDUCTION', calculationType: 'FIXED', amount: statutory.pf, basedOn: 'BASIC', statutory: true })
  if (statutory.esi > 0) statutoryComponents.push({ name: 'ESI', type: 'DEDUCTION', calculationType: 'FIXED', amount: statutory.esi, basedOn: 'GROSS', statutory: true })
  if (statutory.pt > 0) statutoryComponents.push({ name: 'Professional Tax', type: 'DEDUCTION', calculationType: 'FIXED', amount: statutory.pt, basedOn: 'GROSS', statutory: true })
  if (statutory.tds > 0) statutoryComponents.push({ name: 'TDS', type: 'DEDUCTION', calculationType: 'FIXED', amount: statutory.tds, basedOn: 'GROSS', statutory: true })

  const lopComponent = lopDeduction > 0
    ? [{ name: 'LOP Deduction', type: 'DEDUCTION', calculationType: 'FIXED', amount: lopDeduction, basedOn: 'MONTHLY_CTC' }]
    : []

  const components = [...salary.components, ...lopComponent, ...statutoryComponents]
  const totalDeductions = round2(salary.totalDeductions + lopDeduction + statutory.total)
  const netSalary = round2(gross - totalDeductions)

  const profile = await EmployeeProfile.findOne({ companyId, userId: employee._id }).select('+bankDetails.accountNumber').lean()
  const bank = profile?.bankDetails || null

  return {
    employeeId: employee._id,
    employeeName: employee.name,
    salaryId: salary._id,
    structureId: salary.structureId,
    basic,
    grossSalary: gross,
    lopDays,
    lopDeduction,
    structureDeductions: round2(salary.totalDeductions),
    statutory: { pf: statutory.pf, esi: statutory.esi, pt: statutory.pt, tds: statutory.tds },
    totalDeductions,
    netSalary,
    components,
    bankDetailsSnapshot: bank ? {
      accountHolderName: bank.accountHolderName,
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
      branchName: bank.branchName,
      accountType: bank.accountType,
    } : undefined,
    slipId: null,
    excluded: false,
  }
}

export function summariseLines(lines) {
  const active = lines.filter((line) => !line.excluded)
  return {
    headcount: active.length,
    gross: round2(active.reduce((sum, line) => sum + line.grossSalary, 0)),
    deductions: round2(active.reduce((sum, line) => sum + line.totalDeductions, 0)),
    net: round2(active.reduce((sum, line) => sum + line.netSalary, 0)),
    pf: round2(active.reduce((sum, line) => sum + (line.statutory?.pf || 0), 0)),
    esi: round2(active.reduce((sum, line) => sum + (line.statutory?.esi || 0), 0)),
    pt: round2(active.reduce((sum, line) => sum + (line.statutory?.pt || 0), 0)),
    tds: round2(active.reduce((sum, line) => sum + (line.statutory?.tds || 0), 0)),
  }
}

// Recompute a single line's deduction/net after a TDS change, keeping everything
// else fixed.
export function applyTds(line, tds) {
  const newTds = round2(Math.max(0, tds))
  const oldStatTotal = (line.statutory?.pf || 0) + (line.statutory?.esi || 0) + (line.statutory?.pt || 0) + (line.statutory?.tds || 0)
  const newStatTotal = (line.statutory?.pf || 0) + (line.statutory?.esi || 0) + (line.statutory?.pt || 0) + newTds
  const totalDeductions = round2(line.totalDeductions - oldStatTotal + newStatTotal)
  const components = (line.components || []).filter((component) => component.name !== 'TDS')
  if (newTds > 0) components.push({ name: 'TDS', type: 'DEDUCTION', calculationType: 'FIXED', amount: newTds, basedOn: 'GROSS', statutory: true })
  return {
    ...line,
    statutory: { ...line.statutory, tds: newTds },
    totalDeductions,
    netSalary: round2(line.grossSalary - totalDeductions),
    components,
  }
}

export async function eligibleEmployees(companyId) {
  return User.find({
    companyId,
    active: true,
    role: { $nin: ['admin', 'company_owner', 'super_admin', 'superadmin'] },
  }).select('name email employeeId role').sort({ name: 1 }).lean()
}

export default { getOrCreateSettings, computeStatutory, buildPayrollLine, summariseLines, applyTds, eligibleEmployees }
