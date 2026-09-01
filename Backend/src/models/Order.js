import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'productModel' },
  // New orders use the rich company catalog. Missing values on older orders
  // resolve to the legacy Product model through the schema default.
  productModel: { type: String, enum: ['Product', 'CompanyProduct'], default: 'Product' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [orderItemSchema], required: true, validate: value => value.length > 0 },
  notes: String,
  fulfillmentStatus: { type: String, enum: ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED'], default: 'PENDING', index: true },
  status: { type: String, enum: ['PLACED', 'CONFIRMED', 'FULFILLED', 'CANCELLED'], default: 'PLACED', index: true }
}, { timestamps: true });

orderSchema.index({ companyId: 1, createdAt: -1 });
orderSchema.index({ companyId: 1, createdBy: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
