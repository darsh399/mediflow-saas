import mongoose from 'mongoose'

const leaveBalanceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeavePolicy.leaveTypes' },
  leaveTypeCode: { type: String, required: true, uppercase: true },
  available: { type: Number, min: 0, default: 0 },
  used: { type: Number, min: 0, default: 0 },
  pending: { type: Number, min: 0, default: 0 },
  carryForward: { type: Number, min: 0, default: 0 },
  lastAccrualMonth: { type: String },
}, { timestamps: true })

leaveBalanceSchema.index({ companyId: 1, employeeId: 1, leaveTypeCode: 1 }, { unique: true })

export default mongoose.model('LeaveBalance', leaveBalanceSchema)
