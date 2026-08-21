import mongoose from 'mongoose';

const employeeActivitySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  date: { type: Date, required: true, index: true },
  description: { type: String, required: true },
  hoursWorked: { type: Number, min: 0, max: 24, required: true },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'], default: 'IN_PROGRESS' },
  notes: String
}, { timestamps: true });

export default mongoose.model('EmployeeActivity', employeeActivitySchema);
