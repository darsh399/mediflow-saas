import mongoose from 'mongoose'

const holidaySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  date: { type: Date, required: true },
  endDate: { type: Date },
  type: { type: String, enum: ['COMPANY', 'OPTIONAL'], default: 'COMPANY' },
  description: { type: String, trim: true, maxlength: 500 },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

holidaySchema.index({ companyId: 1, date: 1, name: 1 }, { unique: true })
holidaySchema.index({ companyId: 1, date: 1, endDate: 1 })

export default mongoose.model('Holiday', holidaySchema)
