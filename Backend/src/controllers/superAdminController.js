import bcrypt from 'bcrypt'
import crypto from 'crypto'
import User from '../models/User.js'
import Company from '../models/Company.js'
import Subscription from '../models/Subscription.js'
import Doctor from '../models/Doctor.js'
import Medical from '../models/Medical.js'
import Visit from '../models/Visit.js'
import Leave from '../models/Leave.js'
import Invite from '../models/Invite.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import DemoRequest from '../models/DemoRequest.js'
import Task from '../models/Task.js'
import Project from '../models/Project.js'
import EmployeeProfile from '../models/EmployeeProfile.js'
import EmployeeActivity from '../models/EmployeeActivity.js'
import Notification from '../models/Notification.js'
import AuditLog from '../models/AuditLog.js'
import generateInviteToken from '../utils/generateInviteToken.js'
import mailService from '../services/mailService.js'
import subscriptionService, { PLAN_DEFAULTS } from '../services/subscriptionService.js'
import companyService from '../services/companyService.js'
import SubscriptionHistory from '../models/SubscriptionHistory.js'
import { normalizeModules } from '../config/modules.js'
import recordAudit from '../utils/audit.js'
import fs from 'fs/promises'
import path from 'path'
import { issueSession, revokeRefreshToken, clearSessionCookies } from '../services/sessionService.js'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'email and password required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    if (user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' })

    const token = await issueSession(res, user)
    const u = user.toObject(); delete u.password
    return res.status(200).json({ message: 'Login successful', user: u, token })
  } catch (err) {
    console.error('Superadmin login error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const logout = async (req, res) => {
  try {
    await revokeRefreshToken(req)
    clearSessionCookies(res)
    return res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    console.error('Superadmin logout error:', err)
    return res.status(500).json({ message: 'Error logging out', error: err.message })
  }
}

export const dashboard = async (req, res) => {
  try {
    // Require super_admin role from middleware
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const [totalCompanies, activeCompanies, suspendedCompanies, blockedCompanies, rejectedCompanies, pendingCompanies, expiredSubs, activeSubs, trialSubs, totalUsers, totalEmployees, totalHR, totalMR, newCompaniesThisMonth, revenue, newDemoRequests] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'ACTIVE' }),
      Company.countDocuments({ status: 'SUSPENDED' }),
      Company.countDocuments({ status: 'BLOCKED' }),
      Company.countDocuments({ status: 'REJECTED' }),
      Company.countDocuments({ status: { $in: ['PENDING', 'PENDING_APPROVAL', 'PENDING_ACTIVATION'] } }),
      Subscription.countDocuments({ status: 'EXPIRED' }),
      Subscription.countDocuments({ status: { $in: ['ACTIVE', 'TRIAL', 'GRACE'] } }),
      Subscription.countDocuments({ status: 'TRIAL' }),
      User.countDocuments(),
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'hr' }),
      User.countDocuments({ role: 'mr' }),
      Company.countDocuments({ createdAt: { $gte: monthStart } }),
      Subscription.aggregate([{ $match: { createdAt: { $gte: monthStart }, status: { $in: ['ACTIVE', 'TRIAL', 'GRACE'] } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
      DemoRequest.countDocuments({ status: 'NEW' }),
    ])

    return res.status(200).json({
      totalCompanies, activeCompanies, suspendedCompanies, blockedCompanies, pendingCompanies,
      expiredSubs, activeSubs, trialSubs, rejectedCompanies, totalUsers, totalEmployees, totalHR, totalMR,
      newCompaniesThisMonth, monthlyRevenue: revenue[0]?.total || 0, newDemoRequests
    })
  } catch (err) {
    console.error('Superadmin dashboard error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// export const createCompanyOnboard = async (req, res) => {
//   try {
//     const { companyName, companyEmail, companyMobile, companyAddress, companyWebsite, ownerName, ownerEmail, ownerMobile, role = 'company_owner', plan, startDate, endDate, expiresDays = 2 } = req.body

//     if (!ownerName || !ownerEmail || !ownerMobile) return res.status(400).json({ message: 'ownerName, ownerEmail and ownerMobile are required' })
//     const allowedRoles = ['company_owner', 'hr_manager', 'hr', 'manager', 'project_manager', 'employee']
//     if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid invitation role' })
//     const existingUser = await User.findOne({ email: ownerEmail.toLowerCase().trim() })
//     if (existingUser) return res.status(409).json({ message: 'Owner email already exists' })
//     const resolvedCompanyName = companyName?.trim() || `${ownerName.trim()}'s Company`
//     // create company with contact fields if provided
//     const company = await companyService.createCompany({ companyName: resolvedCompanyName, ownerId: null, status: 'PENDING_APPROVAL', companyEmail, companyMobile, companyAddress, companyWebsite })

//     // create subscription
//     const start = startDate ? new Date(startDate) : new Date()
//     const end = endDate ? new Date(endDate) : new Date(Date.now() + 365*24*60*60*1000)
//     const subscription = await subscriptionService.createSubscription({ companyId: company._id, plan: plan || '1_YEAR', startDate: start, endDate: end })

//     // create invite for owner (owner will accept and become user)
//     const token = generateInviteToken()
//     const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
//     const expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000)
//     const invite = new Invite({ inviter: req.user.id, companyId: company._id, inviteeEmail: ownerEmail, role, tokenHash, expiresAt, profileTemplate: { name: ownerName, mobile: ownerMobile } })
//     await invite.save()

//     // send email
//     const base = req.headers.origin || process.env.FRONTEND_INVITE_URL || process.env.CLIENT_URL || 'http://localhost:5173'
//     const inviteLink = `${base.replace(/\/$/, '')}/activate-account?token=${token}`

//     try {
//       await mailService.sendMail({ to: ownerEmail, subject: `Invitation to join ${resolvedCompanyName}`, text: `You have been invited as ${role} to join ${resolvedCompanyName}. Activate: ${inviteLink}`, html: `<p>You have been invited as <strong>${role.replace('_', ' ')}</strong> to join <strong>${resolvedCompanyName}</strong>.</p><p><a href="${inviteLink}">Activate account</a></p>` })
//     } catch (err) {
//       console.error('Failed to send invite email via mailService:', err && err.message ? err.message : err)
//     }

//     return res.status(201).json({ message: 'Company created and invitation sent', company, subscription, role })
//   } catch (err) {
//     console.error('Onboard create error:', err)
//     return res.status(500).json({ message: 'Server error', error: err.message })
//   }
// }

export const createCompanyOnboard = async (req, res) => {
  console.log("🔥🔥🔥 CREATE COMPANY CONTROLLER HIT 🔥🔥🔥");

  try {
    console.log("📦 Request body:", req.body);

    const {
      companyName,
      companyEmail,
      companyMobile,
      companyAddress,
      companyWebsite,
      ownerName,
      ownerEmail,
      ownerMobile,
      role = "company_owner",
      plan,
      startDate,
      endDate,
      expiresDays = 2,
    } = req.body;

    // --------------------------------
    // VALIDATION
    // --------------------------------

    if (!ownerName || !ownerEmail || !ownerMobile) {
      return res.status(400).json({
        message: "Owner name, email and mobile are required",
      });
    }

    const allowedRoles = [
      "company_owner",
      "hr_manager",
      "hr",
      "manager",
      "project_manager",
      "employee",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid invitation role",
      });
    }

    const normalizedOwnerEmail = ownerEmail
      .toLowerCase()
      .trim();

    // --------------------------------
    // CHECK EXISTING USER
    // --------------------------------

    const existingUser = await User.findOne({
      email: normalizedOwnerEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Owner email already exists",
      });
    }

    // --------------------------------
    // CREATE COMPANY
    // --------------------------------

    const resolvedCompanyName =
      companyName?.trim() ||
      `${ownerName.trim()}'s Company`;

    console.log("🏢 Creating company...");

    const company =
      await companyService.createCompany({
        companyName: resolvedCompanyName,
        ownerId: null,
        status: "PENDING_APPROVAL",
        companyEmail,
        companyMobile,
        companyAddress,
        companyWebsite,
      });

    console.log(
      "✅ Company created:",
      company._id
    );

    // --------------------------------
    // CREATE SUBSCRIPTION
    // --------------------------------

    const start = startDate
      ? new Date(startDate)
      : new Date();

    const end = endDate
      ? new Date(endDate)
      : new Date(
          Date.now() +
            365 *
              24 *
              60 *
              60 *
              1000
        );

    console.log("💳 Creating subscription...");

    const subscription =
      await subscriptionService.createSubscription({
        companyId: company._id,
        plan: plan || "1_YEAR",
        startDate: start,
        endDate: end,
      });

    console.log("✅ Subscription created");

    // --------------------------------
    // GENERATE INVITATION TOKEN
    // --------------------------------

    const token = generateInviteToken();

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt =
      new Date(
        Date.now() +
          Number(expiresDays) *
            24 *
            60 *
            60 *
            1000
      );

    // --------------------------------
    // CREATE INVITE
    // --------------------------------

    console.log("📨 Creating invitation...");

    const invite = new Invite({
      inviter: req.user.id,

      companyId: company._id,

      inviteeEmail: normalizedOwnerEmail,

      role,

      tokenHash,

      expiresAt,

      emailStatus: "queued",

      profileTemplate: {
        name: ownerName,
        mobile: ownerMobile,
      },
    });

    await invite.save();

    console.log("✅ Invitation created");

    // --------------------------------
    // INVITATION LINK
    // --------------------------------

    const base =
      process.env.FRONTEND_INVITE_URL ||
      process.env.CLIENT_URL ||
      req.headers.origin ||
      "http://localhost:5173";

    const inviteLink =
      `${base.replace(/\/$/, "")}/activate-account?token=${token}`;

    const invitationEmail = { status: "queued" };

    // --------------------------------
    // Return immediately; delivery is tracked on the invitation record.
    // --------------------------------

    const sendResponse = () => res.status(201).json({
      message: "Company created. Invitation email is being sent.",
      company,
      subscription,
      role,
      invitationEmail,
    });

    // --------------------------------
    // Send after the response so SMTP latency does not delay company creation.
    // --------------------------------

    setImmediate(() => Promise.resolve().then(async () => {
      try {
        await Invite.findByIdAndUpdate(invite._id, {
          emailStatus: "sending",
          emailError: undefined,
        });
        console.log("");
        console.log("========================================");
        console.log("📧 BACKGROUND EMAIL PROCESS STARTED");
        console.log("========================================");

        console.log(
          "Recipient:",
          normalizedOwnerEmail
        );

        console.log(
          "Company:",
          resolvedCompanyName
        );

        let info;
        let sendError;
        const retryDelays = [0, 5000, 15000];

        for (const [attempt, retryDelay] of retryDelays.entries()) {
          if (retryDelay) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }

          try {
            info = await mailService.sendMail({
            to: normalizedOwnerEmail,

            subject:
              `Invitation to join ${resolvedCompanyName}`,

            text: `
Hello ${ownerName},

You have been invited as ${role.replace(
              "_",
              " "
            )} to join ${resolvedCompanyName}.

Please activate your account using the link below:

${inviteLink}

This invitation will expire in ${expiresDays} day(s).

Regards,
MediFlow
            `.trim(),

            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Company Invitation</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f7fb;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      padding:35px;
      border-radius:12px;
      border:1px solid #e5e7eb;
    "
  >

    <h2
      style="
        margin-top:0;
        color:#212529;
      "
    >
      You're invited to join ${resolvedCompanyName}
    </h2>

    <p>
      Hello <strong>${ownerName}</strong>,
    </p>

    <p>
      You have been invited as
      <strong>
        ${role.replace("_", " ")}
      </strong>
      to join
      <strong>
        ${resolvedCompanyName}
      </strong>.
    </p>

    <p>
      Click the button below to activate your account.
    </p>

    <p style="margin:30px 0;">
      <a
        href="${inviteLink}"
        style="
          display:inline-block;
          padding:13px 22px;
          background:#0d6efd;
          color:#ffffff;
          text-decoration:none;
          border-radius:7px;
          font-weight:bold;
        "
      >
        Activate Account
      </a>
    </p>

    <p>
      If the button does not work, copy and paste this link:
    </p>

    <p
      style="
        word-break:break-all;
        color:#0d6efd;
      "
    >
      ${inviteLink}
    </p>

    <p
      style="
        margin-top:30px;
        color:#6c757d;
        font-size:14px;
      "
    >
      This invitation will expire in
      ${expiresDays} day(s).
    </p>

    <hr
      style="
        border:none;
        border-top:1px solid #eeeeee;
        margin:30px 0;
      "
    />

    <p
      style="
        color:#6c757d;
        font-size:13px;
      "
    >
      Regards,<br/>
      MediFlow
    </p>

  </div>

</body>
</html>
            `,
            });
            break;
          } catch (error) {
            sendError = error;
            console.error(`Invitation email attempt ${attempt + 1}/${retryDelays.length} failed for ${normalizedOwnerEmail}:`, error?.message);
          }
        }

        if (!info) throw sendError;

        await Invite.findByIdAndUpdate(invite._id, {
          emailStatus: "sent",
          emailSentAt: new Date(),
          emailMessageId: info?.messageId || undefined,
          emailError: undefined,
        });

        console.log("");
        console.log("========================================");
        console.log("✅ INVITATION EMAIL SENT");
        console.log("Message ID:", info?.messageId);
        console.log("To:", normalizedOwnerEmail);
        console.log("========================================");
        console.log("");
      } catch (err) {
        await Invite.findByIdAndUpdate(invite._id, {
          emailStatus: "failed",
          emailError: err?.message || "Unknown email delivery error",
        });
        console.error("");
        console.error("========================================");
        console.error("❌ INVITATION EMAIL FAILED");
        console.error("========================================");
        console.error("To:", normalizedOwnerEmail);
        console.error("Message:", err?.message);
        console.error("Code:", err?.code);
        console.error("Response:", err?.response);
        console.error("Command:", err?.command);
        console.error("========================================");
        console.error("");
      }
    }));

    return sendResponse();

  } catch (err) {
    console.error(
      "❌ Onboard create error:",
      err
    );

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

export const listCompanies = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.search) filter.$or = [{ companyName: { $regex: req.query.search.trim(), $options: 'i' } }, { companyEmail: { $regex: req.query.search.trim(), $options: 'i' } }]
    const [companies, total] = await Promise.all([
      Company.find(filter).populate('ownerId','name email mobile role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Company.countDocuments(filter),
    ])
    // attach latest subscription for each company
    const results = await Promise.all(companies.map(async (c) => {
      const sub = await subscriptionService.getLatestSubscription(c._id)
      return { ...c, subscription: sub }
    }))
    return res.status(200).json({ companies: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
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
    return res.status(200).json({ company, owner, subscriptions, employeeCount, enabledModules: normalizeModules(company.enabledModules) })
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
    const oldStatus = company.status
    company.status = status
    company.isActive = status === 'ACTIVE'
    await company.save()
    await recordAudit(req, 'company_status_changed', { companyId: company._id, entityId: company._id, module: 'company', oldValue: { status: oldStatus }, newValue: { status } })
    return res.status(200).json({ message: 'Company status updated', company })
  } catch (err) {
    console.error('Update company status error:', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const updateCompanySubscription = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
    if (!company) return res.status(404).json({ message: 'Company not found' })
    const current = await subscriptionService.getLatestSubscription(company._id)
    const plan = req.body.plan || current?.plan || 'TRIAL'
    const defaults = PLAN_DEFAULTS[plan]
    if (!defaults) return res.status(400).json({ message: 'Unsupported subscription plan' })
    if (!current) {
      const subscription = await subscriptionService.createSubscription({ companyId: company._id, plan, startDate: req.body.startDate, endDate: req.body.endDate, autoRenew: req.body.autoRenew, price: req.body.price, durationMonths: req.body.durationMonths, employeeLimit: req.body.employeeLimit, storageLimit: req.body.storageLimit, enabledModules: req.body.enabledModules, gracePeriodDays: req.body.gracePeriodDays, changedBy: req.user.id })
      await recordAudit(req, 'subscription_created', { companyId: company._id, entityId: subscription._id, module: 'subscription', newValue: { plan, endDate: subscription.endDate } })
      return res.status(201).json({ subscription })
    }
    const oldValue = { plan: current.plan, startDate: current.startDate, endDate: current.endDate, employeeLimit: current.employeeLimit, storageLimit: current.storageLimit }
    const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(current.endDate)
    if (req.body.extendMonths) endDate.setMonth(endDate.getMonth() + Number(req.body.extendMonths))
    if (endDate <= new Date(current.startDate)) return res.status(400).json({ message: 'Subscription end date must be after its start date' })
    current.plan = plan
    current.endDate = endDate
    current.autoRenew = req.body.autoRenew ?? current.autoRenew
    current.price = req.body.price ?? defaults.price
    current.durationMonths = req.body.durationMonths ?? defaults.durationMonths
    current.employeeLimit = req.body.employeeLimit ?? defaults.employeeLimit
    current.storageLimit = req.body.storageLimit ?? defaults.storageLimit
    current.enabledModules = normalizeModules(req.body.enabledModules ?? current.enabledModules)
    current.gracePeriodDays = req.body.gracePeriodDays ?? current.gracePeriodDays
    current.status = plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE'
    await current.save()
    await Company.findByIdAndUpdate(company._id, { employeeLimit: current.employeeLimit, storageLimit: current.storageLimit, enabledModules: current.enabledModules })
    await SubscriptionHistory.create({ companyId: company._id, subscriptionId: current._id, action: req.body.extendMonths ? 'EXTENDED' : 'UPGRADED', plan: current.plan, startDate: current.startDate, endDate: current.endDate, price: current.price, changedBy: req.user.id })
    await recordAudit(req, 'subscription_updated', { companyId: company._id, entityId: current._id, module: 'subscription', oldValue, newValue: { plan: current.plan, endDate: current.endDate, employeeLimit: current.employeeLimit, storageLimit: current.storageLimit } })
    return res.status(200).json({ subscription: current })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const updateCompanyModules = async (req, res) => {
  const enabledModules = normalizeModules(req.body.enabledModules)
  if (!Array.isArray(req.body.enabledModules)) return res.status(400).json({ message: 'enabledModules must be an array' })
  const company = await Company.findByIdAndUpdate(req.params.id, { enabledModules }, { new: true, runValidators: true })
  if (!company) return res.status(404).json({ message: 'Company not found' })
  await recordAudit(req, 'company_modules_updated', { companyId: company._id, entityId: company._id, module: 'company', newValue: { enabledModules } })
  return res.status(200).json({ enabledModules: company.enabledModules })
}

export const getCompanyUsage = async (req, res) => {
  const company = await Company.findById(req.params.id).select('employeeLimit storageLimit enabledModules')
  if (!company) return res.status(404).json({ message: 'Company not found' })
  const employees = await User.countDocuments({ companyId: req.params.id, role: { $ne: 'super_admin' } })
  return res.status(200).json({ employees: { used: employees, limit: company.employeeLimit, percentage: company.employeeLimit ? Math.round((employees / company.employeeLimit) * 100) : 0 }, storage: { used: null, limit: company.storageLimit, percentage: null, measured: false }, enabledModules: normalizeModules(company.enabledModules) })
}

export const listAuditLogs = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
  const filter = req.query.companyId ? { companyId: req.query.companyId } : {}
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('actorId', 'name email role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ])
  return res.status(200).json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
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
