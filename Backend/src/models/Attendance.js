import mongoose from 'mongoose'

const breakSchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
}, { _id: false })

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 },
  accuracy: { type: Number, min: 0 },
}, { _id: false })

const correctionSchema = new mongoose.Schema({
  checkIn: Date,
  checkOut: Date,
  reason: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false })

const sessionSchema = new mongoose.Schema({
  checkIn: { type: Date, required: true },
  checkOut: Date,
  breaks: { type: [breakSchema], default: [] },
  location: { checkIn: locationSchema, checkOut: locationSchema },
}, { _id: true })

const attendanceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  breaks: { type: [breakSchema], default: [] },
  sessions: { type: [sessionSchema], default: [] },
  totalWorkingHours: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'HOLIDAY', 'WEEKLY_OFF'], default: 'PRESENT' },
  location: { checkIn: locationSchema, checkOut: locationSchema },
  device: { userAgent: String, platform: String },
  correction: correctionSchema,
}, { timestamps: true })

attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true })
attendanceSchema.index({ companyId: 1, status: 1, date: -1 })

export default mongoose.model('Attendance', attendanceSchema)
