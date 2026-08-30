import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  clinicName: { type: String },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  latitude: { type: Number },
  longitude: { type: Number },
  // Metres above sea level. Optional everywhere — most browsers/devices report
  // null for altitude, so it is never required (not even for manual creation).
  altitude: { type: Number },
  specialty: { type: String },
  email: { type: String },
  phone: { type: String },
  dateOfBirth: { type: Date },
  territoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', default: null },

  // --- CRM / engagement fields ---
  // Prescriber value tier (A = highest priority).
  tier: { type: String, enum: ['A', 'B', 'C', 'UNGRADED'], default: 'UNGRADED' },
  tags: { type: [String], default: [] },
  kyc: {
    registrationNumber: { type: String, trim: true },
    qualification: { type: String, trim: true },
    hospitalAffiliation: { type: String, trim: true },
    preferredContact: { type: String, enum: ['PHONE', 'EMAIL', 'WHATSAPP', 'IN_PERSON', ''], default: '' },
    preferredContactTime: { type: String, trim: true },
  },
  // Relationship / practice anniversary — used for engagement reminders.
  anniversaryDate: { type: Date },
  // Consent to receive marketing / educational material (UCPMP).
  marketingConsent: { type: Boolean, default: false },
  consentCapturedAt: { type: Date },
  // Denormalised — the most recent visit or logged interaction.
  lastInteractionAt: { type: Date },

  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

doctorSchema.index({ companyId: 1, tier: 1 });

doctorSchema.index({ companyId: 1, territoryId: 1 });
doctorSchema.index({ companyId: 1, city: 1 });
doctorSchema.index({ companyId: 1, state: 1 });
doctorSchema.index({ companyId: 1, district: 1 });

export default mongoose.model('Doctor', doctorSchema);
