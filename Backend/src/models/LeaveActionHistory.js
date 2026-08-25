import mongoose from 'mongoose'

const leaveActionHistorySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  leaveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave', required: true, index: true },
  action: { type: String, enum: ['APPLIED', 'UPDATED', 'CANCELLED', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'RECALLED', 'BALANCE_ADJUSTED', 'COMMENT_ADDED'], required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  comment: { type: String, trim: true, maxlength: 1000 },
  previousStatus: String,
  newStatus: String,
}, { timestamps: true })

leaveActionHistorySchema.index({ companyId: 1, leaveId: 1, createdAt: 1 })

export default mongoose.model('LeaveActionHistory', leaveActionHistorySchema)
