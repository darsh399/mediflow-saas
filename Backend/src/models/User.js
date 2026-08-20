import mongoose from "mongoose";
const addressSchema = new mongoose.Schema({
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String }
}, { _id: false });

const profileSchema = new mongoose.Schema({
    fatherName: { type: String },
    bloodGroup: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    mobileAlternate: { type: String },
    emergencyContact: {
        name: { type: String },
        relation: { type: String },
        phone: { type: String }
    },
    currentAddress: { type: addressSchema },
    permanentAddress: { type: addressSchema },
    education: [{
        institute: String,
        degree: String,
        year: String
    }],
    jobDetails: {
        designation: { type: String },
        department: { type: String },
        startDate: { type: Date }
    },
    documents: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    completedSteps: [{ type: String }]
}, { _id: false });

const userSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['user', 'admin', 'hr', 'hr_manager', 'superadmin', 'super_admin', 'company_owner', 'manager', 'employee', 'mr', 'teamlead', 'intern', 'contractor', 'consultant', 'freelancer', 'partner', 'vendor', 'client', 'customer', 'guest'],
        default: 'user'
    },
    mobile: { type: String, required: false, unique: false },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    blocked: { type: Boolean, default: false },
    passwordChangeRequired: { type: Boolean, default: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
    profile: { type: profileSchema, default: {} },
    // If user was invited, store reference to invite
    invite: { type: mongoose.Schema.Types.ObjectId, ref: 'Invite' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
