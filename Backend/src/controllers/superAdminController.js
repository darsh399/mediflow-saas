import bcrypt from 'bcrypt'
import crypto from 'crypto'
import User from '../models/User.js'
import createToken from '../utils/createToken.js'
import getCookieOptions from '../utils/getCookieOptions.js'
import Company from '../models/Company.js'
import Subscription from '../models/Subscription.js'
import Doctor from '../models/Doctor.js'
import Medical from '../models/Medical.js'
import Visit from '../models/Visit.js'
import Leave from '../models/Leave.js'
import Invite from '../models/Invite.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import Task from '../models/Task.js'
import Project from '../models/Project.js'
import EmployeeProfile from '../models/EmployeeProfile.js'
import EmployeeActivity from '../models/EmployeeActivity.js'
import Notification from '../models/Notification.js'
import AuditLog from '../models/AuditLog.js'
import generateInviteToken from '../utils/generateInviteToken.js'
import mailService from '../services/mailService.js'
import subscriptionService from '../services/subscriptionService.js'
import companyService from '../services/companyService.js'
import fs from 'fs/promises'
import path from 'path'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'email and password required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    if (user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' })

    const token = createToken({ id: user._id, email: user.email, role: user.role })
    const u = user.toObject(); delete u.password
    res.cookie('token', token, getCookieOptions())
    return res.status(200).json({ message: 'Login successful', user: u, token })
  } catch (err) {
    console.error('Superadmin login error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const logout = async (req, res) => {
  try {
    const opts = { ...getCookieOptions(), maxAge: undefined }
    res.clearCookie('token', opts)
    return res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    console.error('Superadmin logout error:', err)
    return res.status(500).json({ message: 'Error logging out', error: err.message })
  }
}

export const dashboard = async (req, res) => {
  try {
    // Require super_admin role from middleware
    const totalCompanies = await Company.countDocuments()
    const activeCompanies = await Company.countDocuments({ status: 'ACTIVE' })
    const suspendedCompanies = await Company.countDocuments({ status: 'SUSPENDED' })
    const blockedCompanies = await Company.countDocuments({ status: 'BLOCKED' })
    const pendingCompanies = await Company.countDocuments({ status: { $in: ['PENDING', 'PENDING_APPROVAL', 'PENDING_ACTIVATION'] } })
    const expiredSubs = await Subscription.countDocuments({ status: 'EXPIRED' })
    const activeSubs = await Subscription.countDocuments({ status: 'ACTIVE' })
    const totalUsers = await User.countDocuments()
    const totalEmployees = await User.countDocuments({ role: 'employee' })
    const totalHR = await User.countDocuments({ role: 'hr' })
    const totalMR = await User.countDocuments({ role: 'mr' })

    return res.status(200).json({
      totalCompanies, activeCompanies, suspendedCompanies, blockedCompanies, pendingCompanies,
      expiredSubs, activeSubs, totalUsers, totalEmployees, totalHR, totalMR
    })
  } catch (err) {
    console.error('Superadmin dashboard error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const createCompanyOnboard = async (req, res) => {
  try {
    const { companyName, companyEmail, companyMobile, companyAddress, companyWebsite, ownerName, ownerEmail, ownerMobile, role = 'company_owner', plan, startDate, endDate, expiresDays = 2 } = req.body

    if (!ownerName || !ownerEmail || !ownerMobile) return res.status(400).json({ message: 'ownerName, ownerEmail and ownerMobile are required' })
    const allowedRoles = ['company_owner', 'hr_manager', 'hr', 'manager', 'project_manager', 'employee']
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid invitation role' })
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase().trim() })
    if (existingUser) return res.status(409).json({ message: 'Owner email already exists' })
    const resolvedCompanyName = companyName?.trim() || `${ownerName.trim()}'s Company`
    // create company with contact fields if provided
    const company = await companyService.createCompany({ companyName: resolvedCompanyName, ownerId: null, status: 'PENDING_APPROVAL', companyEmail, companyMobile, companyAddress, companyWebsite })

    // create subscription
    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 365*24*60*60*1000)
    const subscription = await subscriptionService.createSubscription({ companyId: company._id, plan: plan || '1_YEAR', startDate: start, endDate: end })

    // create invite for owner (owner will accept and become user)
    const token = generateInviteToken()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000)
    const invite = new Invite({ inviter: req.user.id, companyId: company._id, inviteeEmail: ownerEmail, role, tokenHash, expiresAt, profileTemplate: { name: ownerName, mobile: ownerMobile } })
    await invite.save()

    // send email
    const base = req.headers.origin || process.env.FRONTEND_INVITE_URL || process.env.CLIENT_URL || 'http://localhost:5173'
    const inviteLink = `${base.replace(/\/$/, '')}/activate-account?token=${token}`

    try {
      await mailService.sendMail({ to: ownerEmail, subject: `Invitation to join ${resolvedCompanyName}`, text: `You have been invited as ${role} to join ${resolvedCompanyName}. Activate: ${inviteLink}`, html: `<p>You have been invited as <strong>${role.replace('_', ' ')}</strong> to join <strong>${resolvedCompanyName}</strong>.</p><p><a href="${inviteLink}">Activate account</a></p>` })
    } catch (err) {
      console.error('Failed to send invite email via mailService:', err && err.message ? err.message : err)
    }

    return res.status(201).json({ message: 'Company created and invitation sent', company, subscription, role })
  } catch (err) {
    console.error('Onboard create error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const listCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('ownerId','name email mobile role').lean()
    // attach latest subscription for each company
    const results = await Promise.all(companies.map(async (c) => {
      const sub = await subscriptionService.getLatestSubscription(c._id)
      return { ...c, subscription: sub }
    }))
    return res.status(200).json({ companies: results })
  } catch (err) {
    console.error('List companies error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const getCompanyDetails = async (req, res) => {
  try {
    const id = req.params.id
    const company = await Company.findById(id).lean()
    if (!company) return res.status(404).json({ message: 'Company not found' })
    const owner = company.ownerId ? await User.findById(company.ownerId).select('-password') : null
    const subscriptions = await Subscription.find({ companyId: id }).sort({ endDate: -1 }).lean()
    // count users associated with this company
    const employeeCount = await User.countDocuments({ companyId: id })
    return res.status(200).json({ company, owner, subscriptions, employeeCount })
  } catch (err) {
    console.error('Get company details error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const updateCompanyStatus = async (req, res) => {
  try {
    const id = req.params.id
    const { status } = req.body
    if (!status) return res.status(400).json({ message: 'Status is required' })
    const allowed = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING', 'REJECTED']
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' })
    const company = await Company.findById(id)
    if (!company) return res.status(404).json({ message: 'Company not found' })
    company.status = status
    company.isActive = status === 'ACTIVE'
    await company.save()
    return res.status(200).json({ message: 'Company status updated', company })
  } catch (err) {
    console.error('Update company status error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const deleteCompany = async (req, res) => {
  try {
    const id = req.params.id
    const company = await Company.findById(id)
    if (!company) return res.status(404).json({ message: 'Company not found' })

    const companyUsers = await User.find({ $or: [{ companyId: id }, ...(company.ownerId ? [{ _id: company.ownerId }] : [])] }).select('_id')
    const userIds = companyUsers.map(user => user._id)
    const profiles = await EmployeeProfile.find({ companyId: id }).select('documents')

    const privateUploadDirectory = path.resolve(process.cwd(), 'private_uploads')
    const files = profiles.flatMap(profile => profile.documents || [])
      .map(document => document.url)
      .filter(url => url && url.startsWith('private_uploads/'))
      .map(url => path.basename(url))
    await Promise.all(files.map(file => fs.unlink(path.join(privateUploadDirectory, file)).catch(() => undefined)))

    await Promise.all([
      Subscription.deleteMany({ companyId: id }),
      Invite.deleteMany({ companyId: id }),
      Doctor.deleteMany({ companyId: id }),
      Medical.deleteMany({ companyId: id }),
      Visit.deleteMany({ companyId: id }),
      Leave.deleteMany({ companyId: id }),
      Product.deleteMany({ companyId: id }),
      Order.deleteMany({ companyId: id }),
      Task.deleteMany({ companyId: id }),
      Project.deleteMany({ companyId: id }),
      EmployeeProfile.deleteMany({ companyId: id }),
      EmployeeActivity.deleteMany({ companyId: id }),
      Notification.deleteMany({ companyId: id }),
      AuditLog.deleteMany({ companyId: id }),
      User.deleteMany({ _id: { $in: userIds } })
    ])

    await Company.findByIdAndDelete(id)
    return res.status(200).json({ message: 'Company and all related data deleted', deletedUsers: userIds.length })
  } catch (err) {
    console.error('Delete company error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export default { login, dashboard, updateCompanyStatus }
