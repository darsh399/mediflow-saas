import mongoose from 'mongoose'

const leaveLedgerSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId },
  leaveTypeCode: { type: String, required: true, uppercase: true },
  transactionType: { type: String, enum: ['MONTHLY_ACCRUAL', 'LEAVE_APPROVED', 'LEAVE_CANCELLED', 'CARRY_FORWARD', 'MANUAL_ADJUSTMENT', 'EXPIRY', 'INITIAL_BALANCE'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  source: { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  monthKey: { type: String },
  description: { type: String, trim: true, maxlength: 500 },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

leaveLedgerSchema.index({ companyId: 1, employeeId: 1, leaveTypeCode: 1, monthKey: 1, transactionType: 1 }, { unique: true, partialFilterExpression: { transactionType: 'MONTHLY_ACCRUAL', monthKey: { $type: 'string' } } })
leaveLedgerSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 })

export default mongoose.model('LeaveLedger', leaveLedgerSchema)
