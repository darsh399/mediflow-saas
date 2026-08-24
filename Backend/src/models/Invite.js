import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String }
}, { _id: false });

const profileTemplateSchema = new mongoose.Schema({
  fatherName: { type: String },
  bloodGroup: { type: String },
  dob: { type: Date },
  gender: { type: String },
  currentAddress: { type: addressSchema },
  permanentAddress: { type: addressSchema },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  education: [{ institute: String, degree: String, year: String }],
  jobDetails: {
    designation: String,
    department: String,
    startDate: Date
  }
}, { _id: false });

const inviteSchema = new mongoose.Schema({
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, default: 'employee' },
  token: { type: String, sparse: true },
  tokenHash: { type: String, unique: true, sparse: true, select: false },
  status: { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
  sentAt: { type: Date, default: Date.now },
  emailStatus: { type: String, enum: ['queued', 'sending', 'sent', 'failed'], default: 'queued' },
  emailSentAt: { type: Date },
  emailMessageId: { type: String },
  emailError: { type: String },
  expiresAt: { type: Date },
  acceptedAt: { type: Date },
  // Optional pre-filled profile fields included in the invite
  profileTemplate: { type: profileTemplateSchema },
  // Track which steps the invitee has completed during onboarding
  progress: { type: Map, of: Boolean, default: {} }
}, { timestamps: true });

export default mongoose.model('Invite', inviteSchema);
