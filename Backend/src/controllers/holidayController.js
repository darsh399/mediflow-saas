import Holiday from '../models/Holiday.js'
import Company from '../models/Company.js'
import recordAudit from '../utils/audit.js'

function parseDate(value, field) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) throw new Error(`Valid ${field} is required`)
  date.setHours(0, 0, 0, 0)
  return date
}

function validateRange(start, end) {
  if (end && end < start) throw new Error('End date cannot be before start date')
}

const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export async function getCalendarSettings(req, res) {
  const company = await Company.findById(req.user.companyId).select('weeklyWorkingDays')
  if (!company) return res.status(404).json({ message: 'Company not found' })
  return res.status(200).json({ weeklyWorkingDays: company.weeklyWorkingDays })
}

export async function updateCalendarSettings(req, res) {
  const weeklyWorkingDays = req.body?.weeklyWorkingDays
  if (!Array.isArray(weeklyWorkingDays) || weeklyWorkingDays.length < 1 || weeklyWorkingDays.length > 7 || weeklyWorkingDays.some((day) => !weekDays.includes(day)) || new Set(weeklyWorkingDays).size !== weeklyWorkingDays.length) {
    return res.status(400).json({ message: 'Select between 1 and 7 unique working days' })
  }
  const company = await Company.findById(req.user.companyId)
  if (!company) return res.status(404).json({ message: 'Company not found' })
  const oldValue = { weeklyWorkingDays: company.weeklyWorkingDays }
  company.weeklyWorkingDays = weekDays.filter((day) => weeklyWorkingDays.includes(day))
  await company.save()
  await recordAudit(req, 'calendar_settings_updated', { companyId: company._id, entityId: company._id, module: 'calendar', oldValue, newValue: { weeklyWorkingDays: company.weeklyWorkingDays } })
  return res.status(200).json({ message: 'Calendar settings updated', weeklyWorkingDays: company.weeklyWorkingDays })
}

export async function listHolidays(req, res) {
  try {
    const filter = { companyId: req.user.companyId, active: true }
    if (req.query.from || req.query.to) {
      const from = req.query.from ? parseDate(req.query.from, 'from date') : new Date('1970-01-01')
      const to = req.query.to ? parseDate(req.query.to, 'to date') : new Date('2999-12-31')
      to.setDate(to.getDate() + 1)
      filter.date = { $lt: to }
      filter.$or = [{ endDate: { $gte: from } }, { endDate: null, date: { $gte: from } }]
    }
    if (req.query.type) filter.type = String(req.query.type).toUpperCase()
    const holidays = await Holiday.find(filter).populate('createdBy', 'name email').sort({ date: 1 }).lean()
    return res.status(200).json({ holidays })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function createHoliday(req, res) {
  try {
    const date = parseDate(req.body?.date, 'date')
    const endDate = req.body?.endDate ? parseDate(req.body.endDate, 'end date') : undefined
    validateRange(date, endDate)
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: 'Holiday name is required' })
    const type = String(req.body?.type || 'COMPANY').toUpperCase()
    if (!['COMPANY', 'OPTIONAL'].includes(type)) return res.status(400).json({ message: 'Invalid holiday type' })
    const holiday = await Holiday.create({ companyId: req.user.companyId, name, date, endDate, type, description: req.body.description, createdBy: req.user.id })
    await recordAudit(req, 'holiday_created', { companyId: req.user.companyId, entityId: holiday._id, module: 'calendar', newValue: { name, date, endDate, type } })
    return res.status(201).json({ message: 'Holiday created', holiday })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A holiday with this name and date already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function updateHoliday(req, res) {
  try {
    const holiday = await Holiday.findOne({ _id: req.params.id, companyId: req.user.companyId, active: true })
    if (!holiday) return res.status(404).json({ message: 'Holiday not found' })
    const oldValue = holiday.toObject()
    if (req.body?.name !== undefined) holiday.name = String(req.body.name).trim()
    if (req.body?.date !== undefined) holiday.date = parseDate(req.body.date, 'date')
    if (req.body?.endDate !== undefined) holiday.endDate = req.body.endDate ? parseDate(req.body.endDate, 'end date') : undefined
    if (req.body?.type !== undefined) holiday.type = String(req.body.type).toUpperCase()
    if (req.body?.description !== undefined) holiday.description = req.body.description
    validateRange(holiday.date, holiday.endDate)
    await holiday.save()
    await recordAudit(req, 'holiday_updated', { companyId: req.user.companyId, entityId: holiday._id, module: 'calendar', oldValue, newValue: holiday.toObject() })
    return res.status(200).json({ message: 'Holiday updated', holiday })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A holiday with this name and date already exists' })
    return res.status(400).json({ message: error.message })
  }
}

export async function deleteHoliday(req, res) {
  const holiday = await Holiday.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId, active: true }, { active: false }, { new: true })
  if (!holiday) return res.status(404).json({ message: 'Holiday not found' })
  await recordAudit(req, 'holiday_deactivated', { companyId: req.user.companyId, entityId: holiday._id, module: 'calendar' })
  return res.status(200).json({ message: 'Holiday removed', holiday })
}

export default { listHolidays, createHoliday, updateHoliday, deleteHoliday, getCalendarSettings, updateCalendarSettings }
