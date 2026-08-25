import mongoose from 'mongoose'

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['EARNING', 'DEDUCTION'], required: true },
  calculationType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  percentage: { type: Number, min: 0, max: 100 },
  fixedAmount: { type: Number, min: 0 },
  basedOn: { type: String, enum: ['ANNUAL_CTC', 'MONTHLY_CTC', 'BASIC', 'GROSS'], default: 'MONTHLY_CTC' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: true })

const salaryStructureSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true },
  components: { type: [componentSchema], default: [] },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

salaryStructureSchema.index({ companyId: 1, name: 1 }, { unique: true })
export default mongoose.model('SalaryStructure', salaryStructureSchema)
