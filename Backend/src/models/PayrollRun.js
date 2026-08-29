import mongoose from 'mongoose'

const statutorySchema = new mongoose.Schema({
  pf: { type: Number, default: 0, min: 0 },
  esi: { type: Number, default: 0, min: 0 },
  pt: { type: Number, default: 0, min: 0 },
  tds: { type: Number, default: 0, min: 0 },
}, { _id: false })

const payrollLineSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String },
  salaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salary' },
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  basic: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  lopDays: { type: Number, default: 0 },
  lopDeduction: { type: Number, default: 0 },
  structureDeductions: { type: Number, default: 0 },
  statutory: { type: statutorySchema, default: () => ({}) },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  components: { type: Array, default: [] },
  bankDetailsSnapshot: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
    accountType: String,
  },
  // Set once slips are generated for the run.
  slipId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalarySlip', default: null },
  excluded: { type: Boolean, default: false },
})

const payrollRunSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2000 },
  status: { type: String, enum: ['DRAFT', 'APPROVED', 'PAID'], default: 'DRAFT', index: true },
  lines: { type: [payrollLineSchema], default: [] },
  totals: {
    headcount: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    pt: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
  },
  slipsGenerated: { type: Boolean, default: false },
  notes: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  paidAt: { type: Date },
}, { timestamps: true })

payrollRunSchema.index({ companyId: 1, year: 1, month: 1 }, { unique: true })

export default mongoose.model('PayrollRun', payrollRunSchema)
