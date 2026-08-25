import mongoose from 'mongoose'

const organizationUnitSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  type: { type: String, enum: ['DEPARTMENT', 'DESIGNATION', 'BRANCH', 'TEAM'], required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationUnit' },
  active: { type: Boolean, default: true },
}, { timestamps: true })

organizationUnitSchema.index({ companyId: 1, type: 1, name: 1 }, { unique: true })
organizationUnitSchema.index({ companyId: 1, type: 1, active: 1 })

export default mongoose.model('OrganizationUnit', organizationUnitSchema)
