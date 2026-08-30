import mongoose from 'mongoose';
import { MODULES } from '../config/modules.js';

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING', 'PENDING_APPROVAL', 'REJECTED', 'INACTIVE', 'INVITED', 'PENDING_ACTIVATION'], default: 'PENDING_APPROVAL' },
  companyEmail: { type: String },
  companyMobile: { type: String },
  companyAddress: { type: String },
  companyWebsite: { type: String },
  employeeLimit: { type: Number, default: 10, min: 0 },
  storageLimit: { type: Number, default: 1, min: 0 },
  enabledModules: { type: [String], default: () => [...MODULES] },
  weeklyWorkingDays: { type: [String], enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], default: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
  // Rates for the visit-distance travel-claim helper; 0 = disabled.
  travelAllowance: {
    ratePerKm: { type: Number, default: 0, min: 0 },
    dailyAllowance: { type: Number, default: 0, min: 0 },
  }
}, { timestamps: true });

companySchema.index({ status: 1, createdAt: -1 });
companySchema.index({ companyName: 1 });

export default mongoose.model('Company', companySchema);
