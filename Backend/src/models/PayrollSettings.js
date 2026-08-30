import mongoose from 'mongoose'

// Per-company statutory deduction configuration for the monthly payroll run.
// Sensible Indian defaults; every rate is editable by payroll managers.
const payrollSettingsSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true, index: true },

  // Provident Fund (employee share).
  pfEnabled: { type: Boolean, default: true },
  pfRate: { type: Number, default: 12, min: 0, max: 100 },
  // Statutory wage ceiling for PF; contribution is normally capped at
  // pfRate% of this ceiling unless pfOnFullBasic is set.
  pfWageCeiling: { type: Number, default: 15000, min: 0 },
  pfOnFullBasic: { type: Boolean, default: false },

  // Employees' State Insurance (employee share), only when gross is at or
  // below the threshold.
  esiEnabled: { type: Boolean, default: true },
  esiRate: { type: Number, default: 0.75, min: 0, max: 100 },
  esiGrossThreshold: { type: Number, default: 21000, min: 0 },

  // Professional tax — a flat monthly amount (varies by state; kept simple).
  ptEnabled: { type: Boolean, default: true },
  ptAmount: { type: Number, default: 200, min: 0 },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('PayrollSettings', payrollSettingsSchema)
