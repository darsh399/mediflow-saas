import bcrypt from 'bcrypt'
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
import generateInviteToken from '../utils/generateInviteToken.js'
import mailService from '../services/mailService.js'
import subscriptionService from '../services/subscriptionService.js'
import companyService from '../services/companyService.js'

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
    const pendingCompanies = await Company.countDocuments({ status: 'PENDING' })
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
    const { companyName, companyEmail, companyMobile, companyAddress, companyWebsite, ownerName, ownerEmail, ownerMobile, plan, startDate, endDate, expiresDays = 2 } = req.body

    if (!companyName || !ownerEmail) return res.status(400).json({ message: 'companyName and ownerEmail required' })
    console.log('Onboard create request:', { companyName, companyEmail, companyMobile, companyAddress, companyWebsite, ownerName, ownerEmail, ownerMobile, plan, startDate, endDate, expiresDays })
    // create company with contact fields if provided
    const company = await companyService.createCompany({ companyName, ownerId: null, status: 'PENDING', companyEmail, companyMobile, companyAddress, companyWebsite })

    // create subscription
    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 365*24*60*60*1000)
    const subscription = await subscriptionService.createSubscription({ companyId: company._id, plan: plan || '1_YEAR', startDate: start, endDate: end })

    // create invite for owner (owner will accept and become user)
    const token = generateInviteToken()
    const expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000)
    const invite = new Invite({ inviter: req.user.id, companyId: company._id, inviteeEmail: ownerEmail, role: 'company_owner', token, expiresAt, profileTemplate: { name: ownerName, mobile: ownerMobile } })
    await invite.save()

    // send email
    const base = req.headers.origin || process.env.FRONTEND_INVITE_URL || process.env.CLIENT_URL || 'http://localhost:5173'
    const inviteLink = `${base.replace(/\/$/, '')}/activate-account?token=${token}`

    try {
      console.log('Sending invite email via mailService to', ownerEmail)
      await mailService.sendMail({ to: ownerEmail, subject: `Invitation to join ${companyName}`, text: `You have been invited to join ${companyName}. Activate: ${inviteLink}`, html: `<p>You have been invited to join <strong>${companyName}</strong>.</p><p><a href="${inviteLink}">Activate account</a></p>` })
    } catch (err) {
      console.error('Failed to send invite email via mailService:', err && err.message ? err.message : err)
      console.log('Invite link for owner (fallback):', inviteLink)
    }

    return res.status(201).json({ message: 'Company created and owner invited', company, subscription, inviteLink })
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

    // remove related subscriptions and invites
    await Subscription.deleteMany({ companyId: id })
    await Invite.deleteMany({ companyId: id })

    // Optionally, unset companyId on users instead of deleting them
    await User.updateMany({ companyId: id }, { $unset: { companyId: '' } })

    await Company.findByIdAndDelete(id)
    return res.status(200).json({ message: 'Company deleted' })
  } catch (err) {
    console.error('Delete company error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export default { login, dashboard, updateCompanyStatus }
