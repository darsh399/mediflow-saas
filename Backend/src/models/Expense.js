import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, enum: ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'CLIENT_ENTERTAINMENT', 'OTHER'] },
  amount: { type: Number, required: true, min: 0 },
  expenseDate: { type: Date, required: true },
  description: { type: String, trim: true, maxlength: 1000 },
  // Proof/receipt document is optional — an employee can submit an expense
  // claim without attaching one.
  receipt: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNote: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

expenseSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });
expenseSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export default mongoose.model('Expense', expenseSchema);
