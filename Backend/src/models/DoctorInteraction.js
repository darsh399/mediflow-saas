import mongoose from 'mongoose'

const doctorInteractionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  // The rep who had / logged the interaction.
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kind: {
    type: String,
    enum: ['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'EVENT', 'GIFT', 'SAMPLE', 'GREETING', 'NOTE'],
    required: true,
  },
  summary: { type: String, required: true, trim: true, maxlength: 2000 },
  outcome: { type: String, trim: true, maxlength: 1000 },
  followUpDate: { type: Date },
  occurredAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

doctorInteractionSchema.index({ companyId: 1, doctorId: 1, occurredAt: -1 })
doctorInteractionSchema.index({ companyId: 1, followUpDate: 1 })

export default mongoose.model('DoctorInteraction', doctorInteractionSchema)
