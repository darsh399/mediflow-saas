import mongoose from 'mongoose'

// A physical thing a rep carries into the field: a product sample or a gift.
const sampleItemSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  kind: { type: String, enum: ['SAMPLE', 'GIFT'], default: 'SAMPLE' },
  unit: { type: String, trim: true, maxlength: 24, default: 'unit' },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

sampleItemSchema.index({ companyId: 1, name: 1 }, { unique: true })

export default mongoose.model('SampleItem', sampleItemSchema)
