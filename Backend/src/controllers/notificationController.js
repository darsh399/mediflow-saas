import Notification from '../models/Notification.js';

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipientId: req.user.id, ...(req.user.companyId ? { companyId: req.user.companyId } : {}) }).sort({ createdAt: -1 }).limit(100);
  return res.json({ notifications });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipientId: req.user.id }, { readAt: new Date() }, { new: true });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}
