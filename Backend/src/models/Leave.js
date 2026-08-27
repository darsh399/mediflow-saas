import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['annual','sick','unpaid','other'], default: 'annual' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveType: { type: String, trim: true, uppercase: true },
  fromDate: { type: Date },
  toDate: { type: Date },
  reason: { type: String },
  document: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
  },
  status: { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  numberOfDays: { type: Number, min: 0 },
  calendarDays: { type: Number, min: 0 },
  reviewNote: { type: String, trim: true, maxlength: 1000 }
}, { timestamps: true });

leaveSchema.index({ companyId: 1, userId: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export default mongoose.model('Leave', leaveSchema);
