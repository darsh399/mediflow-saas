import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: String,
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'], default: 'PLANNED', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
