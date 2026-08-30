import EmployeeProfile from '../models/EmployeeProfile.js';
import User from '../models/User.js';
import { canActOn } from '../utils/authorize.js';
import recordAudit from '../utils/audit.js';

const requiredProfileFields = ['fullName', 'dob', 'mobile', 'bloodGroup', 'emergencyContact', 'currentAddress', 'permanentAddress'];
const requiredDocuments = ['aadhar', 'pan', 'addressProof', 'tenth', 'twelfth', 'degree', 'passportPhoto'];
const EMPLOYMENT_FIELDS = ['employeeId', 'departmentId', 'designationId', 'joiningDate', 'employmentType'];
const BANK_FIELDS = ['accountHolderName', 'bankName', 'accountNumber', 'ifscCode', 'branchName', 'accountType'];
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Single source of truth for profile completion — the frontend must consume
// this instead of computing its own percentage. Weights: Personal 30,
// Employment 20 (incl. experienceType), Documents 30, Bank Details 20.
export function calculateProfileCompletion(profile, user) {
  const data = profile?.profileData || {};
  const personalFilled = requiredProfileFields.filter((field) => data[field]).length;
  const personalScore = (personalFilled / requiredProfileFields.length) * 30;

  const employmentTotal = EMPLOYMENT_FIELDS.length + 1;
  const employmentFilled = EMPLOYMENT_FIELDS.filter((field) => user?.[field]).length + (profile?.experienceType ? 1 : 0);
  const employmentScore = (employmentFilled / employmentTotal) * 20;

  const documentTypes = new Set((profile?.documents || []).map((document) => document.type));
  const requiredDocs = profile?.experienceType === 'experienced' ? [...requiredDocuments, 'offerLetter', 'relievingLetter', 'salarySlips'] : requiredDocuments;
  const documentsFilled = requiredDocs.filter((type) => documentTypes.has(type)).length;
  const documentsScore = (documentsFilled / requiredDocs.length) * 30;

  const bankFilled = BANK_FIELDS.filter((field) => profile?.bankDetails?.[field]).length;
  const bankScore = (bankFilled / BANK_FIELDS.length) * 20;

  return {
    percentage: Math.round(personalScore + employmentScore + documentsScore + bankScore),
    sections: {
      personal: { label: 'Personal Information', complete: personalFilled === requiredProfileFields.length, percentage: Math.round((personalScore / 30) * 100) },
      employment: { label: 'Employment Information', complete: employmentFilled === employmentTotal, percentage: Math.round((employmentScore / 20) * 100) },
      documents: { label: 'Documents', complete: documentsFilled === requiredDocs.length, percentage: Math.round((documentsScore / 30) * 100) },
      bank: { label: 'Bank Details', complete: bankFilled === BANK_FIELDS.length, percentage: Math.round((bankScore / 20) * 100) },
    },
  };
}

// Never return a raw account number — only the last 4 digits, grouped like "XXXX XXXX 4521".
export function maskAccountNumber(accountNumber) {
  if (!accountNumber) return null;
  const value = String(accountNumber);
  const masked = value.length > 4 ? 'X'.repeat(value.length - 4) + value.slice(-4) : value;
  return masked.replace(/(.{4})(?=.)/g, '$1 ');
}

function buildBankDetailsView(bankDetails) {
  if (!bankDetails) return null;
  return {
    accountHolderName: bankDetails.accountHolderName,
    bankName: bankDetails.bankName,
    accountNumberMasked: maskAccountNumber(bankDetails.accountNumber),
    ifscCode: bankDetails.ifscCode,
    branchName: bankDetails.branchName,
    accountType: bankDetails.accountType,
    updatedAt: bankDetails.updatedAt,
  };
}

function validateSubmission(profile) {
  const data = profile.profileData || {};
  const missingFields = requiredProfileFields.filter(field => !data[field]);
  const documentTypes = new Set((profile.documents || []).map(document => document.type));
  const missingDocuments = requiredDocuments.filter(type => !documentTypes.has(type));
  if (profile.experienceType === 'experienced') {
    ['offerLetter', 'relievingLetter', 'salarySlips'].forEach(type => {
      if (!documentTypes.has(type)) missingDocuments.push(type);
    });
  }
  return { missingFields, missingDocuments };
}

export async function getMyProfile(req, res) {
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.user.id }).select('+bankDetails.accountNumber').populate('reviewedBy', 'name email role');
  const user = await User.findById(req.user.id).select(EMPLOYMENT_FIELDS.join(' ')).lean();
  const completion = calculateProfileCompletion(profile, user);
  const profileObj = profile ? profile.toObject() : null;
  if (profileObj) profileObj.bankDetails = buildBankDetailsView(profileObj.bankDetails);
  return res.json({ profile: profileObj, completion });
}

export async function saveBankDetails(req, res) {
  const { accountHolderName, bankName, accountNumber, confirmAccountNumber, ifscCode, branchName, accountType } = req.body || {};
  if (!accountHolderName || !bankName || !accountNumber || !ifscCode || !branchName || !accountType) {
    return res.status(400).json({ message: 'All bank detail fields are required' });
  }
  if (confirmAccountNumber !== undefined && String(confirmAccountNumber) !== String(accountNumber)) {
    return res.status(400).json({ message: 'Account number and confirmation do not match' });
  }
  if (!/^\d{9,18}$/.test(String(accountNumber))) return res.status(400).json({ message: 'Account number must be 9-18 digits' });
  const ifsc = String(ifscCode).toUpperCase();
  if (!IFSC_REGEX.test(ifsc)) return res.status(400).json({ message: 'Invalid IFSC code format' });
  if (!['SAVINGS', 'CURRENT', 'OTHER'].includes(accountType)) return res.status(400).json({ message: 'Invalid account type' });

  const bankDetails = { accountHolderName: String(accountHolderName).trim(), bankName: String(bankName).trim(), accountNumber: String(accountNumber), ifscCode: ifsc, branchName: String(branchName).trim(), accountType, updatedAt: new Date() };
  const profile = await EmployeeProfile.findOneAndUpdate(
    { companyId: req.user.companyId, userId: req.user.id },
    { $set: { bankDetails } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const user = await User.findById(req.user.id).select(EMPLOYMENT_FIELDS.join(' ')).lean();
  const completion = calculateProfileCompletion({ ...profile.toObject(), bankDetails }, user);
  await recordAudit(req, 'employee_bank_details_saved', { targetUserId: req.user.id });
  return res.json({ message: 'Bank details saved', bankDetails: buildBankDetailsView(bankDetails), completion });
}

export async function saveProfile(req, res) {
  const { profileData, experienceType, documents } = req.body;
  console.log('data come from experinece', profileData, 'experinecetype', experienceType, 'documents', documents);
  
  if (experienceType && !['fresher', 'experienced'].includes(experienceType)) return res.status(400).json({ message: 'Invalid experienceType' });
  const profile = await EmployeeProfile.findOneAndUpdate(
    { companyId: req.user.companyId, userId: req.user.id },
    { $set: { ...(profileData ? { profileData } : {}), ...(experienceType ? { experienceType } : {}), ...(documents ? { documents } : {}), status: 'DRAFT', rejectionReason: undefined } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  // Keep the account summary in sync with the employee's onboarding details.
  // This lets managers see the correct name and mobile number in user lists.
  const accountUpdates = {};
  if (profileData?.fullName?.trim()) accountUpdates.name = profileData.fullName.trim();
  if (profileData?.mobile?.trim()) accountUpdates.mobile = profileData.mobile.trim();
  if (Object.keys(accountUpdates).length) {
    await User.updateOne(
      { _id: req.user.id, companyId: req.user.companyId },
      { $set: accountUpdates }
    );
  }
  return res.json({ message: 'Profile saved as draft', profile });
}

export async function submitProfile(req, res) {
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.user.id });
  if (!profile) return res.status(404).json({ message: 'Profile draft not found' });
  const validation = validateSubmission(profile);
  if (validation.missingFields.length || validation.missingDocuments.length) return res.status(400).json({ message: 'Profile is incomplete', ...validation });
  profile.status = 'SUBMITTED';
  profile.submittedAt = new Date();
  profile.rejectionReason = undefined;
  await profile.save();
  await recordAudit(req, 'employee_profile_submitted', { targetUserId: req.user.id });
  return res.json({ message: 'Profile submitted for review', profile });
}

// Only company_owner and hr_manager (plus admin's platform-wide override) may
// approve/reject onboarding profiles. Normal hr can view/check documents via
// the route-level `viewers` gate but has no approval authority.
const APPROVAL_ROLES = ['admin', 'company_owner', 'hr_manager'];

// Maker-checker: the administrator who created an employee account can never
// review/approve that same employee's onboarding profile. Computed the same
// way here and in reviewProfile so the frontend never has to re-derive it.
function computeReviewEligibility(profile, reqUser) {
  const employee = profile.userId;
  if (!employee) return { canReview: false, reason: null };
  if (!APPROVAL_ROLES.includes(reqUser.role)) return { canReview: false, reason: null };
  if (String(employee._id) === String(reqUser.id)) {
    return { canReview: false, reason: 'You cannot review your own profile.' };
  }
  const creatorId = employee.createdBy?._id || employee.createdBy;
  // Maker-checker applies to hr_manager: they may not review an employee they
  // created. company_owner and admin are the final authority and are exempt —
  // in a small company they are often the only reviewer.
  if (reqUser.role === 'hr_manager' && creatorId && String(creatorId) === String(reqUser.id)) {
    return { canReview: false, reason: 'You created this employee. Another authorized administrator must review this profile.' };
  }
  if (profile.status !== 'SUBMITTED') return { canReview: false, reason: null };
  return { canReview: true, reason: null };
}

export async function listProfiles(req, res) {
  const profiles = await EmployeeProfile.find({ companyId: req.user.companyId })
    .select('+bankDetails.accountNumber')
    .populate({ path: 'userId', select: 'name email role mobile employeeId departmentId designationId joiningDate employmentType createdBy', populate: { path: 'createdBy', select: 'name email role' } })
    .populate('reviewedBy', 'name email role')
    .sort({ updatedAt: -1 });
  const withCompletion = profiles.map((profile) => {
    const obj = profile.toObject();
    const completion = calculateProfileCompletion(profile, profile.userId);
    obj.bankDetails = buildBankDetailsView(obj.bankDetails);
    obj.completion = completion;
    obj.reviewEligibility = computeReviewEligibility(profile, req.user);
    return obj;
  });
  return res.json({ profiles: withCompletion });
}

export async function reviewProfile(req, res) {
  const { status, rejectionReason } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
  const profile = await EmployeeProfile.findOne({ _id: req.params.id, companyId: req.user.companyId }).populate('userId', 'role createdBy');
  if (!profile) return res.status(404).json({ message: 'Employee profile not found' });
  if (String(profile.userId._id) === String(req.user.id)) return res.status(403).json({ message: 'You cannot review your own profile' });
  // Maker-checker for hr_manager only — company_owner / admin are exempt.
  if (req.user.role === 'hr_manager' && profile.userId.createdBy && String(profile.userId.createdBy) === String(req.user.id)) {
    return res.status(403).json({ message: 'You created this employee. Another authorized administrator must review this profile.' });
  }
  if (!canActOn(req.user, profile.userId.role)) return res.status(403).json({ message: 'Insufficient permissions to review this profile' });
  if (status === 'REJECTED' && !rejectionReason) return res.status(400).json({ message: 'rejectionReason is required' });
  profile.status = status;
  profile.rejectionReason = status === 'REJECTED' ? rejectionReason : undefined;
  profile.reviewedBy = req.user.id;
  profile.reviewedAt = new Date();
  await profile.save();
  await recordAudit(req, `employee_profile_${status.toLowerCase()}`, { targetUserId: profile.userId._id }, { rejectionReason });
  return res.json({ message: `Profile ${status.toLowerCase()}`, profile });
}
