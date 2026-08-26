import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  // Optional frontend route (e.g. "/my-visits?visitId=...") to send the user
  // to when they click this notification.
  link: { type: String, trim: true },
  dedupeKey: { type: String, unique: true, sparse: true, index: true },
  readAt: Date
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
