import mongoose from 'mongoose';

const demoRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  subject: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'CONVERTED', 'DISMISSED'], default: 'NEW' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

demoRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('DemoRequest', demoRequestSchema);
