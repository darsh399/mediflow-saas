import mongoose from 'mongoose'
import SampleItem from '../models/SampleItem.js'
import SampleTransaction from '../models/SampleTransaction.js'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'
import recordAudit from '../utils/audit.js'
import { hasAnyRole } from '../utils/authorize.js'
import { scopedEmployeeIds, canAccessEmployee } from '../utils/teamScope.js'

const MANAGER_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager', 'project_manager']
const isManager = (user) => hasAnyRole(user, MANAGER_ROLES)

const positiveQty = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

async function balanceFor(companyId, employeeId, itemId) {
  const rows = await SampleTransaction.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: new mongoose.Types.ObjectId(employeeId), itemId: new mongoose.Types.ObjectId(itemId) } },
    { $group: { _id: null, issued: { $sum: { $cond: [{ $in: ['$type', ['ISSUE', 'ADJUST']] }, '$quantity', 0] } }, out: { $sum: { $cond: [{ $in: ['$type', ['RETURN', 'GIVEN']] }, '$quantity', 0] } } } },
  ])
  const row = rows[0] || { issued: 0, out: 0 }
  return row.issued - row.out
}

async function resolveItem(companyId, itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) return null
  return SampleItem.findOne({ _id: itemId, companyId })
}

// Reuse an item with the same name (case-insensitive) or create one — lets the
// issue form take a typed name or an existing product without a separate step.
async function findOrCreateItem(companyId, { name, kind, unit }, createdBy) {
  const clean = String(name || '').trim()
  if (!clean) return null
  const existing = await SampleItem.findOne({ companyId, name: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
  if (existing) return existing
  try {
    return await SampleItem.create({
      companyId,
      name: clean,
      kind: ['SAMPLE', 'GIFT'].includes(kind) ? kind : 'SAMPLE',
      unit: String(unit || 'unit').trim() || 'unit',
      createdBy,
    })
  } catch (error) {
    if (error?.code === 11000) return SampleItem.findOne({ companyId, name: clean })
    throw error
  }
}

export async function listItems(req, res) {
  try {
    const filter = { companyId: req.user.companyId }
    if (req.query.active !== undefined) filter.active = req.query.active !== 'false'
    const items = await SampleItem.find(filter).sort({ name: 1 }).lean()
    return res.status(200).json({ items })
  } catch (error) {
    return res.status(500).json({ message: 'Error listing sample items', error: error.message })
  }
}

export async function createItem(req, res) {
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: 'Name is required' })
    const kind = ['SAMPLE', 'GIFT'].includes(req.body?.kind) ? req.body.kind : 'SAMPLE'
    const unit = String(req.body?.unit || 'unit').trim() || 'unit'
    const item = await SampleItem.create({ companyId: req.user.companyId, name, kind, unit, createdBy: req.user.id })
    await recordAudit(req, 'sample_item_created', { companyId: req.user.companyId, entityId: item._id, module: 'visits' })
    return res.status(201).json({ item })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An item with this name already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function updateItem(req, res) {
  try {
    const item = await resolveItem(req.user.companyId, req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found' })
    if (req.body?.name !== undefined) item.name = String(req.body.name).trim() || item.name
    if (['SAMPLE', 'GIFT'].includes(req.body?.kind)) item.kind = req.body.kind
    if (req.body?.unit !== undefined) item.unit = String(req.body.unit).trim() || item.unit
    if (req.body?.active !== undefined) item.active = Boolean(req.body.active)
    await item.save()
    return res.status(200).json({ item })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An item with this name already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function getBalances(req, res) {
  try {
    const companyId = req.user.companyId
    const match = { companyId: new mongoose.Types.ObjectId(companyId) }
    if (isManager(req.user)) {
      const allowed = await scopedEmployeeIds(req.user)
      if (req.query.employeeId) {
        if (!(await canAccessEmployee(req.user, req.query.employeeId))) return res.status(403).json({ message: 'This rep is not in your team' })
        match.employeeId = new mongoose.Types.ObjectId(req.query.employeeId)
      } else if (allowed) {
        match.employeeId = { $in: allowed.map((id) => new mongoose.Types.ObjectId(id)) }
      }
    } else {
      match.employeeId = new mongoose.Types.ObjectId(req.user.id)
    }

    const rows = await SampleTransaction.aggregate([
      { $match: match },
      { $group: { _id: { employeeId: '$employeeId', itemId: '$itemId' }, balance: { $sum: { $multiply: [{ $cond: [{ $in: ['$type', ['RETURN', 'GIVEN']] }, -1, 1] }, '$quantity'] } } } },
    ])

    const itemIds = [...new Set(rows.map((row) => String(row._id.itemId)))]
    const empIds = [...new Set(rows.map((row) => String(row._id.employeeId)))]
    const [items, employees] = await Promise.all([
      SampleItem.find({ _id: { $in: itemIds } }).select('name kind unit active').lean(),
      User.find({ _id: { $in: empIds } }).select('name email role').lean(),
    ])
    const itemMap = new Map(items.map((item) => [String(item._id), item]))
    const empMap = new Map(employees.map((employee) => [String(employee._id), employee]))

    const balances = rows
      .map((row) => ({
        employeeId: String(row._id.employeeId),
        employee: empMap.get(String(row._id.employeeId)) || null,
        itemId: String(row._id.itemId),
        item: itemMap.get(String(row._id.itemId)) || null,
        balance: row.balance,
      }))
      .filter((row) => row.item)
      .sort((a, b) => (a.employee?.name || '').localeCompare(b.employee?.name || '') || (a.item?.name || '').localeCompare(b.item?.name || ''))

    return res.status(200).json({ balances })
  } catch (error) {
    return res.status(500).json({ message: 'Error loading balances', error: error.message })
  }
}

export async function listTransactions(req, res) {
  try {
    const companyId = req.user.companyId
    const filter = { companyId }
    if (isManager(req.user)) {
      const allowed = await scopedEmployeeIds(req.user)
      if (req.query.employeeId && (await canAccessEmployee(req.user, req.query.employeeId))) filter.employeeId = req.query.employeeId
      else if (allowed) filter.employeeId = { $in: allowed }
    } else {
      filter.employeeId = req.user.id
    }
    if (req.query.itemId && mongoose.Types.ObjectId.isValid(req.query.itemId)) filter.itemId = req.query.itemId
    if (['ISSUE', 'RETURN', 'GIVEN', 'ADJUST'].includes(req.query.type)) filter.type = req.query.type
    if (req.query.from || req.query.to) {
      filter.occurredAt = {}
      if (req.query.from) filter.occurredAt.$gte = new Date(req.query.from)
      if (req.query.to) { const end = new Date(req.query.to); end.setHours(23, 59, 59, 999); filter.occurredAt.$lte = end }
    }

    const transactions = await SampleTransaction.find(filter)
      .populate('itemId', 'name kind unit')
      .populate('employeeId', 'name email role')
      .populate('doctorId', 'name')
      .sort({ occurredAt: -1 })
      .limit(300)
      .lean()
    return res.status(200).json({ transactions })
  } catch (error) {
    return res.status(500).json({ message: 'Error listing transactions', error: error.message })
  }
}

// Manager hands stock to a rep.
export async function issueStock(req, res) {
  try {
    const companyId = req.user.companyId
    const quantity = positiveQty(req.body?.quantity)
    if (!quantity) return res.status(400).json({ message: 'A quantity greater than 0 is required' })
    const item = req.body?.itemId
      ? await resolveItem(companyId, req.body.itemId)
      : await findOrCreateItem(companyId, { name: req.body?.itemName, kind: req.body?.kind, unit: req.body?.unit }, req.user.id)
    if (!item) return res.status(404).json({ message: 'Select or name an item to issue' })
    if (!(await canAccessEmployee(req.user, req.body?.employeeId))) return res.status(403).json({ message: 'This rep is not in your team' })
    const employee = await User.findOne({ _id: req.body.employeeId, companyId }).select('_id').lean()
    if (!employee) return res.status(404).json({ message: 'Rep not found in this company' })

    const txn = await SampleTransaction.create({
      companyId, itemId: item._id, employeeId: employee._id, type: 'ISSUE', quantity,
      note: String(req.body?.note || '').trim() || undefined, createdBy: req.user.id,
    })
    await recordAudit(req, 'sample_issued', { companyId, entityId: txn._id, module: 'visits', newValue: { itemId: item._id, employeeId: employee._id, quantity } })
    return res.status(201).json({ transaction: txn })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// Rep records handing samples to a doctor (or returning them to stock).
async function outboundTransaction(req, res, type) {
  const companyId = req.user.companyId
  const quantity = positiveQty(req.body?.quantity)
  if (!quantity) return res.status(400).json({ message: 'A quantity greater than 0 is required' })
  const item = await resolveItem(companyId, req.body?.itemId)
  if (!item) return res.status(404).json({ message: 'Item not found' })

  let employeeId = String(req.user.id)
  if (req.body?.employeeId && String(req.body.employeeId) !== employeeId) {
    if (!isManager(req.user) || !(await canAccessEmployee(req.user, req.body.employeeId))) {
      return res.status(403).json({ message: 'You can only record your own stock' })
    }
    employeeId = String(req.body.employeeId)
  }

  const available = await balanceFor(companyId, employeeId, item._id)
  if (quantity > available) return res.status(400).json({ message: `Only ${available} ${item.unit}(s) of ${item.name} in hand` })

  const payload = {
    companyId, itemId: item._id, employeeId, type, quantity,
    note: String(req.body?.note || '').trim() || undefined, createdBy: req.user.id,
  }
  if (type === 'GIVEN') {
    if (req.body?.doctorId) {
      const doctor = await Doctor.findOne({ _id: req.body.doctorId, companyId }).select('_id').lean()
      if (!doctor) return res.status(404).json({ message: 'Doctor not found in this company' })
      payload.doctorId = doctor._id
    }
    if (req.body?.visitId && mongoose.Types.ObjectId.isValid(req.body.visitId)) payload.visitId = req.body.visitId
  }

  const txn = await SampleTransaction.create(payload)
  await recordAudit(req, `sample_${type.toLowerCase()}`, { companyId, entityId: txn._id, module: 'visits', newValue: { itemId: item._id, quantity } })
  return res.status(201).json({ transaction: txn })
}

export async function recordGiven(req, res) {
  try {
    return await outboundTransaction(req, res, 'GIVEN')
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function recordReturn(req, res) {
  try {
    return await outboundTransaction(req, res, 'RETURN')
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// Manager corrects a rep's balance up or down.
export async function adjustStock(req, res) {
  try {
    const companyId = req.user.companyId
    const quantity = Number(req.body?.quantity)
    if (!Number.isFinite(quantity) || quantity === 0) return res.status(400).json({ message: 'A non-zero adjustment is required' })
    const item = await resolveItem(companyId, req.body?.itemId)
    if (!item) return res.status(404).json({ message: 'Item not found' })
    if (!(await canAccessEmployee(req.user, req.body?.employeeId))) return res.status(403).json({ message: 'This rep is not in your team' })

    const txn = await SampleTransaction.create({
      companyId, itemId: item._id, employeeId: req.body.employeeId, type: 'ADJUST', quantity,
      note: String(req.body?.note || '').trim() || undefined, createdBy: req.user.id,
    })
    await recordAudit(req, 'sample_adjusted', { companyId, entityId: txn._id, module: 'visits', newValue: { itemId: item._id, quantity } })
    return res.status(201).json({ transaction: txn })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export default { listItems, createItem, updateItem, getBalances, listTransactions, issueStock, recordGiven, recordReturn, adjustStock }
