import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  clinicName: { type: String },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  latitude: { type: Number },
  longitude: { type: Number },
  specialty: { type: String },
  email: { type: String },
  phone: { type: String },
  dateOfBirth: { type: Date },
  territoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', default: null },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

doctorSchema.index({ companyId: 1, territoryId: 1 });
doctorSchema.index({ companyId: 1, city: 1 });
doctorSchema.index({ companyId: 1, state: 1 });
doctorSchema.index({ companyId: 1, district: 1 });

export default mongoose.model('Doctor', doctorSchema);
