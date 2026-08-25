import mongoose from 'mongoose'

const salaryComponentSchema = new mongoose.Schema({ name: String, type: String, amount: { type: Number, min: 0 }, calculationType: String, percentage: Number, basedOn: String }, { _id: false })
const salarySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
  effectiveDate: { type: Date, required: true },
  annualCtc: { type: Number, required: true, min: 0 },
  monthlyCtc: { type: Number, required: true, min: 0 },
  components: { type: [salaryComponentSchema], default: [] },
  grossSalary: { type: Number, required: true, min: 0 },
  totalDeductions: { type: Number, required: true, min: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
salarySchema.index({ companyId: 1, employeeId: 1, effectiveDate: -1 })
export default mongoose.model('Salary', salarySchema)
