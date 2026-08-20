import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
	companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	name: { type: String, required: true, trim: true },
	sku: { type: String, trim: true },
	description: String,
	unitPrice: { type: Number, min: 0, default: 0 },
	active: { type: Boolean, default: true },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productSchema.index({ companyId: 1, sku: 1 }, { unique: true, sparse: true });

export default mongoose.model('Product', productSchema);
