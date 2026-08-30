import mongoose from 'mongoose'

const saleSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  // The rep who made the sale.
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  amount: { type: Number, required: true, min: 0 },
  quantity: { type: Number, min: 1, default: 1 },
  saleDate: { type: Date, required: true },
  notes: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

saleSchema.index({ companyId: 1, employeeId: 1, saleDate: -1 })
saleSchema.index({ companyId: 1, saleDate: -1 })
saleSchema.index({ companyId: 1, doctorId: 1 })

export default mongoose.model('Sale', saleSchema)
