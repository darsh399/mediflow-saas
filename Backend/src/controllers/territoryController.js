import mongoose from 'mongoose'
import Territory from '../models/Territory.js'
import Doctor from '../models/Doctor.js'
import Medical from '../models/Medical.js'
import User from '../models/User.js'
import recordAudit from '../utils/audit.js'

function toObjectIds(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(String))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id))
}

// Confirm every id in `ids` is a user in this company. Returns the valid subset.
async function validateCompanyUsers(ids, companyId) {
  if (!ids.length) return []
  const users = await User.find({ _id: { $in: ids }, companyId }).select('_id').lean()
  return users.map((user) => user._id)
}

export async function listTerritories(req, res) {
  try {
    const companyId = req.user.companyId
    const filter = { companyId }
    if (req.query.active !== undefined) filter.active = req.query.active !== 'false'

    const territories = await Territory.find(filter)
      .populate('managerId', 'name email role')
      .populate('memberIds', 'name email role')
      .sort({ name: 1 })
      .lean()

    const ids = territories.map((territory) => territory._id)
    const [doctorCounts, medicalCounts] = await Promise.all([
      Doctor.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), territoryId: { $in: ids } } },
        { $group: { _id: '$territoryId', count: { $sum: 1 } } },
      ]),
      Medical.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), territoryId: { $in: ids } } },
        { $group: { _id: '$territoryId', count: { $sum: 1 } } },
      ]),
    ])
    const doctorMap = new Map(doctorCounts.map((row) => [String(row._id), row.count]))
    const medicalMap = new Map(medicalCounts.map((row) => [String(row._id), row.count]))

    const withCounts = territories.map((territory) => ({
      ...territory,
      doctorCount: doctorMap.get(String(territory._id)) || 0,
      medicalCount: medicalMap.get(String(territory._id)) || 0,
      memberCount: (territory.memberIds || []).length,
    }))

    return res.status(200).json({ territories: withCounts })
  } catch (error) {
    return res.status(500).json({ message: 'Error listing territories', error: error.message })
  }
}

export async function getTerritory(req, res) {
  try {
    const companyId = req.user.companyId
    const territory = await Territory.findOne({ _id: req.params.id, companyId })
      .populate('managerId', 'name email role')
      .populate('memberIds', 'name email role')
      .lean()
    if (!territory) return res.status(404).json({ message: 'Territory not found' })

    const [doctors, medicals] = await Promise.all([
      Doctor.find({ companyId, territoryId: territory._id }).select('name clinicName city district state phone specialty').sort({ name: 1 }).lean(),
      Medical.find({ companyId, territoryId: territory._id }).select('name contactPerson area city mobile').sort({ name: 1 }).lean(),
    ])

    return res.status(200).json({ territory: { ...territory, doctors, medicals } })
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching territory', error: error.message })
  }
}

export async function createTerritory(req, res) {
  try {
    const companyId = req.user.companyId
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: 'Territory name is required' })

    const memberIds = await validateCompanyUsers(toObjectIds(req.body?.memberIds), companyId)
    let managerId = null
    if (req.body?.managerId) {
      const [manager] = await validateCompanyUsers(toObjectIds([req.body.managerId]), companyId)
      if (!manager) return res.status(400).json({ message: 'Territory manager must belong to your company' })
      managerId = manager
    }

    const territory = await Territory.create({
      companyId,
      name,
      code: req.body?.code ? String(req.body.code).trim().toUpperCase() : undefined,
      description: req.body?.description,
      managerId,
      memberIds,
      areaTags: Array.isArray(req.body?.areaTags)
        ? [...new Set(req.body.areaTags.map((tag) => String(tag).trim()).filter(Boolean))]
        : [],
      createdBy: req.user.id,
    })
    await recordAudit(req, 'territory_created', { companyId, entityId: territory._id, module: 'territories', newValue: { name } })
    return res.status(201).json({ message: 'Territory created', territory })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A territory with this name already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function updateTerritory(req, res) {
  try {
    const companyId = req.user.companyId
    const territory = await Territory.findOne({ _id: req.params.id, companyId })
    if (!territory) return res.status(404).json({ message: 'Territory not found' })

    const oldValue = territory.toObject()

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim()
      if (!name) return res.status(400).json({ message: 'Territory name is required' })
      territory.name = name
    }
    if (req.body?.code !== undefined) territory.code = req.body.code ? String(req.body.code).trim().toUpperCase() : undefined
    if (req.body?.description !== undefined) territory.description = req.body.description
    if (req.body?.active !== undefined) territory.active = Boolean(req.body.active)
    if (req.body?.areaTags !== undefined) {
      territory.areaTags = Array.isArray(req.body.areaTags)
        ? [...new Set(req.body.areaTags.map((tag) => String(tag).trim()).filter(Boolean))]
        : []
    }
    if (req.body?.managerId !== undefined) {
      if (!req.body.managerId) {
        territory.managerId = null
      } else {
        const [manager] = await validateCompanyUsers(toObjectIds([req.body.managerId]), companyId)
        if (!manager) return res.status(400).json({ message: 'Territory manager must belong to your company' })
        territory.managerId = manager
      }
    }
    if (req.body?.memberIds !== undefined) {
      territory.memberIds = await validateCompanyUsers(toObjectIds(req.body.memberIds), companyId)
    }

    await territory.save()
    await recordAudit(req, 'territory_updated', { companyId, entityId: territory._id, module: 'territories', oldValue, newValue: territory.toObject() })
    return res.status(200).json({ message: 'Territory updated', territory })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A territory with this name already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function deleteTerritory(req, res) {
  try {
    const companyId = req.user.companyId
    const territory = await Territory.findOneAndUpdate({ _id: req.params.id, companyId }, { active: false }, { new: true })
    if (!territory) return res.status(404).json({ message: 'Territory not found' })
    // Detach places so they don't dangle against a hidden territory.
    await Promise.all([
      Doctor.updateMany({ companyId, territoryId: territory._id }, { $set: { territoryId: null } }),
      Medical.updateMany({ companyId, territoryId: territory._id }, { $set: { territoryId: null } }),
    ])
    await recordAudit(req, 'territory_deactivated', { companyId, entityId: territory._id, module: 'territories' })
    return res.status(200).json({ message: 'Territory removed' })
  } catch (error) {
    return res.status(500).json({ message: 'Error removing territory', error: error.message })
  }
}

// Replace the full set of doctors and/or chemists that belong to this territory.
// A place belongs to at most one territory, so assigning it here removes it from
// whichever territory it was in before.
export async function setTerritoryPlaces(req, res) {
  try {
    const companyId = req.user.companyId
    const territory = await Territory.findOne({ _id: req.params.id, companyId, active: true })
    if (!territory) return res.status(404).json({ message: 'Territory not found' })

    const result = {}

    if (Array.isArray(req.body?.doctorIds)) {
      const ids = toObjectIds(req.body.doctorIds)
      const valid = await Doctor.find({ _id: { $in: ids }, companyId }).select('_id').lean()
      const validIds = valid.map((doc) => doc._id)
      await Doctor.updateMany({ companyId, territoryId: territory._id, _id: { $nin: validIds } }, { $set: { territoryId: null } })
      await Doctor.updateMany({ companyId, _id: { $in: validIds } }, { $set: { territoryId: territory._id } })
      result.doctors = validIds.length
    }

    if (Array.isArray(req.body?.medicalIds)) {
      const ids = toObjectIds(req.body.medicalIds)
      const valid = await Medical.find({ _id: { $in: ids }, companyId }).select('_id').lean()
      const validIds = valid.map((doc) => doc._id)
      await Medical.updateMany({ companyId, territoryId: territory._id, _id: { $nin: validIds } }, { $set: { territoryId: null } })
      await Medical.updateMany({ companyId, _id: { $in: validIds } }, { $set: { territoryId: territory._id } })
      result.medicals = validIds.length
    }

    await recordAudit(req, 'territory_places_updated', { companyId, entityId: territory._id, module: 'territories', newValue: result })
    return res.status(200).json({ message: 'Territory assignments updated', ...result })
  } catch (error) {
    return res.status(500).json({ message: 'Error updating territory assignments', error: error.message })
  }
}

export default { listTerritories, getTerritory, createTerritory, updateTerritory, deleteTerritory, setTerritoryPlaces }
