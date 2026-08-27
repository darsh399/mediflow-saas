import mongoose from 'mongoose'
import Target from '../models/Target.js'
import Sale from '../models/Sale.js'
import Visit from '../models/Visit.js'
import User from '../models/User.js'
import Project from '../models/Project.js'
import recordAudit from '../utils/audit.js'
import { seesWholeCompany, canManageTargets, scopedEmployeeIds, canAccessEmployee } from '../utils/teamScope.js'

const COMPLETED_VISIT_STATUSES = ['completed', 'approved']

const oid = (value) => new mongoose.Types.ObjectId(value)

function resolvePeriod(query) {
  const now = new Date()
  const month = Number(query.month) || now.getMonth() + 1
  const year = Number(query.year) || now.getFullYear()
  if (month < 1 || month > 12 || year < 2000) throw new Error('A valid month (1-12) and year are required')
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 1, 0, 0, 0, 0)
  return { month, year, start, end }
}

function clampProgress(completed, target) {
  if (!target || target <= 0) return null
  return Math.round((completed / target) * 100)
}

// Completed sales (sum of Sale.amount) and completed visits per rep for a month.
async function achievementFor(companyId, employeeIds, start, end) {
  const match = { companyId: oid(companyId), saleDate: { $gte: start, $lt: end } }
  const visitMatch = { companyId: oid(companyId), status: { $in: COMPLETED_VISIT_STATUSES }, visitedAt: { $gte: start, $lt: end } }
  if (employeeIds) {
    const ids = employeeIds.map(oid)
    match.employeeId = { $in: ids }
    visitMatch.employeeId = { $in: ids }
  }

  const [sales, visits] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      { $group: { _id: '$employeeId', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Visit.aggregate([
      { $match: visitMatch },
      { $group: { _id: '$employeeId', count: { $sum: 1 } } },
    ]),
  ])

  const map = new Map()
  for (const row of sales) map.set(String(row._id), { completedSales: row.amount, saleCount: row.count, completedVisits: 0 })
  for (const row of visits) {
    const entry = map.get(String(row._id)) || { completedSales: 0, saleCount: 0, completedVisits: 0 }
    entry.completedVisits = row.count
    map.set(String(row._id), entry)
  }
  return map
}

function buildRow(employee, target, achieved) {
  const completedSales = achieved?.completedSales || 0
  const completedVisits = achieved?.completedVisits || 0
  const salesTarget = target?.salesTarget || 0
  const visitTarget = target?.visitTarget || 0
  return {
    employeeId: String(employee._id),
    name: employee.name,
    role: employee.role || null,
    targetId: target?._id || null,
    projectId: target?.projectId || null,
    month: target?.month || null,
    year: target?.year || null,
    salesTarget,
    visitTarget,
    note: target?.note || null,
    completedSales,
    completedVisits,
    saleCount: achieved?.saleCount || 0,
    remainingSales: Math.max(0, salesTarget - completedSales),
    remainingVisits: Math.max(0, visitTarget - completedVisits),
    extraSales: Math.max(0, completedSales - salesTarget),
    extraVisits: Math.max(0, completedVisits - visitTarget),
    salesProgress: clampProgress(completedSales, salesTarget),
    visitProgress: clampProgress(completedVisits, visitTarget),
    salesExceeded: salesTarget > 0 && completedSales > salesTarget,
    visitsExceeded: visitTarget > 0 && completedVisits > visitTarget,
  }
}

export async function listTargets(req, res) {
  try {
    const companyId = req.user.companyId
    const { month, year, start, end } = resolvePeriod(req.query)
    const allowedIds = await scopedEmployeeIds(req.user)

    const targetFilter = { companyId, month, year }
    if (allowedIds) targetFilter.employeeId = { $in: allowedIds.map(oid) }
    if (req.query.employeeId) {
      if (!(await canAccessEmployee(req.user, req.query.employeeId))) return res.status(403).json({ message: 'Not allowed to view that employee' })
      targetFilter.employeeId = oid(req.query.employeeId)
    }
    if (req.query.projectId) targetFilter.projectId = oid(req.query.projectId)

    const targets = await Target.find(targetFilter).lean()

    // Which reps to show: those with a target, plus (for wider scopes) those who
    // logged a sale or visit this month.
    const repIds = new Set(targets.map((target) => String(target.employeeId)))
    if (!req.query.employeeId) {
      const activityFilter = { companyId, saleDate: { $gte: start, $lt: end } }
      const visitFilter = { companyId, status: { $in: COMPLETED_VISIT_STATUSES }, visitedAt: { $gte: start, $lt: end } }
      if (allowedIds) {
        activityFilter.employeeId = { $in: allowedIds.map(oid) }
        visitFilter.employeeId = { $in: allowedIds.map(oid) }
      }
      const [saleReps, visitReps] = await Promise.all([
        Sale.distinct('employeeId', activityFilter),
        Visit.distinct('employeeId', visitFilter),
      ])
      for (const repId of [...saleReps, ...visitReps]) repIds.add(String(repId))
    }

    const employees = await User.find({ _id: { $in: [...repIds].map(oid) }, companyId }).select('name role').lean()
    const employeeMap = new Map(employees.map((employee) => [String(employee._id), employee]))
    const targetMap = new Map(targets.map((target) => [String(target.employeeId), target]))
    const achieved = await achievementFor(companyId, [...repIds], start, end)

    const rows = [...repIds]
      .filter((repId) => employeeMap.has(repId))
      .map((repId) => buildRow(employeeMap.get(repId), targetMap.get(repId), achieved.get(repId)))
      .sort((a, b) => b.completedSales - a.completedSales)

    const summary = rows.reduce(
      (acc, row) => {
        acc.salesTarget += row.salesTarget
        acc.visitTarget += row.visitTarget
        acc.completedSales += row.completedSales
        acc.completedVisits += row.completedVisits
        return acc
      },
      { salesTarget: 0, visitTarget: 0, completedSales: 0, completedVisits: 0 }
    )
    summary.remainingSales = Math.max(0, summary.salesTarget - summary.completedSales)
    summary.remainingVisits = Math.max(0, summary.visitTarget - summary.completedVisits)
    summary.salesProgress = clampProgress(summary.completedSales, summary.salesTarget)
    summary.visitProgress = clampProgress(summary.completedVisits, summary.visitTarget)
    summary.repCount = rows.length
    summary.repsWithTarget = rows.filter((row) => row.targetId).length
    summary.month = month
    summary.year = year
    summary.scope = allowedIds === null ? 'company' : 'team'

    return res.status(200).json({ rows, summary })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getTarget(req, res) {
  try {
    const companyId = req.user.companyId
    const target = await Target.findOne({ _id: req.params.id, companyId })
      .populate('employeeId', 'name email role')
      .populate('projectId', 'name')
      .populate('createdBy', 'name role')
      .lean()
    if (!target) return res.status(404).json({ message: 'Target not found' })
    if (!(await canAccessEmployee(req.user, target.employeeId._id))) return res.status(403).json({ message: 'Not allowed to view this target' })

    const start = new Date(target.year, target.month - 1, 1)
    const end = new Date(target.year, target.month, 1)
    const [achieved, visits, sales] = await Promise.all([
      achievementFor(companyId, [String(target.employeeId._id)], start, end),
      Visit.find({ companyId, employeeId: target.employeeId._id, status: { $in: COMPLETED_VISIT_STATUSES }, visitedAt: { $gte: start, $lt: end } })
        .populate('doctorId', 'name clinicName')
        .populate('medicalId', 'name')
        .sort({ visitedAt: -1 })
        .lean(),
      Sale.find({ companyId, employeeId: target.employeeId._id, saleDate: { $gte: start, $lt: end } })
        .populate('doctorId', 'name')
        .populate('productId', 'name')
        .sort({ saleDate: -1 })
        .lean(),
    ])

    const row = buildRow({ _id: target.employeeId._id, name: target.employeeId.name, role: target.employeeId.role }, target, achieved.get(String(target.employeeId._id)))
    return res.status(200).json({ target: { ...target, ...row }, visits, sales })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

async function assertCanManage(req, employeeId) {
  if (!canManageTargets(req.user)) {
    const err = new Error('You do not have permission to manage targets')
    err.status = 403
    throw err
  }
  if (!(await canAccessEmployee(req.user, employeeId))) {
    const err = new Error('You can only set targets for your own team')
    err.status = 403
    throw err
  }
  const rep = await User.findOne({ _id: employeeId, companyId: req.user.companyId }).select('_id role').lean()
  if (!rep) {
    const err = new Error('That employee is not in your company')
    err.status = 400
    throw err
  }
  return rep
}

export async function createTarget(req, res) {
  try {
    const companyId = req.user.companyId
    const { employeeId, month, year, salesTarget, visitTarget, projectId, note } = req.body || {}
    if (!employeeId || !month || !year) return res.status(400).json({ message: 'employeeId, month and year are required' })
    const monthNum = Number(month)
    const yearNum = Number(year)
    if (monthNum < 1 || monthNum > 12 || yearNum < 2000) return res.status(400).json({ message: 'A valid month and year are required' })
    const sales = Number(salesTarget) || 0
    const visits = Number(visitTarget) || 0
    if (sales < 0 || visits < 0) return res.status(400).json({ message: 'Target values cannot be negative' })

    await assertCanManage(req, employeeId)

    if (projectId) {
      const project = await Project.findOne({ _id: projectId, companyId }).select('_id').lean()
      if (!project) return res.status(400).json({ message: 'That project is not in your company' })
    }

    const existing = await Target.findOne({ companyId, employeeId, month: monthNum, year: yearNum }).select('_id').lean()
    if (existing) return res.status(409).json({ message: 'A target already exists for this employee and month — edit it instead', targetId: existing._id })

    const target = await Target.create({
      companyId,
      employeeId,
      projectId: projectId || null,
      month: monthNum,
      year: yearNum,
      salesTarget: sales,
      visitTarget: visits,
      note: note?.trim() || undefined,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    })
    await recordAudit(req, 'target_created', { companyId, entityId: target._id, module: 'targets', newValue: { employeeId, month: monthNum, year: yearNum, salesTarget: sales, visitTarget: visits } })
    return res.status(201).json({ message: 'Target created', target })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function updateTarget(req, res) {
  try {
    const companyId = req.user.companyId
    const target = await Target.findOne({ _id: req.params.id, companyId })
    if (!target) return res.status(404).json({ message: 'Target not found' })

    await assertCanManage(req, target.employeeId)

    if (req.body?.salesTarget !== undefined) {
      const value = Number(req.body.salesTarget)
      if (!(value >= 0)) return res.status(400).json({ message: 'salesTarget cannot be negative' })
      target.salesTarget = value
    }
    if (req.body?.visitTarget !== undefined) {
      const value = Number(req.body.visitTarget)
      if (!(value >= 0)) return res.status(400).json({ message: 'visitTarget cannot be negative' })
      target.visitTarget = value
    }
    if (req.body?.note !== undefined) target.note = req.body.note?.trim() || undefined
    if (req.body?.projectId !== undefined) {
      if (req.body.projectId) {
        const project = await Project.findOne({ _id: req.body.projectId, companyId }).select('_id').lean()
        if (!project) return res.status(400).json({ message: 'That project is not in your company' })
        target.projectId = req.body.projectId
      } else {
        target.projectId = null
      }
    }
    target.updatedBy = req.user.id
    await target.save()
    await recordAudit(req, 'target_updated', { companyId, entityId: target._id, module: 'targets', newValue: { salesTarget: target.salesTarget, visitTarget: target.visitTarget } })
    return res.status(200).json({ message: 'Target updated', target })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function deleteTarget(req, res) {
  try {
    const companyId = req.user.companyId
    const target = await Target.findOne({ _id: req.params.id, companyId })
    if (!target) return res.status(404).json({ message: 'Target not found' })
    await assertCanManage(req, target.employeeId)
    await target.deleteOne()
    await recordAudit(req, 'target_deleted', { companyId, entityId: target._id, module: 'targets' })
    return res.status(200).json({ message: 'Target removed' })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

// Aggregated dashboard for the caller's scope: company totals / team totals /
// own numbers, plus doctor-response mix and follow-ups.
export async function getTargetDashboard(req, res) {
  try {
    const companyId = req.user.companyId
    const { month, year, start, end } = resolvePeriod(req.query)
    const allowedIds = await scopedEmployeeIds(req.user)
    const wholeCompany = allowedIds === null

    const employeeFilter = { companyId }
    if (!wholeCompany) employeeFilter._id = { $in: allowedIds.map(oid) }
    const employees = await User.find({ ...employeeFilter, role: { $nin: ['super_admin', 'superadmin'] } }).select('name role').lean()
    const empIds = employees.map((e) => String(e._id))

    const targets = await Target.find({ companyId, month, year, employeeId: { $in: empIds.map(oid) } }).lean()
    const targetMap = new Map(targets.map((target) => [String(target.employeeId), target]))
    const achieved = await achievementFor(companyId, empIds, start, end)

    const rows = employees
      .map((employee) => buildRow(employee, targetMap.get(String(employee._id)), achieved.get(String(employee._id))))
      .filter((row) => row.targetId || row.completedSales > 0 || row.completedVisits > 0)
      .sort((a, b) => b.completedSales - a.completedSales)

    const visitScopeMatch = { companyId: oid(companyId), visitedAt: { $gte: start, $lt: end }, status: { $in: COMPLETED_VISIT_STATUSES } }
    if (!wholeCompany) visitScopeMatch.employeeId = { $in: allowedIds.map(oid) }
    const responseMix = await Visit.aggregate([
      { $match: { ...visitScopeMatch, doctorResponse: { $ne: null } } },
      { $group: { _id: '$doctorResponse', count: { $sum: 1 } } },
    ])

    const followUps = await Visit.find({ ...visitScopeMatch, doctorResponse: 'FOLLOW_UP_REQUIRED' })
      .populate('employeeId', 'name')
      .populate('doctorId', 'name clinicName')
      .sort({ visitedAt: -1 })
      .limit(20)
      .lean()

    const mrCount = employees.filter((employee) => ['mr', 'employee'].includes(employee.role)).length

    const summary = rows.reduce(
      (acc, row) => {
        acc.salesTarget += row.salesTarget
        acc.visitTarget += row.visitTarget
        acc.completedSales += row.completedSales
        acc.completedVisits += row.completedVisits
        return acc
      },
      { salesTarget: 0, visitTarget: 0, completedSales: 0, completedVisits: 0 }
    )
    summary.remainingSales = Math.max(0, summary.salesTarget - summary.completedSales)
    summary.remainingVisits = Math.max(0, summary.visitTarget - summary.completedVisits)
    summary.salesProgress = clampProgress(summary.completedSales, summary.salesTarget)
    summary.visitProgress = clampProgress(summary.completedVisits, summary.visitTarget)
    summary.employeeCount = employees.length
    summary.mrCount = mrCount
    summary.month = month
    summary.year = year
    summary.scope = wholeCompany ? 'company' : 'team'

    return res.status(200).json({
      summary,
      rows,
      responseMix: responseMix.map((row) => ({ response: row._id, count: row.count })),
      followUps: followUps.map((visit) => ({
        _id: visit._id,
        employee: visit.employeeId?.name || null,
        doctor: visit.doctorId?.name || null,
        clinic: visit.doctorId?.clinicName || null,
        visitedAt: visit.visitedAt,
        notes: visit.doctorResponseNotes || null,
      })),
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export default { listTargets, getTarget, createTarget, updateTarget, deleteTarget, getTargetDashboard }
