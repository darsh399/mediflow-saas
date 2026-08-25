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
        enum: ['user', 'admin', 'hr', 'hr_manager', 'superadmin', 'super_admin', 'company_owner', 'manager', 'project_manager', 'employee', 'mr', 'teamlead', 'intern', 'contractor', 'consultant', 'freelancer', 'partner', 'vendor', 'client', 'customer', 'guest'],
        default: 'user'
    },
    mobile: { type: String, required: false, unique: false },
    employeeId: { type: String, trim: true, sparse: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    joiningDate: { type: Date },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationUnit' },
    designationId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationUnit' },
    reportingManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationUnit' },
    employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'] },
    probationStatus: { type: String, enum: ['NOT_APPLICABLE', 'IN_PROGRESS', 'COMPLETED'] },
    employeeStatus: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'PROBATION', 'RESIGNED', 'TERMINATED', 'INACTIVE'], default: 'ACTIVE' },
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

userSchema.index({ companyId: 1, employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ companyId: 1, employeeStatus: 1 });

export default mongoose.model('User', userSchema);
