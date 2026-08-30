import mongoose from 'mongoose'
import Doctor from '../models/Doctor.js'
import DoctorInteraction from '../models/DoctorInteraction.js'
import Visit from '../models/Visit.js'
import Sale from '../models/Sale.js'
import Order from '../models/Order.js'
import recordAudit from '../utils/audit.js'

const oid = (value) => new mongoose.Types.ObjectId(value)
const COMPLETED_VISIT = ['completed', 'approved']

async function loadDoctor(req) {
  const doctor = await Doctor.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!doctor) throw Object.assign(new Error('Doctor not found'), { status: 404 })
  return doctor
}

// PATCH /api/doctors/:id/crm — tier, tags, KYC, anniversary, consent.
export async function updateDoctorCrm(req, res) {
  try {
    const doctor = await loadDoctor(req)
    const oldValue = { tier: doctor.tier, tags: doctor.tags, marketingConsent: doctor.marketingConsent }

    if (req.body?.tier !== undefined) {
      const tier = String(req.body.tier || 'UNGRADED').toUpperCase()
      if (!['A', 'B', 'C', 'UNGRADED'].includes(tier)) return res.status(400).json({ message: 'Invalid tier' })
      doctor.tier = tier
    }
    if (req.body?.tags !== undefined) {
      doctor.tags = Array.isArray(req.body.tags)
        ? [...new Set(req.body.tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 20)
        : []
    }
    if (req.body?.kyc !== undefined && req.body.kyc) {
      const k = req.body.kyc
      doctor.kyc = {
        registrationNumber: k.registrationNumber?.trim() || undefined,
        qualification: k.qualification?.trim() || undefined,
        hospitalAffiliation: k.hospitalAffiliation?.trim() || undefined,
        preferredContact: ['PHONE', 'EMAIL', 'WHATSAPP', 'IN_PERSON', ''].includes(k.preferredContact) ? k.preferredContact : '',
        preferredContactTime: k.preferredContactTime?.trim() || undefined,
      }
    }
    if (req.body?.anniversaryDate !== undefined) {
      doctor.anniversaryDate = req.body.anniversaryDate ? new Date(req.body.anniversaryDate) : undefined
    }
    if (req.body?.marketingConsent !== undefined) {
      const consent = Boolean(req.body.marketingConsent)
      if (consent && !doctor.marketingConsent) doctor.consentCapturedAt = new Date()
      if (!consent) doctor.consentCapturedAt = undefined
      doctor.marketingConsent = consent
    }

    await doctor.save()
    await recordAudit(req, 'doctor_crm_updated', { companyId: req.user.companyId, entityId: doctor._id, module: 'doctors', oldValue, newValue: { tier: doctor.tier, tags: doctor.tags, marketingConsent: doctor.marketingConsent } })
    return res.status(200).json({ doctor })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function listInteractions(req, res) {
  try {
    await loadDoctor(req)
    const interactions = await DoctorInteraction.find({ companyId: req.user.companyId, doctorId: req.params.id })
      .populate('employeeId', 'name role')
      .sort({ occurredAt: -1 })
      .lean()
    return res.status(200).json({ interactions })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

export async function createInteraction(req, res) {
  try {
    const doctor = await loadDoctor(req)
    const kind = String(req.body?.kind || '').toUpperCase()
    const summary = String(req.body?.summary || '').trim()
    if (!kind || !summary) return res.status(400).json({ message: 'kind and summary are required' })
    if (!DoctorInteraction.schema.path('kind').enumValues.includes(kind)) {
      return res.status(400).json({ message: 'Invalid interaction type' })
    }

    const occurredAt = req.body?.occurredAt ? new Date(req.body.occurredAt) : new Date()
    const interaction = await DoctorInteraction.create({
      companyId: req.user.companyId,
      doctorId: doctor._id,
      employeeId: req.user.id,
      kind,
      summary,
      outcome: req.body?.outcome?.trim() || undefined,
      followUpDate: req.body?.followUpDate ? new Date(req.body.followUpDate) : undefined,
      occurredAt,
      createdBy: req.user.id,
    })

    if (!doctor.lastInteractionAt || occurredAt > doctor.lastInteractionAt) {
      doctor.lastInteractionAt = occurredAt
      await doctor.save()
    }
    await recordAudit(req, 'doctor_interaction_logged', { companyId: req.user.companyId, entityId: doctor._id, module: 'doctors', newValue: { kind } })
    return res.status(201).json({ interaction })
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message })
  }
}

export async function deleteInteraction(req, res) {
  try {
    const interaction = await DoctorInteraction.findOne({ _id: req.params.interactionId, companyId: req.user.companyId, doctorId: req.params.id })
    if (!interaction) return res.status(404).json({ message: 'Interaction not found' })
    const isOwner = String(interaction.employeeId) === String(req.user.id)
    if (!isOwner && !['admin', 'company_owner', 'hr_manager', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You can only remove your own interactions' })
    }
    await interaction.deleteOne()
    return res.status(200).json({ message: 'Interaction removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// GET /api/doctors/:id/summary — engagement stats.
export async function getDoctorSummary(req, res) {
  try {
    const doctor = await loadDoctor(req)
    const companyId = req.user.companyId

    const [visitAgg, lastVisit, salesAgg, orderCount, responseMix, nextFollowUp] = await Promise.all([
      Visit.countDocuments({ companyId, doctorId: doctor._id, status: { $in: COMPLETED_VISIT } }),
      Visit.findOne({ companyId, doctorId: doctor._id, status: { $in: COMPLETED_VISIT } }).sort({ visitedAt: -1 }).select('visitedAt employeeId').populate('employeeId', 'name').lean(),
      Sale.aggregate([
        { $match: { companyId: oid(companyId), doctorId: oid(doctor._id) } },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ companyId, doctorId: doctor._id }),
      Visit.aggregate([
        { $match: { companyId: oid(companyId), doctorId: oid(doctor._id), doctorResponse: { $ne: null } } },
        { $group: { _id: '$doctorResponse', count: { $sum: 1 } } },
      ]),
      DoctorInteraction.findOne({ companyId, doctorId: doctor._id, followUpDate: { $gte: new Date() } }).sort({ followUpDate: 1 }).select('followUpDate summary').lean(),
    ])

    const lastActivity = doctor.lastInteractionAt || lastVisit?.visitedAt || null
    const daysSince = lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000) : null

    return res.status(200).json({
      totalVisits: visitAgg,
      lastVisitAt: lastVisit?.visitedAt || null,
      lastVisitBy: lastVisit?.employeeId?.name || null,
      salesValue: Math.round(salesAgg[0]?.amount || 0),
      salesCount: salesAgg[0]?.count || 0,
      orderCount,
      responseMix: responseMix.map((row) => ({ response: row._id, count: row.count })),
      daysSinceLastActivity: daysSince,
      nextFollowUp: nextFollowUp || null,
    })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

// GET /api/doctors/:id/timeline — merged feed of visits, sales, orders, interactions.
export async function getDoctorTimeline(req, res) {
  try {
    const doctor = await loadDoctor(req)
    const companyId = req.user.companyId

    const [visits, sales, orders, interactions] = await Promise.all([
      Visit.find({ companyId, doctorId: doctor._id }).populate('employeeId', 'name').sort({ visitedAt: -1 }).limit(100).lean(),
      Sale.find({ companyId, doctorId: doctor._id }).populate('employeeId', 'name').populate('productId', 'name').sort({ saleDate: -1 }).limit(100).lean(),
      Order.find({ companyId, doctorId: doctor._id }).populate('createdBy', 'name').populate('items.productId', 'name').sort({ createdAt: -1 }).limit(100).lean(),
      DoctorInteraction.find({ companyId, doctorId: doctor._id }).populate('employeeId', 'name').sort({ occurredAt: -1 }).limit(100).lean(),
    ])

    const events = []
    for (const visit of visits) {
      events.push({
        kind: 'VISIT',
        at: visit.visitedAt,
        by: visit.employeeId?.name || null,
        title: `Visit · ${String(visit.status || '').replace(/_/g, ' ')}`,
        detail: visit.discussion || visit.notes || '',
        response: visit.doctorResponse || null,
        id: String(visit._id),
      })
    }
    for (const sale of sales) {
      events.push({
        kind: 'SALE',
        at: sale.saleDate,
        by: sale.employeeId?.name || null,
        title: `Sale · ₹${Number(sale.amount || 0).toLocaleString('en-IN')}`,
        detail: [sale.productId?.name, sale.notes].filter(Boolean).join(' — '),
        id: String(sale._id),
      })
    }
    for (const order of orders) {
      const items = (order.items || []).map((item) => `${item.productId?.name || 'Product'} ×${item.quantity}`).join(', ')
      events.push({
        kind: 'ORDER',
        at: order.createdAt,
        by: order.createdBy?.name || null,
        title: `Order · ${order.status}`,
        detail: items,
        id: String(order._id),
      })
    }
    for (const interaction of interactions) {
      events.push({
        kind: 'INTERACTION',
        subKind: interaction.kind,
        at: interaction.occurredAt,
        by: interaction.employeeId?.name || null,
        title: `${interaction.kind.charAt(0)}${interaction.kind.slice(1).toLowerCase()}`,
        detail: [interaction.summary, interaction.outcome].filter(Boolean).join(' — '),
        followUpDate: interaction.followUpDate || null,
        id: String(interaction._id),
      })
    }

    events.sort((a, b) => new Date(b.at) - new Date(a.at))
    return res.status(200).json({ events: events.slice(0, 150) })
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message })
  }
}

// GET /api/doctors/engagement — company doctor list with engagement signals.
export async function listDoctorEngagement(req, res) {
  try {
    const companyId = req.user.companyId
    const filter = { companyId }
    if (req.query.tier) filter.tier = String(req.query.tier).toUpperCase()
    if (req.query.specialty) filter.specialty = new RegExp(String(req.query.specialty).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (req.query.territoryId) filter.territoryId = req.query.territoryId
    if (req.query.consent === 'true') filter.marketingConsent = true

    const doctors = await Doctor.find(filter)
      .select('name clinicName city specialty tier tags dateOfBirth anniversaryDate marketingConsent lastInteractionAt territoryId')
      .populate('territoryId', 'name')
      .sort({ tier: 1, name: 1 })
      .lean()
    if (!doctors.length) return res.status(200).json({ doctors: [], summary: { total: 0, tierA: 0, birthdays: 0, dueFollowUp: 0 } })

    const ids = doctors.map((doctor) => doctor._id)
    const [lastVisits, followUps] = await Promise.all([
      Visit.aggregate([
        { $match: { companyId: oid(companyId), doctorId: { $in: ids }, status: { $in: COMPLETED_VISIT } } },
        { $group: { _id: '$doctorId', lastVisitAt: { $max: '$visitedAt' }, count: { $sum: 1 } } },
      ]),
      DoctorInteraction.aggregate([
        { $match: { companyId: oid(companyId), doctorId: { $in: ids }, followUpDate: { $gte: new Date() } } },
        { $group: { _id: '$doctorId', nextFollowUp: { $min: '$followUpDate' } } },
      ]),
    ])
    const visitMap = new Map(lastVisits.map((row) => [String(row._id), row]))
    const followMap = new Map(followUps.map((row) => [String(row._id), row.nextFollowUp]))

    const now = new Date()
    const thisMonth = now.getMonth() + 1
    const threshold = Math.max(1, Number(req.query.days) || 30)

    let rows = doctors.map((doctor) => {
      const visit = visitMap.get(String(doctor._id))
      const lastActivity = doctor.lastInteractionAt && visit?.lastVisitAt
        ? (doctor.lastInteractionAt > visit.lastVisitAt ? doctor.lastInteractionAt : visit.lastVisitAt)
        : (doctor.lastInteractionAt || visit?.lastVisitAt || null)
      const daysSince = lastActivity ? Math.floor((now - new Date(lastActivity).getTime()) / 86400000) : null
      const birthdayThisMonth = doctor.dateOfBirth && new Date(doctor.dateOfBirth).getMonth() + 1 === thisMonth
      const anniversaryThisMonth = doctor.anniversaryDate && new Date(doctor.anniversaryDate).getMonth() + 1 === thisMonth
      return {
        _id: doctor._id,
        name: doctor.name,
        clinicName: doctor.clinicName || null,
        city: doctor.city || null,
        specialty: doctor.specialty || null,
        tier: doctor.tier || 'UNGRADED',
        tags: doctor.tags || [],
        territory: doctor.territoryId?.name || null,
        marketingConsent: !!doctor.marketingConsent,
        visitCount: visit?.count || 0,
        lastActivityAt: lastActivity,
        daysSince,
        overdue: daysSince === null || daysSince > threshold,
        birthdayThisMonth,
        anniversaryThisMonth,
        nextFollowUp: followMap.get(String(doctor._id)) || null,
      }
    })

    if (req.query.overdue === 'true') rows = rows.filter((row) => row.overdue)
    if (req.query.birthday === 'true') rows = rows.filter((row) => row.birthdayThisMonth)
    if (req.query.followUp === 'true') rows = rows.filter((row) => row.nextFollowUp)

    const tierRank = { A: 0, B: 1, C: 2, UNGRADED: 3 }
    rows.sort((a, b) => (tierRank[a.tier] - tierRank[b.tier]) || ((b.daysSince ?? 9999) - (a.daysSince ?? 9999)))

    const summary = {
      total: rows.length,
      tierA: rows.filter((row) => row.tier === 'A').length,
      birthdays: rows.filter((row) => row.birthdayThisMonth).length,
      dueFollowUp: rows.filter((row) => row.nextFollowUp).length,
      overdue: rows.filter((row) => row.overdue).length,
    }
    return res.status(200).json({ doctors: rows, summary })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export default {
  updateDoctorCrm,
  listInteractions,
  createInteraction,
  deleteInteraction,
  getDoctorSummary,
  getDoctorTimeline,
  listDoctorEngagement,
}
