import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  medicalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medical' },
  purpose: { type: String },
  notes: { type: String },
  // What the rep discussed with the doctor during the visit.
  discussion: { type: String, trim: true, maxlength: 2000 },
  // The doctor's overall reaction.
  doctorResponse: {
    type: String,
    enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'INTERESTED', 'NOT_INTERESTED', 'FOLLOW_UP_REQUIRED'],
  },
  doctorResponseNotes: { type: String, trim: true, maxlength: 1000 },
  visitLatitude: { type: Number },
  visitLongitude: { type: Number },
  registeredLatitude: { type: Number },
  registeredLongitude: { type: Number },
  distanceInMeters: { type: Number },
  locationVerified: { type: Boolean, default: false },
  visitPhoto: {
    storageName: String,
    originalName: String,
    mimeType: String,
    size: { type: Number, min: 0 },
  },
  visitedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['scheduled','completed','cancelled','pending','approved','rejected','correction_requested'], default: 'scheduled' },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  // Set only when this visit was scheduled for an employee by an admin/hr_manager/
  // manager (see assignVisit) — absent for self-logged check-ins.
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Reason the assigned employee gave when moving visitedAt to a new date.
  rescheduleReason: { type: String, trim: true, maxlength: 1000 },
  // Reason the assigned employee gave when cancelling a scheduled visit.
  cancellationReason: { type: String, trim: true, maxlength: 1000 },
  // When the assigned employee marked this visit done — distinct from
  // visitedAt, which is the planned/assigned date and may be in the past
  // relative to when they actually completed it.
  completedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

visitSchema.index({ companyId: 1, visitedAt: -1 });
visitSchema.index({ companyId: 1, employeeId: 1, visitedAt: -1 });
visitSchema.index({ companyId: 1, status: 1, visitedAt: -1 });

export default mongoose.model('Visit', visitSchema);
