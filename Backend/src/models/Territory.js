import mongoose from 'mongoose'

const territorySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, trim: true, uppercase: true, maxlength: 20 },
  description: { type: String, trim: true, maxlength: 500 },
  // The territory in-charge (area sales manager / field manager).
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // MRs / field reps who work this territory.
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Freeform city / district names this territory covers — for reference and to
  // help suggest which doctors and chemists belong here.
  areaTags: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

territorySchema.index({ companyId: 1, name: 1 }, { unique: true })
territorySchema.index({ companyId: 1, active: 1 })

export default mongoose.model('Territory', territorySchema)
