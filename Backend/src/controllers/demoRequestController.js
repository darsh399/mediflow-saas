import DemoRequest from '../models/DemoRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import recordAudit from '../utils/audit.js';

const STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'DISMISSED'];

// Public — no auth. This is the only self-service entry point left for a
// prospective company now that open signup is gone; it just captures a lead
// for super_admin to review and manually onboard via createCompanyOnboard.
export async function createDemoRequest(req, res) {
  try {
    const { name, companyName, email, phone, subject, message } = req.body || {};
    if (!name?.trim() || !companyName?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'name, companyName, email, and message are required' });
    }
    const demoRequest = await DemoRequest.create({
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      subject: subject?.trim(),
      message: message.trim(),
    });

    const superAdmins = await User.find({ role: 'super_admin' }).select('_id');
    if (superAdmins.length) {
      await Notification.insertMany(superAdmins.map((admin) => ({
        recipientId: admin._id,
        type: 'DEMO_REQUEST',
        title: 'New demo request',
        message: `${demoRequest.name} from ${demoRequest.companyName} requested a demo.`,
      })));
    }

    return res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (error) {
    console.error('Create demo request error:', error);
    return res.status(500).json({ message: 'Unable to submit enquiry', error: error.message });
  }
}

export async function listDemoRequests(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  const [data, total] = await Promise.all([
    DemoRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DemoRequest.countDocuments(filter),
  ]);
  return res.status(200).json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function updateDemoRequestStatus(req, res) {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const demoRequest = await DemoRequest.findByIdAndUpdate(
    req.params.id,
    { status, reviewedBy: req.user.id, reviewedAt: new Date() },
    { new: true }
  );
  if (!demoRequest) return res.status(404).json({ message: 'Demo request not found' });
  await recordAudit(req, 'demo_request_reviewed', { entityId: demoRequest._id, module: 'demo_request', newValue: { status } });
  return res.status(200).json({ demoRequest });
}

export default { createDemoRequest, listDemoRequests, updateDemoRequestStatus };
