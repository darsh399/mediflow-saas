import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  url: { type: String, required: true },
  originalName: String,
  mimeType: String,
  size: { type: Number, min: 0 },
  expiresAt: Date,
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

const bankDetailsSchema = new mongoose.Schema({
  accountHolderName: { type: String, trim: true },
  bankName: { type: String, trim: true },
  accountNumber: { type: String, trim: true, select: false },
  ifscCode: { type: String, trim: true, uppercase: true, match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'] },
  branchName: { type: String, trim: true },
  accountType: { type: String, enum: ['SAVINGS', 'CURRENT', 'OTHER'] },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const employeeProfileSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  profileData: { type: mongoose.Schema.Types.Mixed, default: {} },
  experienceType: { type: String, enum: ['fresher', 'experienced'] },
  documents: { type: [documentSchema], default: [] },
  bankDetails: { type: bankDetailsSchema, default: undefined },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT', index: true },
  rejectionReason: String,
  submittedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

export default mongoose.model('EmployeeProfile', employeeProfileSchema);
