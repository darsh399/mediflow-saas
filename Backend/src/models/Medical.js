import mongoose from 'mongoose';

const medicalSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  contactPerson: { type: String },
  mobile: { type: String },
  email: { type: String },
  licenseNumber: { type: String },
  address: { type: String },
  area: { type: String },
  city: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  territoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

medicalSchema.index({ companyId: 1, territoryId: 1 });

export default mongoose.model('Medical', medicalSchema);
