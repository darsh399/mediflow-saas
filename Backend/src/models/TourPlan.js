import mongoose from 'mongoose'

const tourPlanItemSchema = new mongoose.Schema({
  kind: { type: String, enum: ['DOCTOR', 'MEDICAL'], required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  medicalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medical' },
  plannedDate: { type: Date, required: true },
  objective: { type: String, trim: true, maxlength: 300 },
  notes: { type: String, trim: true, maxlength: 500 },
})

const tourPlanSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  // The rep the plan belongs to.
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, maxlength: 160 },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT', index: true },
  items: { type: [tourPlanItemSchema], default: [] },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

tourPlanSchema.index({ companyId: 1, employeeId: 1, periodStart: -1 })
tourPlanSchema.index({ companyId: 1, status: 1, periodStart: -1 })

export default mongoose.model('TourPlan', tourPlanSchema)
