import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mailService from '../services/mailService.js';

const SENDER_ROLES = ['admin', 'company_owner', 'hr_manager'];

export async function sendCompanyMessage(req, res) {
  try {
    if (!SENDER_ROLES.includes(req.user?.role)) return res.status(403).json({ message: 'Only Admin, Company Owner, or HR Manager can send messages' });
    const { channel, subject, body, recipientIds } = req.body || {};
    if (!['email', 'notification'].includes(channel) || !subject?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'Channel, subject, and message are required' });
    }
    let selectedIds = [];
    if (recipientIds) {
      try { selectedIds = Array.isArray(recipientIds) ? recipientIds : JSON.parse(recipientIds); } catch { return res.status(400).json({ message: 'Invalid recipient selection' }); }
    }
    const query = { ...(req.user.companyId ? { companyId: req.user.companyId } : {}), active: true, blocked: { $ne: true } };
    // In-app notifications are always broadcast to the whole company.  A
    // recipient list is accepted only for targeted email messages.
    if (channel === 'email' && selectedIds.length) query._id = { $in: selectedIds };
    const recipients = await User.find(query).select('name email companyId');
    if (!recipients.length) return res.status(400).json({ message: 'No eligible company recipients found' });
    if (channel === 'notification') {
      await Notification.insertMany(recipients.map((user) => ({ companyId: user.companyId, recipientId: user._id, type: 'company_message', title: subject.trim(), message: body.trim() })));
    } else {
      const attachments = req.file ? [{ filename: req.file.originalname, content: req.file.buffer, contentType: req.file.mimetype }] : [];
      const emailRecipients = recipients.filter((user) => user.email);
      if (!emailRecipients.length) return res.status(400).json({ message: 'None of the selected recipients have an email address' });
      await Promise.all(emailRecipients.map((user) => mailService.sendMail({ to: user.email, subject: subject.trim(), text: body.trim(), html: `<p>${body.trim().replace(/\n/g, '<br>')}</p>`, attachments })));
      return res.json({ message: `Email sent to ${emailRecipients.length} recipient(s)`, recipientCount: emailRecipients.length });
    }
    return res.json({ message: `Notification sent to ${recipients.length} recipient(s)`, recipientCount: recipients.length });
  } catch (error) { console.error('Company message error:', error); return res.status(500).json({ message: 'Unable to send message', error: error.message }); }
}

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipientId: req.user.id, ...(req.user.companyId ? { companyId: req.user.companyId } : {}) }).sort({ createdAt: -1 }).limit(100);
  return res.json({ notifications });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipientId: req.user.id }, { readAt: new Date() }, { new: true });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}

export async function markAllNotificationsRead(req, res) {
  await Notification.updateMany({ recipientId: req.user.id, readAt: null }, { readAt: new Date() });
  return res.json({ message: 'All notifications marked as read' });
}
