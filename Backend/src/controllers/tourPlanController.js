import mongoose from 'mongoose'
import TourPlan from '../models/TourPlan.js'
import Doctor from '../models/Doctor.js'
import Medical from '../models/Medical.js'
import Visit from '../models/Visit.js'
import User from '../models/User.js'
import recordAudit from '../utils/audit.js'
import { hasAnyRole } from '../utils/authorize.js'

const REVIEWER_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager']

const isReviewer = (user) => hasAnyRole(user, REVIEWER_ROLES)

function parseDate(value, field) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) throw new Error(`Valid ${field} is required`)
  date.setHours(0, 0, 0, 0)
  return date
}

// Normalise and validate the items array against the company's own doctors and
// chemists.
async function normalizeItems(rawItems, companyId) {
  if (!Array.isArray(rawItems)) return []
  const doctorIds = new Set()
  const medicalIds = new Set()
  const items = rawItems.map((item) => {
    const kind = String(item?.kind || '').toUpperCase()
    if (!['DOCTOR', 'MEDICAL'].includes(kind)) throw new Error('Each plan item must be a doctor or a chemist')
    const plannedDate = parseDate(item?.plannedDate, 'planned date')
    const entry = { kind, plannedDate, objective: item?.objective, notes: item?.notes }
    if (kind === 'DOCTOR') {
      if (!mongoose.Types.ObjectId.isValid(item?.doctorId)) throw new Error('A doctor is required on a doctor plan item')
      entry.doctorId = item.doctorId
      doctorIds.add(String(item.doctorId))
    } else {
      if (!mongoose.Types.ObjectId.isValid(item?.medicalId)) throw new Error('A chemist is required on a chemist plan item')
      entry.medicalId = item.medicalId
      medicalIds.add(String(item.medicalId))
    }
    return entry
  })
  const [validDoctors, validMedicals] = await Promise.all([
    doctorIds.size ? Doctor.find({ _id: { $in: [...doctorIds] }, companyId }).select('_id').lean() : [],
    medicalIds.size ? Medical.find({ _id: { $in: [...medicalIds] }, companyId }).select('_id').lean() : [],
  ])
  const okDoctors = new Set(validDoctors.map((d) => String(d._id)))
  const okMedicals = new Set(validMedicals.map((m) => String(m._id)))
  for (const item of items) {
    if (item.kind === 'DOCTOR' && !okDoctors.has(String(item.doctorId))) throw new Error('A planned doctor does not belong to your company')
    if (item.kind === 'MEDICAL' && !okMedicals.has(String(item.medicalId))) throw new Error('A planned chemist does not belong to your company')
  }
  return items
}

export async function listTourPlans(req, res) {
  try {
    const companyId = req.user.companyId
    const filter = { companyId }
    if (isReviewer(req.user)) {
      if (req.query.employeeId) filter.employeeId = req.query.employeeId
      if (req.query.mine === 'true') filter.employeeId = req.user.id
    } else {
      filter.employeeId = req.user.id
    }
    if (req.query.status) filter.status = String(req.query.status).toUpperCase()

    const plans = await TourPlan.find(filter)
      .populate('employeeId', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ periodStart: -1, createdAt: -1 })
      .lean()

    const withCounts = plans.map((plan) => ({
      ...plan,
      itemCount: (plan.items || []).length,
      items: undefined,
    }))
    return res.status(200).json({ tourPlans: withCounts })
  } catch (error) {
    return res.status(500).json({ message: 'Error listing tour plans', error: error.message })
  }
}

// Match each plan item to an actual visit by the same rep to the same place,
// on/after the planned date and up to a few days after the period.
async function reconcile(plan) {
  const windowEnd = new Date(plan.periodEnd)
  windowEnd.setDate(windowEnd.getDate() + 3)
  const visits = await Visit.find({
    companyId: plan.companyId,
    employeeId: plan.employeeId,
    status: { $in: ['completed', 'approved'] },
    visitedAt: { $gte: plan.periodStart, $lte: windowEnd },
  }).select('doctorId medicalId visitedAt').lean()

  const doctorVisits = new Map()
  const medicalVisits = new Map()
  for (const visit of visits) {
    if (visit.doctorId) {
      const key = String(visit.doctorId)
      if (!doctorVisits.has(key) || visit.visitedAt > doctorVisits.get(key)) doctorVisits.set(key, visit.visitedAt)
    }
    if (visit.medicalId) {
      const key = String(visit.medicalId)
      if (!medicalVisits.has(key) || visit.visitedAt > medicalVisits.get(key)) medicalVisits.set(key, visit.visitedAt)
    }
  }

  return (plan.items || []).map((item) => {
    const map = item.kind === 'DOCTOR' ? doctorVisits : medicalVisits
    const id = String(item.kind === 'DOCTOR' ? item.doctorId?._id || item.doctorId : item.medicalId?._id || item.medicalId)
    const visitedAt = map.get(id) || null
    return { ...item, visited: Boolean(visitedAt), visitedAt }
  })
}

export async function getTourPlan(req, res) {
  try {
    const companyId = req.user.companyId
    const plan = await TourPlan.findOne({ _id: req.params.id, companyId })
      .populate('employeeId', 'name email role')
      .populate('reviewedBy', 'name email role')
      .populate('items.doctorId', 'name clinicName city phone')
      .populate('items.medicalId', 'name area city mobile')
      .lean()
    if (!plan) return res.status(404).json({ message: 'Tour plan not found' })
    if (!isReviewer(req.user) && String(plan.employeeId._id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only view your own tour plans' })
    }

    const items = await reconcile(plan)
    const doneCount = items.filter((item) => item.visited).length
    return res.status(200).json({ tourPlan: { ...plan, items, doneCount } })
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching tour plan', error: error.message })
  }
}

export async function createTourPlan(req, res) {
  try {
    const companyId = req.user.companyId
    const periodStart = parseDate(req.body?.periodStart, 'start date')
    const periodEnd = parseDate(req.body?.periodEnd, 'end date')
    if (periodEnd < periodStart) return res.status(400).json({ message: 'End date cannot be before start date' })

    // A reviewer may create a plan for one of their reps; everyone else only for
    // themselves.
    let employeeId = req.user.id
    if (req.body?.employeeId && String(req.body.employeeId) !== String(req.user.id)) {
      if (!isReviewer(req.user)) return res.status(403).json({ message: 'You can only create your own tour plan' })
      const rep = await User.findOne({ _id: req.body.employeeId, companyId }).select('_id').lean()
      if (!rep) return res.status(400).json({ message: 'That employee is not in your company' })
      employeeId = req.body.employeeId
    }

    const items = await normalizeItems(req.body?.items, companyId)

    const plan = await TourPlan.create({
      companyId,
      employeeId,
      title: req.body?.title,
      periodStart,
      periodEnd,
      items,
      status: 'DRAFT',
      createdBy: req.user.id,
    })
    await recordAudit(req, 'tour_plan_created', { companyId, entityId: plan._id, module: 'tour_plans', newValue: { employeeId, periodStart, periodEnd } })
    return res.status(201).json({ message: 'Tour plan created', tourPlan: plan })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function updateTourPlan(req, res) {
  try {
    const companyId = req.user.companyId
    const plan = await TourPlan.findOne({ _id: req.params.id, companyId })
    if (!plan) return res.status(404).json({ message: 'Tour plan not found' })

    const isOwner = String(plan.employeeId) === String(req.user.id)
    if (!isOwner && !isReviewer(req.user)) return res.status(403).json({ message: 'You cannot edit this tour plan' })
    if (!['DRAFT', 'REJECTED'].includes(plan.status)) {
      return res.status(409).json({ message: 'Only a draft or rejected plan can be edited' })
    }

    if (req.body?.title !== undefined) plan.title = req.body.title
    if (req.body?.periodStart !== undefined) plan.periodStart = parseDate(req.body.periodStart, 'start date')
    if (req.body?.periodEnd !== undefined) plan.periodEnd = parseDate(req.body.periodEnd, 'end date')
    if (plan.periodEnd < plan.periodStart) return res.status(400).json({ message: 'End date cannot be before start date' })
    if (req.body?.items !== undefined) plan.items = await normalizeItems(req.body.items, companyId)
    if (plan.status === 'REJECTED') {
      plan.status = 'DRAFT'
      plan.reviewNote = undefined
      plan.reviewedBy = undefined
      plan.reviewedAt = undefined
    }

    await plan.save()
    await recordAudit(req, 'tour_plan_updated', { companyId, entityId: plan._id, module: 'tour_plans' })
    return res.status(200).json({ message: 'Tour plan updated', tourPlan: plan })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function submitTourPlan(req, res) {
  try {
    const companyId = req.user.companyId
    const plan = await TourPlan.findOne({ _id: req.params.id, companyId })
    if (!plan) return res.status(404).json({ message: 'Tour plan not found' })
    if (String(plan.employeeId) !== String(req.user.id)) return res.status(403).json({ message: 'Only the plan owner can submit it' })
    if (!['DRAFT', 'REJECTED'].includes(plan.status)) return res.status(409).json({ message: 'This plan has already been submitted' })
    if (!plan.items.length) return res.status(400).json({ message: 'Add at least one planned visit before submitting' })

    plan.status = 'SUBMITTED'
    plan.reviewNote = undefined
    plan.reviewedBy = undefined
    plan.reviewedAt = undefined
    await plan.save()
    await recordAudit(req, 'tour_plan_submitted', { companyId, entityId: plan._id, module: 'tour_plans' })
    return res.status(200).json({ message: 'Tour plan submitted for approval', tourPlan: plan })
  } catch (error) {
    return res.status(500).json({ message: 'Error submitting tour plan', error: error.message })
  }
}

export async function reviewTourPlan(req, res) {
  try {
    const companyId = req.user.companyId
    const action = String(req.body?.action || '').toLowerCase()
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Action must be approve or reject' })
    if (!isReviewer(req.user)) return res.status(403).json({ message: 'You cannot review tour plans' })

    const plan = await TourPlan.findOne({ _id: req.params.id, companyId })
    if (!plan) return res.status(404).json({ message: 'Tour plan not found' })
    if (plan.status !== 'SUBMITTED') return res.status(409).json({ message: 'Only a submitted plan can be reviewed' })
    if (action === 'reject' && !String(req.body?.reviewNote || '').trim()) {
      return res.status(400).json({ message: 'A reason is required to reject a plan' })
    }

    plan.status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    plan.reviewedBy = req.user.id
    plan.reviewedAt = new Date()
    plan.reviewNote = String(req.body?.reviewNote || '').trim() || undefined
    await plan.save()
    await recordAudit(req, `tour_plan_${plan.status.toLowerCase()}`, { companyId, entityId: plan._id, module: 'tour_plans', newValue: { status: plan.status } })
    return res.status(200).json({ message: `Tour plan ${action === 'approve' ? 'approved' : 'rejected'}`, tourPlan: plan })
  } catch (error) {
    return res.status(500).json({ message: 'Error reviewing tour plan', error: error.message })
  }
}

export async function deleteTourPlan(req, res) {
  try {
    const companyId = req.user.companyId
    const plan = await TourPlan.findOne({ _id: req.params.id, companyId })
    if (!plan) return res.status(404).json({ message: 'Tour plan not found' })
    const isOwner = String(plan.employeeId) === String(req.user.id)
    if (!isOwner && !isReviewer(req.user)) return res.status(403).json({ message: 'You cannot delete this tour plan' })
    if (plan.status === 'APPROVED' && !isReviewer(req.user)) {
      return res.status(409).json({ message: 'An approved plan can only be removed by a manager' })
    }
    await plan.deleteOne()
    await recordAudit(req, 'tour_plan_deleted', { companyId, entityId: plan._id, module: 'tour_plans' })
    return res.status(200).json({ message: 'Tour plan removed' })
  } catch (error) {
    return res.status(500).json({ message: 'Error removing tour plan', error: error.message })
  }
}

export default {
  listTourPlans,
  getTourPlan,
  createTourPlan,
  updateTourPlan,
  submitTourPlan,
  reviewTourPlan,
  deleteTourPlan,
}
