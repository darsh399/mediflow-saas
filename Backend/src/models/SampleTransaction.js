import mongoose from 'mongoose'

// One movement of a sample item. Balance for a rep+item is the running sum of
// ISSUE (+) / ADJUST (+/-) minus RETURN (-) / GIVEN (-).
const sampleTransactionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'SampleItem', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['ISSUE', 'RETURN', 'GIVEN', 'ADJUST'], required: true },
  quantity: { type: Number, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  note: { type: String, trim: true, maxlength: 500 },
  occurredAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

sampleTransactionSchema.index({ companyId: 1, employeeId: 1, itemId: 1 })
sampleTransactionSchema.index({ companyId: 1, occurredAt: -1 })

// How a row moves the rep's balance.
sampleTransactionSchema.statics.sign = (type) => (type === 'RETURN' || type === 'GIVEN' ? -1 : 1)

export default mongoose.model('SampleTransaction', sampleTransactionSchema)
