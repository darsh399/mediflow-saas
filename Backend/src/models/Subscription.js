import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  plan: { type: String, enum: ['FREE', 'TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', '6_MONTHS', '1_YEAR'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'TRIAL', 'GRACE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
  autoRenew: { type: Boolean, default: false },
  price: { type: Number, default: 0, min: 0 },
  durationMonths: { type: Number, min: 0 },
  employeeLimit: { type: Number, min: 0 },
  storageLimit: { type: Number, min: 0 },
  enabledModules: { type: [String] },
  gracePeriodDays: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

subscriptionSchema.index({ companyId: 1, endDate: -1 });
subscriptionSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
