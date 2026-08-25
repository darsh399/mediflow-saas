import mongoose from 'mongoose'

const leaveTypeSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  enabled: { type: Boolean, default: true },
  yearlyAllowance: { type: Number, min: 0, default: 0 },
  monthlyAccrual: { type: Number, min: 0, default: 0 },
  maxCarryForward: { type: Number, min: 0, default: 0 },
  unusedExpires: { type: Boolean, default: false },
  documentRequired: { type: Boolean, default: false },
  minimumNoticeDays: { type: Number, min: 0, default: 0 },
  maximumConsecutiveDays: { type: Number, min: 0 },
  allowDuringProbation: { type: Boolean, default: true },
  managerApprovalRequired: { type: Boolean, default: false },
  hrApprovalRequired: { type: Boolean, default: true },
}, { _id: true })

const leavePolicySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true, index: true },
  leaveTypes: { type: [leaveTypeSchema], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('LeavePolicy', leavePolicySchema)
