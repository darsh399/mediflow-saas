import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  clinicName: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  specialty: { type: String },
  email: { type: String },
  phone: { type: String },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
