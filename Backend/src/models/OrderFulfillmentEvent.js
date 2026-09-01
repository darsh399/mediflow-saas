import mongoose from 'mongoose'

const orderFulfillmentEventSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  status: { type: String, enum: ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED'], required: true },
  note: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

orderFulfillmentEventSchema.index({ companyId: 1, orderId: 1, createdAt: -1 })

export default mongoose.model('OrderFulfillmentEvent', orderFulfillmentEventSchema)
