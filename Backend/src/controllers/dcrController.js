import DailyCallReport from '../models/DailyCallReport.js'
import Visit from '../models/Visit.js'
import Sale from '../models/Sale.js'
import TourPlan from '../models/TourPlan.js'
import Notification from '../models/Notification.js'
import recordAudit from '../utils/audit.js'
import { hasAnyRole } from '../utils/authorize.js'
import { scopedEmployeeIds, canAccessEmployee } from '../utils/teamScope.js'

const REVIEWER_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager', 'project_manager']
const isReviewer = (user) => hasAnyRole(user, REVIEWER_ROLES)

function dayBounds(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) throw new Error('A valid date is required')
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// Everything the rep actually did that day, compiled from existing records.
async function buildActivity(companyId, employeeId, start, end) {
  const [visits, sales, plan] = await Promise.all([
    Visit.find({ companyId, employeeId, visitedAt: { $gte: start, $lte: end } })
      .populate('doctorId', 'name specialty')
      .populate('medicalId', 'name')
      .sort({ visitedAt: 1 })
      .lean(),
    Sale.find({ companyId, employeeId, saleDate: { $gte: start, $lte: end } }).select('amount quantity').lean(),
    TourPlan.findOne({
      companyId,
      employeeId,
      periodStart: { $lte: end },
      periodEnd: { $gte: start },
      status: { $in: ['SUBMITTED', 'APPROVED'] },
    }).select('items').lean(),
  ])

  const calls = visits.map((visit) => ({
    _id: visit._id,
    kind: visit.doctorId ? 'DOCTOR' : 'MEDICAL',
    name: visit.doctorId?.name || visit.medicalId?.name || 'Unknown',
    specialty: visit.doctorId?.specialty || null,
    visitedAt: visit.visitedAt,
    status: visit.status,
    doctorResponse: visit.doctorResponse || null,
    discussion: visit.discussion || '',
  }))

  const plannedForDay = (plan?.items || []).filter((item) => {
    const planned = new Date(item.plannedDate)
    return planned >= start && planned <= end
  }).length

  return {
    calls,
    doctorCalls: calls.filter((call) => call.kind === 'DOCTOR').length,
    chemistCalls: calls.filter((call) => call.kind === 'MEDICAL').length,
    plannedCalls: plannedForDay,
    salesCount: sales.length,
    salesAmount: sales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
  }
}

export async function getDay(req, res) {
  try {
    const companyId = req.user.companyId
    let employeeId = String(req.user.id)
    if (req.body?.employeeId && String(req.body.employeeId) !== employeeId) {
      if (!(await canAccessEmployee(req.user, req.body.employeeId))) {
        return res.status(403).json({ message: 'You cannot view this rep\'s report' })
      }
      employeeId = String(req.body.employeeId)
    }
    const { start, end } = dayBounds(req.body?.date)

    let report = await DailyCallReport.findOne({ companyId, employeeId, date: start })
    if (!report && employeeId === String(req.user.id)) {
      try {
        report = await DailyCallReport.create({ companyId, employeeId, date: start, createdBy: req.user.id })
      } catch (createError) {
        // Concurrent first-open (e.g. React strict-mode double fetch) races the
        // unique index — the row now exists, so just read it back.
        if (createError?.code !== 11000) throw createError
        report = await DailyCallReport.findOne({ companyId, employeeId, date: start })
      }
    }
    if (report) {
      report = await DailyCallReport.populate(report, [
        { path: 'employeeId', select: 'name email role' },
        { path: 'reviewedBy', select: 'name email role' },
      ])
    }

    const activity = await buildActivity(companyId, employeeId, start, end)
    return res.status(200).json({ report, activity })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function listReports(req, res) {
  try {
    const companyId = req.user.companyId
    const filter = { companyId }
    if (isReviewer(req.user) && req.query.mine !== 'true') {
      const allowed = await scopedEmployeeIds(req.user)
      if (allowed) filter.employeeId = { $in: allowed }
      // An explicit employee filter must stay inside the reviewer's scope.
      if (req.query.employeeId && (!allowed || allowed.includes(String(req.query.employeeId)))) {
        filter.employeeId = req.query.employeeId
      }
    } else {
      filter.employeeId = req.user.id
    }
    if (req.query.status) filter.status = String(req.query.status).toUpperCase()
    if (req.query.from || req.query.to) {
      filter.date = {}
      if (req.query.from) filter.date.$gte = dayBounds(req.query.from).start
      if (req.query.to) filter.date.$lte = dayBounds(req.query.to).end
    }

    const reports = await DailyCallReport.find(filter)
      .populate('employeeId', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ date: -1 })
      .limit(200)
      .lean()
    return res.status(200).json({ reports })
  } catch (error) {
    return res.status(500).json({ message: 'Error listing daily call reports', error: error.message })
  }
}

export async function updateReport(req, res) {
  try {
    const report = await DailyCallReport.findOne({ _id: req.params.id, companyId: req.user.companyId })
    if (!report) return res.status(404).json({ message: 'Report not found' })
    if (String(report.employeeId) !== String(req.user.id)) return res.status(403).json({ message: 'Only the rep can edit their report' })
    if (!['DRAFT', 'REJECTED'].includes(report.status)) return res.status(409).json({ message: 'A submitted report cannot be edited' })
    for (const field of ['summary', 'workWith', 'nextDayPlan']) {
      if (req.body?.[field] !== undefined) report[field] = String(req.body[field] || '').trim()
    }
    await report.save()
    return res.status(200).json({ report })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function submitReport(req, res) {
  try {
    const companyId = req.user.companyId
    const report = await DailyCallReport.findOne({ _id: req.params.id, companyId })
    if (!report) return res.status(404).json({ message: 'Report not found' })
    if (String(report.employeeId) !== String(req.user.id)) return res.status(403).json({ message: 'Only the rep can submit their report' })
    if (!['DRAFT', 'REJECTED'].includes(report.status)) return res.status(409).json({ message: 'This report has already been submitted' })

    const { start, end } = dayBounds(report.date)
    const activity = await buildActivity(companyId, String(report.employeeId), start, end)
    if (!activity.calls.length && !report.summary) {
      return res.status(400).json({ message: 'Add a summary or log at least one visit before submitting' })
    }

    report.status = 'SUBMITTED'
    report.reviewNote = undefined
    report.reviewedBy = undefined
    report.reviewedAt = undefined
    await report.save()
    await recordAudit(req, 'dcr_submitted', { companyId, entityId: report._id, module: 'visits' })
    return res.status(200).json({ report })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function reviewReport(req, res) {
  try {
    const companyId = req.user.companyId
    const action = String(req.body?.action || '').toLowerCase()
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Action must be approve or reject' })
    if (!isReviewer(req.user)) return res.status(403).json({ message: 'You cannot review daily call reports' })

    const report = await DailyCallReport.findOne({ _id: req.params.id, companyId })
    if (!report) return res.status(404).json({ message: 'Report not found' })
    if (!(await canAccessEmployee(req.user, report.employeeId))) return res.status(403).json({ message: 'This rep is not in your team' })
    if (report.status !== 'SUBMITTED') return res.status(409).json({ message: 'Only a submitted report can be reviewed' })
    if (action === 'reject' && !String(req.body?.reviewNote || '').trim()) {
      return res.status(400).json({ message: 'A reason is required to reject a report' })
    }

    report.status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    report.reviewedBy = req.user.id
    report.reviewedAt = new Date()
    report.reviewNote = String(req.body?.reviewNote || '').trim() || undefined
    await report.save()
    await Notification.create({
      companyId,
      recipientId: report.employeeId,
      type: `DCR_${report.status}`,
      title: `Daily call report ${report.status.toLowerCase()}`,
      message: `Your report for ${new Date(report.date).toLocaleDateString('en-IN')} was ${report.status.toLowerCase()}${report.reviewNote ? `: ${report.reviewNote}` : ''}`,
      link: '/mr/dcr',
    })
    await recordAudit(req, `dcr_${report.status.toLowerCase()}`, { companyId, entityId: report._id, module: 'visits', newValue: { status: report.status } })
    return res.status(200).json({ report })
  } catch (error) {
    return res.status(500).json({ message: 'Error reviewing report', error: error.message })
  }
}

export default { getDay, listReports, updateReport, submitReport, reviewReport }
