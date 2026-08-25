import mongoose from 'mongoose';

// Named CompanyProduct (not Product) and routed separately from the existing
// Orders catalog (models/Product.js, /api/products) — that model is a
// lightweight sales line-item (name/sku/unitPrice) for a different feature
// and already has its own routes/authorization. This is the MR/doctor
// detailing reference catalog described in the Company Product Management
// spec: richer pharma-style fields, multi-image gallery, and a stricter
// company_owner/hr_manager-only write policy.
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  originalName: String,
  mimeType: String,
  size: Number,
}, { _id: true });

const companyProductSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true },
  productCode: { type: String, trim: true },
  category: { type: String, trim: true },
  type: { type: String, trim: true },
  brand: { type: String, trim: true },
  shortDescription: { type: String, trim: true, maxlength: 300 },
  description: { type: String, trim: true },
  composition: { type: String, trim: true },
  benefits: { type: [String], default: [] },
  indications: { type: [String], default: [] },
  dosage: { type: String, trim: true },
  precautions: { type: String, trim: true },
  sideEffects: { type: String, trim: true },
  storageInstructions: { type: String, trim: true },
  targetCondition: { type: String, trim: true },
  targetAudience: { type: String, trim: true },
  mainImage: { type: imageSchema },
  images: { type: [imageSchema], default: [] },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Snapshot of the creator's role at creation time — a role change later
  // shouldn't rewrite "who added this and in what capacity".
  createdByRole: { type: String },
}, { timestamps: true });

companyProductSchema.index({ companyId: 1, productCode: 1 }, { unique: true, sparse: true });
companyProductSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export default mongoose.model('CompanyProduct', companyProductSchema);
