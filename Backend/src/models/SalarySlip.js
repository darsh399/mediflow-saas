import mongoose from 'mongoose'

const salarySlipSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  salaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salary' },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2000 },
  components: { type: Array, default: [] },
  grossSalary: { type: Number, required: true, min: 0 },
  totalDeductions: { type: Number, required: true, min: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  lopDays: { type: Number, min: 0, default: 0 },
  lopDeduction: { type: Number, min: 0, default: 0 },
  // Frozen at generation time so later bank-detail edits don't retroactively
  // change a historical slip. Shown in full (not masked) on the slip itself.
  bankDetailsSnapshot: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
    accountType: String,
  },
  status: { type: String, enum: ['GENERATED', 'SENT'], default: 'GENERATED' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
salarySlipSchema.index({ companyId: 1, employeeId: 1, year: 1, month: 1 }, { unique: true })
salarySlipSchema.index({ companyId: 1, year: 1, month: 1 })
export default mongoose.model('SalarySlip', salarySlipSchema)
