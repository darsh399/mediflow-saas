import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING', 'PENDING_APPROVAL', 'REJECTED', 'INACTIVE', 'INVITED', 'PENDING_ACTIVATION'], default: 'PENDING_APPROVAL' },
  companyEmail: { type: String },
  companyMobile: { type: String },
  companyAddress: { type: String },
  companyWebsite: { type: String }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
