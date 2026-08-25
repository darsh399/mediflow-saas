import mongoose from 'mongoose'

const subscriptionHistorySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  action: { type: String, enum: ['CREATED', 'RENEWED', 'UPGRADED', 'DOWNGRADED', 'EXTENDED', 'CANCELLED'], required: true },
  plan: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  price: Number,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

subscriptionHistorySchema.index({ companyId: 1, createdAt: -1 })

export default mongoose.model('SubscriptionHistory', subscriptionHistorySchema)
