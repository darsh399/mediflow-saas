import mongoose from 'mongoose'

// End-of-day field report for a rep. The visits themselves stay the source of
// truth — this record only wraps a single day with the rep's narrative and a
// manager review.
const dailyCallReportSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT', index: true },
  summary: { type: String, trim: true, maxlength: 3000 },
  workWith: { type: String, trim: true, maxlength: 160 },
  nextDayPlan: { type: String, trim: true, maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

dailyCallReportSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true })
dailyCallReportSchema.index({ companyId: 1, status: 1, date: -1 })

export default mongoose.model('DailyCallReport', dailyCallReportSchema)
