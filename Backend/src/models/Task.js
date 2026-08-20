import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: Date,
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'TODO', index: true },
  completedAt: Date
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
