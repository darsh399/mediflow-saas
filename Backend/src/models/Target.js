import mongoose from 'mongoose'

const targetSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  // The rep the target is set for.
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Optional project/team the target belongs to (used for project-manager scope).
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  // Calendar month the target covers.
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2000 },
  // Monthly order/sale value target, in rupees.
  salesTarget: { type: Number, required: true, min: 0, default: 0 },
  // Monthly doctor/chemist visit count target.
  visitTarget: { type: Number, required: true, min: 0, default: 0 },
  note: { type: String, trim: true, maxlength: 300 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

// One target per rep per month.
targetSchema.index({ companyId: 1, employeeId: 1, year: 1, month: 1 }, { unique: true })
targetSchema.index({ companyId: 1, year: 1, month: 1 })
targetSchema.index({ companyId: 1, projectId: 1 })

export default mongoose.model('Target', targetSchema)
