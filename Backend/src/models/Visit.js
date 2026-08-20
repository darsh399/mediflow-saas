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
  visitedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['scheduled','completed','cancelled'], default: 'scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Visit', visitSchema);
