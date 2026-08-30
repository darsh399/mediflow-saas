import PayrollRun from '../models/PayrollRun.js'
import SalarySlip from '../models/SalarySlip.js'
import Salary from '../models/Salary.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import recordAudit from '../utils/audit.js'
import {
  getOrCreateSettings,
  buildPayrollLine,
  summariseLines,
  applyTds,
  eligibleEmployees,
} from '../services/payrollService.js'
import mailService from '../services/mailService.js'
import { salarySlipTemplate } from '../services/emailTemplateService.js'
import { generateSalarySlipPdf } from '../services/pdfService.js'

const round2 = (value) => Number(Number(value || 0).toFixed(2))

function parsePeriod(query) {
  const month = Number(query.month)
  const year = Number(query.year)
  if (!month || month < 1 || month > 12 || !year || year < 2000) {
    throw Object.assign(new Error('A valid month (1-12) and year are required'), { status: 400 })
  }
  return { month, year }
}

// Compute the full set of lines for a company month (used by preview and create).
async function computeLines(companyId, month, year, { tdsByEmployee = {}, excluded = new Set() } = {}) {
  const [settings, employees] = await Promise.all([getOrCreateSettings(companyId), eligibleEmployees(companyId)])
  const lines = []
  const missingSalary = []
  for (const employee of employees) {
    const line = await buildPayrollLine({
      companyId, employee, settings, month, year,
      tds: tdsByEmployee[String(employee._id)] || 0,
    })
    if (!line) {
      missingSalary.push({ _id: employee._id, name: employee.name })
      continue
    }
    if (excluded.has(String(employee._id))) line.excluded = true
    lines.push(line)
  }
  return { lines, missingSalary, settings }
}

export async function getPayrollSettings(req, res) {
  try {
    const settings = await getOrCreateSettings(req.user.companyId)
    return res.status(200).json({ settings })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export async function updatePayrollSettings(req, res) {
  try {
    const settings = await getOrCreateSettings(req.user.companyId)
    const fields = ['pfEnabled', 'pfRate', 'pfWageCeiling', 'pfOnFullBasic', 'esiEnabled', 'esiRate', 'esiGrossThreshold', 'ptEnabled', 'ptAmount']
    for (const field of fields) {
      if (req.body?.[field] !== undefined) settings[field] = req.body[field]
    }
    settings.updatedBy = req.user.id
    await settings.save()
    await recordAudit(req, 'payroll_settings_updated', { companyId: req.user.companyId, entityId: settings._id, module: 'payroll' })
    return res.status(200).json({ settings })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function listPayrollRuns(req, res) {
  try {
    const runs = await PayrollRun.find({ companyId: req.user.companyId })
      .select('month year status totals slipsGenerated approvedAt paidAt createdAt')
      .sort({ year: -1, month: -1 })
      .lean()
    return res.status(200).json({ runs })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export async function previewPayrollRun(req, res) {
  try {
    const { month, year } = parsePeriod(req.query)
    const existing = await PayrollRun.findOne({ companyId: req.user.companyId, month, year }).select('_id status').lean()
    const { lines, missingSalary } = await computeLines(req.user.companyId, month, year)
    return res.status(200).json({ month, year, lines, missingSalary, totals: summariseLines(lines), existingRunId: existing?._id || null })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

export async function createPayrollRun(req, res) {
  try {
    const { month, year } = parsePeriod(req.body)
    const existing = await PayrollRun.findOne({ companyId: req.user.companyId, month, year }).select('_id').lean()
    if (existing) return res.status(409).json({ message: 'A payroll run already exists for this month', runId: existing._id })

    const { lines } = await computeLines(req.user.companyId, month, year)
    if (lines.length === 0) return res.status(400).json({ message: 'No employees with an assigned salary — nothing to run' })

    const run = await PayrollRun.create({
      companyId: req.user.companyId,
      month,
      year,
      status: 'DRAFT',
      lines,
      totals: summariseLines(lines),
      notes: req.body?.notes,
      createdBy: req.user.id,
    })
    await recordAudit(req, 'payroll_run_created', { companyId: req.user.companyId, entityId: run._id, module: 'payroll', newValue: { month, year, headcount: run.totals.headcount } })
    return res.status(201).json({ run })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

async function loadRun(req) {
  const run = await PayrollRun.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!run) throw Object.assign(new Error('Payroll run not found'), { status: 404 })
  return run
}

export async function getPayrollRun(req, res) {
  try {
    const run = await loadRun(req)
    return res.status(200).json({ run })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

export async function updatePayrollRun(req, res) {
  try {
    const run = await loadRun(req)
    if (run.status !== 'DRAFT') return res.status(409).json({ message: 'Only a draft run can be edited' })

    if (req.body?.notes !== undefined) run.notes = req.body.notes

    // Per-line adjustments: { employeeId, tds?, excluded? }
    for (const change of req.body?.lines || []) {
      const line = run.lines.find((item) => String(item.employeeId) === String(change.employeeId))
      if (!line) continue
      if (change.excluded !== undefined) line.excluded = Boolean(change.excluded)
      if (change.tds !== undefined) {
        const updated = applyTds(line.toObject(), Number(change.tds) || 0)
        line.statutory = updated.statutory
        line.totalDeductions = updated.totalDeductions
        line.netSalary = updated.netSalary
        line.components = updated.components
      }
    }

    run.totals = summariseLines(run.lines.map((line) => line.toObject()))
    await run.save()
    return res.status(200).json({ run })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function recomputePayrollRun(req, res) {
  try {
    const run = await loadRun(req)
    if (run.status !== 'DRAFT') return res.status(409).json({ message: 'Only a draft run can be recomputed' })

    const tdsByEmployee = {}
    const excluded = new Set()
    for (const line of run.lines) {
      if (line.statutory?.tds) tdsByEmployee[String(line.employeeId)] = line.statutory.tds
      if (line.excluded) excluded.add(String(line.employeeId))
    }
    const { lines } = await computeLines(run.companyId, run.month, run.year, { tdsByEmployee, excluded })
    run.lines = lines
    run.totals = summariseLines(lines)
    await run.save()
    return res.status(200).json({ run })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function approvePayrollRun(req, res) {
  try {
    const run = await loadRun(req)
    if (run.status !== 'DRAFT') return res.status(409).json({ message: 'This run has already been approved' })
    if (run.lines.filter((line) => !line.excluded).length === 0) return res.status(400).json({ message: 'Every employee is excluded — nothing to approve' })
    run.status = 'APPROVED'
    run.approvedBy = req.user.id
    run.approvedAt = new Date()
    await run.save()
    await recordAudit(req, 'payroll_run_approved', { companyId: run.companyId, entityId: run._id, module: 'payroll', newValue: { net: run.totals.net } })
    return res.status(200).json({ run })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function generatePayrollSlips(req, res) {
  try {
    const run = await loadRun(req)
    if (run.status !== 'APPROVED') return res.status(409).json({ message: 'Approve the run before generating slips' })

    let created = 0
    let skipped = 0
    for (const line of run.lines) {
      if (line.excluded || line.slipId) { if (line.slipId) skipped += 1; continue }
      const existing = await SalarySlip.findOne({ companyId: run.companyId, employeeId: line.employeeId, month: run.month, year: run.year }).select('_id').lean()
      if (existing) {
        line.slipId = existing._id
        skipped += 1
        continue
      }
      const slip = await SalarySlip.create({
        companyId: run.companyId,
        employeeId: line.employeeId,
        structureId: line.structureId,
        salaryId: line.salaryId,
        month: run.month,
        year: run.year,
        components: line.components,
        grossSalary: line.grossSalary,
        totalDeductions: line.totalDeductions,
        netSalary: line.netSalary,
        lopDays: line.lopDays,
        lopDeduction: line.lopDeduction,
        bankDetailsSnapshot: line.bankDetailsSnapshot,
        generatedBy: req.user.id,
      })
      line.slipId = slip._id
      created += 1
    }
    run.slipsGenerated = true
    await run.save()
    await recordAudit(req, 'payroll_slips_generated', { companyId: run.companyId, entityId: run._id, module: 'payroll', newValue: { created, skipped } })
    return res.status(200).json({ run, created, skipped })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function sendPayrollSlips(req, res) {
  try {
    const run = await loadRun(req)
    if (!run.slipsGenerated) return res.status(409).json({ message: 'Generate the slips first' })

    const slipIds = run.lines.filter((line) => line.slipId).map((line) => line.slipId)
    const slips = await SalarySlip.find({ _id: { $in: slipIds } }).populate('employeeId', 'name email').lean()
    const company = await Company.findById(run.companyId).select('companyName').lean()
    const monthName = new Date(2000, run.month - 1, 1).toLocaleString('en-IN', { month: 'long' })

    let sent = 0
    const failures = []
    for (const slip of slips) {
      if (!slip.employeeId?.email) { failures.push(slip.employeeId?.name || String(slip._id)); continue }
      try {
        const template = salarySlipTemplate({ employeeName: slip.employeeId.name, month: monthName, year: run.year, netSalary: `₹${Number(slip.netSalary).toLocaleString('en-IN')}`, companyName: company?.companyName })
        const pdfBuffer = await generateSalarySlipPdf({ slip, employee: slip.employeeId, company })
        await mailService.sendMail({ to: slip.employeeId.email, ...template, attachments: [{ filename: `Salary-Slip-${monthName}-${run.year}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] })
        sent += 1
      } catch (mailError) {
        failures.push(slip.employeeId.name)
      }
    }
    await SalarySlip.updateMany({ _id: { $in: slipIds } }, { status: 'SENT' })
    await recordAudit(req, 'payroll_slips_sent', { companyId: run.companyId, entityId: run._id, module: 'payroll', newValue: { sent, failed: failures.length } })
    return res.status(200).json({ sent, failed: failures.length, failures })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

export async function markPayrollPaid(req, res) {
  try {
    const run = await loadRun(req)
    if (run.status !== 'APPROVED') return res.status(409).json({ message: 'Approve the run first' })
    if (!run.slipsGenerated) return res.status(409).json({ message: 'Generate the slips before marking the run paid' })
    run.status = 'PAID'
    run.paidAt = new Date()
    await run.save()
    await recordAudit(req, 'payroll_run_paid', { companyId: run.companyId, entityId: run._id, module: 'payroll', newValue: { net: run.totals.net } })
    return res.status(200).json({ run })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function deletePayrollRun(req, res) {
  try {
    const run = await loadRun(req)
    if (run.status !== 'DRAFT') return res.status(409).json({ message: 'Only a draft run can be deleted' })
    await run.deleteOne()
    await recordAudit(req, 'payroll_run_deleted', { companyId: run.companyId, entityId: run._id, module: 'payroll' })
    return res.status(200).json({ message: 'Payroll run deleted' })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

// Bank payment advice for an approved run.
export async function payrollBankAdvice(req, res) {
  try {
    const run = await loadRun(req)
    const rows = run.lines
      .filter((line) => !line.excluded)
      .map((line) => ({
        employee: line.employeeName,
        accountHolderName: line.bankDetailsSnapshot?.accountHolderName || null,
        bankName: line.bankDetailsSnapshot?.bankName || null,
        accountNumber: line.bankDetailsSnapshot?.accountNumber || null,
        ifscCode: line.bankDetailsSnapshot?.ifscCode || null,
        amount: line.netSalary,
      }))
    return res.status(200).json({ month: run.month, year: run.year, total: run.totals.net, rows })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

// Form-16-style annual breakdown for one employee.
export async function payrollAnnualSummary(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear()
    const employeeId = req.query.employeeId
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' })

    const isManager = ['admin', 'company_owner', 'hr_manager'].includes(req.user.role)
    if (!isManager && String(employeeId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only view your own summary' })
    }

    const [employee, slips] = await Promise.all([
      User.findOne({ _id: employeeId, companyId: req.user.companyId }).select('name email employeeId').lean(),
      SalarySlip.find({ companyId: req.user.companyId, employeeId, year }).sort({ month: 1 }).lean(),
    ])
    if (!employee) return res.status(404).json({ message: 'Employee not found' })

    const byComponent = {}
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0
    const months = slips.map((slip) => {
      totalGross += slip.grossSalary
      totalDeductions += slip.totalDeductions
      totalNet += slip.netSalary
      for (const component of slip.components || []) {
        if (component.type !== 'DEDUCTION') continue
        byComponent[component.name] = round2((byComponent[component.name] || 0) + Number(component.amount || 0))
      }
      return { month: slip.month, gross: slip.grossSalary, deductions: slip.totalDeductions, net: slip.netSalary }
    })

    return res.status(200).json({
      employee,
      year,
      slipCount: slips.length,
      totals: { gross: round2(totalGross), deductions: round2(totalDeductions), net: round2(totalNet) },
      deductionBreakdown: byComponent,
      months,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export default {
  getPayrollSettings,
  updatePayrollSettings,
  listPayrollRuns,
  previewPayrollRun,
  createPayrollRun,
  getPayrollRun,
  updatePayrollRun,
  recomputePayrollRun,
  approvePayrollRun,
  generatePayrollSlips,
  sendPayrollSlips,
  markPayrollPaid,
  deletePayrollRun,
  payrollBankAdvice,
  payrollAnnualSummary,
}
