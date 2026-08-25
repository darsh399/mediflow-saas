import OrganizationUnit from '../models/OrganizationUnit.js'
import User from '../models/User.js'
import recordAudit from '../utils/audit.js'

const types = ['DEPARTMENT', 'DESIGNATION', 'BRANCH', 'TEAM']

function validateType(type) {
  const normalized = String(type || '').toUpperCase()
  if (!types.includes(normalized)) throw new Error('Invalid organization unit type')
  return normalized
}

export async function listUnits(req, res) {
  try {
    const filter = { companyId: req.user.companyId }
    if (req.query.type) filter.type = validateType(req.query.type)
    if (req.query.active !== undefined) filter.active = req.query.active !== 'false'
    const units = await OrganizationUnit.find(filter).populate('managerId', 'name email role').sort({ type: 1, name: 1 }).lean()
    return res.status(200).json({ units })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function createUnit(req, res) {
  try {
    const type = validateType(req.body?.type)
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: 'Organization unit name is required' })
    if (req.body?.managerId) {
      const manager = await User.findOne({ _id: req.body.managerId, companyId: req.user.companyId })
      if (!manager) return res.status(400).json({ message: 'Manager must belong to the current company' })
    }
    if (req.body?.parentId) {
      const parent = await OrganizationUnit.findOne({ _id: req.body.parentId, companyId: req.user.companyId })
      if (!parent) return res.status(400).json({ message: 'Parent unit must belong to the current company' })
    }
    const unit = await OrganizationUnit.create({ companyId: req.user.companyId, type, name, description: req.body.description, managerId: req.body.managerId, parentId: req.body.parentId })
    await recordAudit(req, 'organization_unit_created', { companyId: req.user.companyId, entityId: unit._id, module: 'organization', newValue: { type, name } })
    return res.status(201).json({ message: 'Organization unit created', unit })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An organization unit with this name already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function updateUnit(req, res) {
  try {
    const unit = await OrganizationUnit.findOne({ _id: req.params.id, companyId: req.user.companyId })
    if (!unit) return res.status(404).json({ message: 'Organization unit not found' })
    const oldValue = { type: unit.type, name: unit.name, description: unit.description, managerId: unit.managerId, parentId: unit.parentId, active: unit.active }
    if (req.body?.type !== undefined) unit.type = validateType(req.body.type)
    if (req.body?.name !== undefined) {
      unit.name = String(req.body.name).trim()
      if (!unit.name) return res.status(400).json({ message: 'Organization unit name is required' })
    }
    if (req.body?.managerId !== undefined) {
      const manager = await User.findOne({ _id: req.body.managerId, companyId: req.user.companyId })
      if (!manager) return res.status(400).json({ message: 'Manager must belong to the current company' })
      unit.managerId = req.body.managerId
    }
    if (req.body?.parentId !== undefined) {
      if (String(req.body.parentId) === String(unit._id)) return res.status(400).json({ message: 'An organization unit cannot be its own parent' })
      const parent = await OrganizationUnit.findOne({ _id: req.body.parentId, companyId: req.user.companyId })
      if (!parent) return res.status(400).json({ message: 'Parent unit must belong to the current company' })
      unit.parentId = req.body.parentId
    }
    if (req.body?.description !== undefined) unit.description = req.body.description
    if (req.body?.active !== undefined) unit.active = Boolean(req.body.active)
    await unit.save()
    await recordAudit(req, 'organization_unit_updated', { companyId: req.user.companyId, entityId: unit._id, module: 'organization', oldValue, newValue: unit.toObject() })
    return res.status(200).json({ message: 'Organization unit updated', unit })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An organization unit with this name already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function deleteUnit(req, res) {
  const unit = await OrganizationUnit.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, { active: false }, { new: true })
  if (!unit) return res.status(404).json({ message: 'Organization unit not found' })
  await recordAudit(req, 'organization_unit_deactivated', { companyId: req.user.companyId, entityId: unit._id, module: 'organization' })
  return res.status(200).json({ message: 'Organization unit deactivated', unit })
}

export default { listUnits, createUnit, updateUnit, deleteUnit }
