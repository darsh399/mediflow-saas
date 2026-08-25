import LeavePolicy from '../models/LeavePolicy.js'
import LeaveBalance from '../models/LeaveBalance.js'
import LeaveLedger from '../models/LeaveLedger.js'
import User from '../models/User.js'

const defaultTypes = [
  { code: 'CASUAL', name: 'Casual Leave', yearlyAllowance: 6 },
  { code: 'SICK', name: 'Sick Leave', yearlyAllowance: 12 },
  { code: 'EARNED', name: 'Earned Leave', yearlyAllowance: 0, monthlyAccrual: 1 },
  { code: 'OPTIONAL', name: 'Optional Leave', yearlyAllowance: 3 },
  { code: 'UNPAID', name: 'Unpaid Leave', yearlyAllowance: 0 },
]

function monthKey(date) {
  const value = new Date(date)
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthCursor(start, end) {
  const values = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  while (cursor <= end) {
    values.push(monthKey(cursor))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return values
}

export async function getOrCreatePolicy(companyId) {
  let policy = await LeavePolicy.findOne({ companyId })
  if (!policy) policy = await LeavePolicy.create({ companyId, leaveTypes: defaultTypes })
  return policy
}

export async function getPolicy(companyId) {
  return getOrCreatePolicy(companyId)
}

export async function upsertPolicy(companyId, leaveTypes, updatedBy) {
  if (!Array.isArray(leaveTypes)) throw new Error('leaveTypes must be an array')
  const normalized = leaveTypes.map((type) => ({
    ...type,
    code: String(type.code || '').trim().toUpperCase(),
    name: String(type.name || '').trim(),
  }))
  if (normalized.some((type) => !type.code || !type.name)) throw new Error('Leave type code and name are required')
  if (new Set(normalized.map((type) => type.code)).size !== normalized.length) throw new Error('Leave type codes must be unique')
  if (normalized.some((type) => type.yearlyAllowance < 0 || type.monthlyAccrual < 0 || type.maxCarryForward < 0 || type.minimumNoticeDays < 0 || (type.maximumConsecutiveDays !== undefined && type.maximumConsecutiveDays < 0))) throw new Error('Leave policy values cannot be negative')
  return LeavePolicy.findOneAndUpdate({ companyId }, { leaveTypes: normalized, updatedBy }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true })
}

async function getBalance(companyId, employeeId, type) {
  return LeaveBalance.findOneAndUpdate(
    { companyId, employeeId, leaveTypeCode: type.code },
    { $setOnInsert: { leaveTypeId: type._id, available: 0, used: 0, pending: 0, carryForward: 0 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}

async function addLedgerEntry({ balance, companyId, employeeId, type, amount, transactionType, source, referenceId, monthKey: key, description, performedBy }) {
  if (transactionType === 'MONTHLY_ACCRUAL' && key) {
    const existing = await LeaveLedger.exists({ companyId, employeeId, leaveTypeCode: type.code, transactionType, monthKey: key })
    if (existing) return balance
  }
  const before = balance.available
  const after = Number((before + amount).toFixed(2))
  if (after < 0) throw new Error(`Insufficient ${type.name} balance`)
  balance.available = after
  if (transactionType === 'LEAVE_APPROVED') balance.used = Number((balance.used + Math.abs(amount)).toFixed(2))
  if (transactionType === 'LEAVE_CANCELLED') balance.used = Math.max(0, Number((balance.used - Math.abs(amount)).toFixed(2)))
  if (transactionType === 'MANUAL_ADJUSTMENT' && amount < 0) balance.used = Number((balance.used + Math.abs(amount)).toFixed(2))
  await balance.save()
  await LeaveLedger.create({ companyId, employeeId, leaveTypeId: type._id, leaveTypeCode: type.code, transactionType, amount, balanceBefore: before, balanceAfter: after, source, referenceId, monthKey: key, description, performedBy })
  return balance
}

export async function ensureAccrual(companyId, employeeId) {
  const [policy, employee] = await Promise.all([getOrCreatePolicy(companyId), User.findOne({ _id: employeeId, companyId }).select('joiningDate createdAt')])
  if (!employee) throw new Error('Employee not found')
  const joined = new Date(employee.joiningDate || employee.createdAt || new Date())
  const now = new Date()
  const months = monthCursor(joined, now)
  for (const type of policy.leaveTypes.filter((item) => item.enabled && item.monthlyAccrual > 0)) {
    const balance = await getBalance(companyId, employeeId, type)
    for (const key of months) {
      try {
        await addLedgerEntry({ balance, companyId, employeeId, type, amount: type.monthlyAccrual, transactionType: 'MONTHLY_ACCRUAL', source: 'monthly_accrual', monthKey: key, description: `${type.name} accrual for ${key}` })
      } catch (error) {
        if (error.code !== 11000) throw error
      }
    }
  }
  return getBalances(companyId, employeeId)
}

export async function getBalances(companyId, employeeId) {
  const policy = await getOrCreatePolicy(companyId)
  await Promise.all(policy.leaveTypes.filter((type) => type.enabled).map((type) => getBalance(companyId, employeeId, type)))
  return LeaveBalance.find({ companyId, employeeId }).sort({ leaveTypeCode: 1 }).lean()
}

export async function changeBalance({ companyId, employeeId, leaveTypeCode, amount, transactionType, source, referenceId, description, performedBy }) {
  const policy = await getOrCreatePolicy(companyId)
  const type = policy.leaveTypes.find((item) => item.code === String(leaveTypeCode).toUpperCase() && item.enabled)
  if (!type) throw new Error('Leave type is not enabled')
  const balance = await getBalance(companyId, employeeId, type)
  return addLedgerEntry({ balance, companyId, employeeId, type, amount: Number(amount), transactionType, source, referenceId, description, performedBy })
}

export async function getLedger(companyId, employeeId, leaveTypeCode) {
  return LeaveLedger.find({ companyId, employeeId, ...(leaveTypeCode ? { leaveTypeCode: String(leaveTypeCode).toUpperCase() } : {}) }).sort({ createdAt: -1 }).populate('performedBy', 'name email role').lean()
}

export { monthKey }
export default { getPolicy, upsertPolicy, ensureAccrual, getBalances, changeBalance, getLedger }
