import mongoose from 'mongoose'

const offerLetterSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  salaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salary' },
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  jobTitle: { type: String, required: true, trim: true },
  department: String,
  joiningDate: Date,
  employmentType: String,
  additionalTerms: String,
  salarySnapshot: { type: Object, default: {} },
  status: { type: String, enum: ['DRAFT', 'SENT', 'FAILED'], default: 'DRAFT' },
  sentAt: Date,
  sendError: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
offerLetterSchema.index({ companyId: 1, createdAt: -1 })
export default mongoose.model('OfferLetter', offerLetterSchema)
