import mongoose from 'mongoose'
import SalaryStructure from '../models/SalaryStructure.js'
import Salary from '../models/Salary.js'
import SalarySlip from '../models/SalarySlip.js'
import OfferLetter from '../models/OfferLetter.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import EmployeeProfile from '../models/EmployeeProfile.js'
import { calculateSalary, buildLopDeduction } from '../services/salaryService.js'
import mailService from '../services/mailService.js'
import { offerLetterTemplate, salarySlipTemplate } from '../services/emailTemplateService.js'
import { generateSalarySlipPdf, generateOfferLetterPdf } from '../services/pdfService.js'

const MANAGERS = ['admin', 'company_owner', 'hr_manager']
const isManager = (user) => MANAGERS.includes(user?.role)
const companyQuery = (req, extra = {}) => ({ companyId: req.user.companyId, ...extra })
const pageInfo = (query, defaultLimit = 20) => { const page = Math.max(Number(query.page) || 1, 1); const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), 100); return { page, limit, skip: (page - 1) * limit } }
const employeeFilter = (req, employeeId) => ({ _id: employeeId, companyId: req.user.companyId, role: { $nin: ['admin', 'company_owner', 'super_admin', 'superadmin'] } })

export async function listStructures(req, res) {
  const { page, limit, skip } = pageInfo(req.query)
  const filter = companyQuery(req, { active: req.query.includeInactive === 'true' ? { $in: [true, false] } : true })
  if (req.query.search) filter.name = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  const [data, total] = await Promise.all([SalaryStructure.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(), SalaryStructure.countDocuments(filter)])
  return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}

export async function createStructure(req, res) {
  try { const structure = await SalaryStructure.create({ companyId: req.user.companyId, createdBy: req.user.id, name: req.body.name, components: req.body.components || [] }); return res.status(201).json({ structure }) } catch (error) { return res.status(400).json({ message: error.code === 11000 ? 'A salary structure with this name already exists' : error.message }) }
}
export async function updateStructure(req, res) { try { const structure = await SalaryStructure.findOneAndUpdate(companyQuery(req, { _id: req.params.id }), { name: req.body.name, components: req.body.components, active: req.body.active }, { new: true, runValidators: true }); return structure ? res.json({ structure }) : res.status(404).json({ message: 'Salary structure not found' }) } catch (error) { return res.status(400).json({ message: error.message }) } }
export async function deleteStructure(req, res) { const structure = await SalaryStructure.findOneAndUpdate(companyQuery(req, { _id: req.params.id }), { active: false }, { new: true }); return structure ? res.json({ message: 'Salary structure deactivated' }) : res.status(404).json({ message: 'Salary structure not found' }) }

export async function listSalaries(req, res) {
  const filter = companyQuery(req)
  if (!isManager(req.user)) filter.employeeId = req.user.id
  if (req.query.employeeId && isManager(req.user)) filter.employeeId = req.query.employeeId
  if (req.query.structureId) filter.structureId = req.query.structureId
  if (req.query.search && isManager(req.user)) {
    const pattern = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    const employeeIds = await User.find({ companyId: req.user.companyId, $or: [{ name: pattern }, { email: pattern }, { employeeId: pattern }] }).distinct('_id')
    filter.employeeId = { $in: employeeIds }
  }
  const { page, limit, skip } = pageInfo(req.query)
  const [data, total] = await Promise.all([Salary.find(filter).populate('employeeId', 'name email employeeId role').populate('structureId', 'name').sort({ effectiveDate: -1 }).skip(skip).limit(limit).lean(), Salary.countDocuments(filter)])
  return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}

export async function getMySalary(req, res) { const salary = await Salary.findOne(companyQuery(req, { employeeId: req.user.id })).sort({ effectiveDate: -1 }).populate('structureId', 'name components').lean(); return salary ? res.json({ salary }) : res.status(404).json({ message: 'Salary not found' }) }
export async function createSalary(req, res) {
  try {
    const employee = await User.findOne(employeeFilter(req, req.body.employeeId)).select('_id').lean(); if (!employee) return res.status(404).json({ message: 'Employee not found in this company' })
    const structure = await SalaryStructure.findOne(companyQuery(req, { _id: req.body.structureId, active: true })).lean(); if (!structure) return res.status(404).json({ message: 'Salary structure not found' })
    const calculation = calculateSalary(structure, req.body.basis || 'MONTHLY', req.body.amount)
    const salary = await Salary.create({ ...calculation, companyId: req.user.companyId, employeeId: employee._id, structureId: structure._id, effectiveDate: req.body.effectiveDate || new Date(), createdBy: req.user.id })
    return res.status(201).json({ salary })
  } catch (error) { return res.status(400).json({ message: error.message }) }
}
export async function updateSalary(req, res) {
  try {
    const salary = await Salary.findOne(companyQuery(req, { _id: req.params.id }))
    if (!salary) return res.status(404).json({ message: 'Salary not found' })
    const structureChanged = req.body.structureId && String(req.body.structureId) !== String(salary.structureId)
    const amountChanged = req.body.amount !== undefined && Number(req.body.amount) !== salary.monthlyCtc
    if (structureChanged || amountChanged) {
      const structure = await SalaryStructure.findOne(companyQuery(req, { _id: req.body.structureId || salary.structureId, active: true })).lean()
      if (!structure) return res.status(404).json({ message: 'Salary structure not found or inactive' })
      const calculation = calculateSalary(structure, req.body.basis || 'MONTHLY', req.body.amount !== undefined ? req.body.amount : salary.monthlyCtc)
      Object.assign(salary, calculation, { structureId: structure._id })
    }
    if (req.body.effectiveDate) salary.effectiveDate = req.body.effectiveDate
    await salary.save()
    await salary.populate('employeeId', 'name email employeeId role')
    return res.json({ salary })
  } catch (error) { return res.status(400).json({ message: error.message }) }
}
export async function deleteSalary(req, res) { const salary = await Salary.findOneAndDelete(companyQuery(req, { _id: req.params.id })); return salary ? res.json({ message: 'Salary deleted' }) : res.status(404).json({ message: 'Salary not found' }) }

async function resolveSlipCalculation(req, { employeeId, month, year }) {
  month = Number(month); year = Number(year)
  if (!month || month < 1 || month > 12 || !year) return { error: { status: 400, message: 'A valid salary month and year are required' } }
  const employee = await User.findOne(employeeFilter(req, employeeId)).select('_id').lean()
  if (!employee) return { error: { status: 404, message: 'Employee not found in this company' } }
  const salary = await Salary.findOne(companyQuery(req, { employeeId: employee._id })).sort({ effectiveDate: -1 }).lean()
  if (!salary) return { error: { status: 404, message: 'No salary is assigned to this employee' } }
  const { lopDays, lopDeduction } = await buildLopDeduction({ companyId: req.user.companyId, employeeId: employee._id, month, year, monthlyCtc: salary.monthlyCtc })
  const components = lopDeduction > 0 ? [...salary.components, { name: 'LOP Deduction', type: 'DEDUCTION', calculationType: 'FIXED', amount: lopDeduction, basedOn: 'MONTHLY_CTC' }] : salary.components
  const totalDeductions = Number((salary.totalDeductions + lopDeduction).toFixed(2))
  const netSalary = Number((salary.netSalary - lopDeduction).toFixed(2))
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: employee._id }).select('+bankDetails.accountNumber').lean()
  const bankDetails = profile?.bankDetails ? {
    accountHolderName: profile.bankDetails.accountHolderName,
    bankName: profile.bankDetails.bankName,
    accountNumber: profile.bankDetails.accountNumber,
    ifscCode: profile.bankDetails.ifscCode,
    branchName: profile.bankDetails.branchName,
    accountType: profile.bankDetails.accountType,
  } : null
  return { employee, salary, month, year, lopDays, lopDeduction, components, grossSalary: salary.grossSalary, totalDeductions, netSalary, bankDetails }
}

export async function previewSlip(req, res) {
  const result = await resolveSlipCalculation(req, { employeeId: req.query.employeeId, month: req.query.month, year: req.query.year })
  if (result.error) return res.status(result.error.status).json({ message: result.error.message })
  const { grossSalary, totalDeductions, netSalary, lopDays, lopDeduction, salary, bankDetails } = result
  return res.json({ preview: { monthlyCtc: salary.monthlyCtc, grossSalary, totalDeductions, netSalary, lopDays, lopDeduction, bankDetails } })
}

export async function listSlips(req, res) { const filter = companyQuery(req, !isManager(req.user) ? { employeeId: req.user.id } : {}); if (req.query.employeeId && isManager(req.user)) filter.employeeId = req.query.employeeId; if (req.query.month) filter.month = Number(req.query.month); if (req.query.year) filter.year = Number(req.query.year); if (req.query.search && isManager(req.user)) { const pattern = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }; filter.employeeId = { $in: await User.find({ companyId: req.user.companyId, $or: [{ name: pattern }, { email: pattern }, { employeeId: pattern }] }).distinct('_id') } } const { page, limit, skip } = pageInfo(req.query); const [data, total] = await Promise.all([SalarySlip.find(filter).populate('employeeId', 'name email employeeId role').sort({ year: -1, month: -1 }).skip(skip).limit(limit).lean(), SalarySlip.countDocuments(filter)]); return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }) }
export async function getMySlips(req, res) { req.query.employeeId = req.user.id; return listSlips(req, res) }
export async function createSlip(req, res) {
  try {
    const result = await resolveSlipCalculation(req, { employeeId: req.body.employeeId, month: req.body.month, year: req.body.year })
    if (result.error) return res.status(result.error.status).json({ message: result.error.message })
    const { employee, salary, month, year, lopDays, lopDeduction, components, grossSalary, totalDeductions, netSalary, bankDetails } = result
    const existing = await SalarySlip.exists({ companyId: req.user.companyId, employeeId: employee._id, month, year })
    if (existing) return res.status(409).json({ message: `Salary slip for ${month}/${year} already exists for this employee` })
    const slip = await SalarySlip.create({ companyId: req.user.companyId, employeeId: employee._id, structureId: salary.structureId, salaryId: salary._id, month, year, components, grossSalary, totalDeductions, netSalary, lopDays, lopDeduction, bankDetailsSnapshot: bankDetails, generatedBy: req.user.id })
    return res.status(201).json({ slip })
  } catch (error) { return res.status(400).json({ message: error.code === 11000 ? 'Salary slip already exists for this employee and month' : error.message }) }
}
export async function getSlip(req, res) { const filter = companyQuery(req, { _id: req.params.id }); if (!isManager(req.user)) filter.employeeId = req.user.id; const slip = await SalarySlip.findOne(filter).populate('employeeId', 'name email employeeId role profile').lean(); return slip ? res.json({ slip }) : res.status(404).json({ message: 'Salary slip not found' }) }
export async function deleteSlip(req, res) { const slip = await SalarySlip.findOneAndDelete(companyQuery(req, { _id: req.params.id })); return slip ? res.json({ message: 'Salary slip deleted' }) : res.status(404).json({ message: 'Salary slip not found' }) }
export async function sendSlip(req, res) {
  const filter = companyQuery(req, { _id: req.params.id })
  const slip = await SalarySlip.findOne(filter).populate('employeeId', 'name email employeeId')
  if (!slip?.employeeId?.email) return res.status(404).json({ message: 'Salary slip or employee email not found' })
  const company = await Company.findById(req.user.companyId).select('companyName')
  const monthName = new Date(2000, slip.month - 1, 1).toLocaleString('en-IN', { month: 'long' })
  const template = salarySlipTemplate({ employeeName: slip.employeeId.name, month: monthName, year: slip.year, netSalary: `₹${slip.netSalary.toLocaleString('en-IN')}`, companyName: company?.companyName })
  const pdfBuffer = await generateSalarySlipPdf({ slip, employee: slip.employeeId, company })
  const attachment = { filename: `Salary-Slip-${monthName}-${slip.year}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
  await mailService.sendMail({ to: slip.employeeId.email, ...template, attachments: [attachment] })
  slip.status = 'SENT'
  await slip.save()
  return res.json({ slip })
}

export async function listOffers(req, res) { const filter = companyQuery(req, !isManager(req.user) ? { employeeId: req.user.id } : {}); if (req.query.status) filter.status = req.query.status; if (req.query.from || req.query.to) filter.createdAt = { ...(req.query.from ? { $gte: new Date(req.query.from) } : {}), ...(req.query.to ? { $lte: new Date(`${req.query.to}T23:59:59.999Z`) } : {}) }; if (req.query.search && isManager(req.user)) { const pattern = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }; filter.employeeId = { $in: await User.find({ companyId: req.user.companyId, $or: [{ name: pattern }, { email: pattern }, { employeeId: pattern }] }).distinct('_id') } } const { page, limit, skip } = pageInfo(req.query); const [data, total] = await Promise.all([OfferLetter.find(filter).populate('employeeId', 'name email employeeId role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), OfferLetter.countDocuments(filter)]); return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }) }
export async function getOffer(req, res) { const filter = companyQuery(req, { _id: req.params.id }); if (!isManager(req.user)) filter.employeeId = req.user.id; const offer = await OfferLetter.findOne(filter).populate('employeeId', 'name email employeeId role').lean(); return offer ? res.json({ offer }) : res.status(404).json({ message: 'Offer letter not found' }) }
export async function createOffer(req, res) { try { if (!req.body.salaryId || !mongoose.isValidObjectId(req.body.salaryId)) return res.status(400).json({ message: 'A valid salary assignment is required before creating an offer' }); const employee = await User.findOne(employeeFilter(req, req.body.employeeId)).select('name email employeeId role profile').lean(); if (!employee) return res.status(404).json({ message: 'Employee not found in this company' }); const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: employee._id }).select('status').lean(); if (profile?.status !== 'APPROVED') return res.status(409).json({ message: 'Employee onboarding documents must be approved before creating an offer' }); const salary = await Salary.findOne(companyQuery(req, { _id: req.body.salaryId, employeeId: employee._id })).lean(); if (!salary) return res.status(404).json({ message: 'Salary assignment not found for this employee' }); const offer = await OfferLetter.create({ jobTitle: req.body.jobTitle, department: req.body.department, joiningDate: req.body.joiningDate, employmentType: req.body.employmentType, additionalTerms: req.body.additionalTerms, companyId: req.user.companyId, employeeId: employee._id, salaryId: salary._id, structureId: salary.structureId, salarySnapshot: salary, createdBy: req.user.id }); await syncOfferToUser(offer); return res.status(201).json({ offer }) } catch (error) { return res.status(400).json({ message: error.message }) } }
// The offer's joining date is the source of truth for the employee's account —
// keep User.joiningDate in step whenever an offer is created, updated or sent.
async function syncOfferToUser(offer) {
  if (!offer?.employeeId || !offer.joiningDate) return
  await User.updateOne({ _id: offer.employeeId, companyId: offer.companyId }, { $set: { joiningDate: offer.joiningDate } })
}
export async function updateOffer(req, res) { const offer = await OfferLetter.findOneAndUpdate(companyQuery(req, { _id: req.params.id, status: 'DRAFT' }), req.body, { new: true, runValidators: true }).lean(); if (offer) await syncOfferToUser(offer); return offer ? res.json({ offer }) : res.status(404).json({ message: 'Draft offer not found' }) }
export async function sendOffer(req, res) {
  const offer = await OfferLetter.findOne(companyQuery(req, { _id: req.params.id })).populate('employeeId', 'name email employeeId profile').lean()
  if (!offer?.employeeId?.email) return res.status(404).json({ message: 'Offer or employee email not found' })
  const company = await Company.findById(req.user.companyId).select('companyName companyEmail companyMobile companyAddress').lean()
  const breakdown = (offer.salarySnapshot?.components || []).map((item) => `${item.name}: ₹${Number(item.amount || 0).toLocaleString('en-IN')}`).join('\n')
  const template = offerLetterTemplate({ employeeName: offer.employeeId.name, companyName: company?.companyName, jobTitle: offer.jobTitle, joiningDate: offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString('en-IN') : '-', annualCTC: `₹${Number(offer.salarySnapshot?.annualCtc || 0).toLocaleString('en-IN')}`, monthlySalary: `₹${Number(offer.salarySnapshot?.monthlyCtc || 0).toLocaleString('en-IN')}`, salaryBreakdown: breakdown, senderName: req.user.email })
  try {
    const pdfBuffer = await generateOfferLetterPdf({ offer, employee: offer.employeeId, company })
    const attachment = { filename: `Offer-Letter-${offer.employeeId.name?.replace(/\s+/g, '-') || 'employee'}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
    await mailService.sendMail({ to: offer.employeeId.email, ...template, attachments: [attachment] })
    await OfferLetter.updateOne({ _id: offer._id }, { status: 'SENT', sentAt: new Date(), sendError: undefined })
    await syncOfferToUser(offer)
    return res.json({ message: 'Offer letter sent', status: 'SENT' })
  } catch (error) {
    await OfferLetter.updateOne({ _id: offer._id }, { status: 'FAILED', sendError: error.message })
    return res.status(502).json({ message: 'Offer letter email could not be sent', status: 'FAILED' })
  }
}

export default { listStructures, createStructure, updateStructure, deleteStructure, listSalaries, getMySalary, createSalary, updateSalary, deleteSalary, listSlips, getMySlips, previewSlip, createSlip, getSlip, deleteSlip, sendSlip, listOffers, getOffer, createOffer, updateOffer, sendOffer }
