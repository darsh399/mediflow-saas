import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  url: { type: String, required: true },
  originalName: String,
  mimeType: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const employeeProfileSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  profileData: { type: mongoose.Schema.Types.Mixed, default: {} },
  experienceType: { type: String, enum: ['fresher', 'experienced'] },
  documents: { type: [documentSchema], default: [] },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT', index: true },
  rejectionReason: String,
  submittedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

export default mongoose.model('EmployeeProfile', employeeProfileSchema);
