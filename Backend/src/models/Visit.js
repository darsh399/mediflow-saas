import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  medicalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medical' },
  purpose: { type: String },
  notes: { type: String },
  visitLatitude: { type: Number },
  visitLongitude: { type: Number },
  registeredLatitude: { type: Number },
  registeredLongitude: { type: Number },
  distanceInMeters: { type: Number },
  locationVerified: { type: Boolean, default: false },
  visitPhoto: {
    storageName: String,
    originalName: String,
    mimeType: String,
    size: { type: Number, min: 0 },
  },
  visitedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['scheduled','completed','cancelled','pending','approved','rejected','correction_requested'], default: 'scheduled' },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

visitSchema.index({ companyId: 1, visitedAt: -1 });
visitSchema.index({ companyId: 1, employeeId: 1, visitedAt: -1 });
visitSchema.index({ companyId: 1, status: 1, visitedAt: -1 });

export default mongoose.model('Visit', visitSchema);
