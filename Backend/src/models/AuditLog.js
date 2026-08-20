import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  action: { type: String, required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserRole: { type: String },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  meta: { type: Object },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);
