import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  plan: { type: String, enum: ['6_MONTHS', '1_YEAR'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
  autoRenew: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);
