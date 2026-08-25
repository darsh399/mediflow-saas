import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  action: { type: String, required: true },
  module: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserRole: { type: String },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  meta: { type: Object },
}, { timestamps: true });

auditSchema.index({ companyId: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditSchema);
