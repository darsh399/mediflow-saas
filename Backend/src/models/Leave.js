import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['annual','sick','unpaid','other'], default: 'annual' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveType: { type: String, enum: ['CASUAL', 'SICK', 'EARNED', 'PAID', 'UNPAID', 'OTHER'] },
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
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ,reviewNote: { type: String, trim: true, maxlength: 1000 }
}, { timestamps: true });

export default mongoose.model('Leave', leaveSchema);
