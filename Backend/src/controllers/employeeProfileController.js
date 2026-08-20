import EmployeeProfile from '../models/EmployeeProfile.js';
import User from '../models/User.js';
import { canActOn } from '../utils/authorize.js';
import recordAudit from '../utils/audit.js';

const requiredProfileFields = ['fullName', 'dob', 'mobile', 'bloodGroup', 'emergencyContact', 'currentAddress', 'permanentAddress'];
const requiredDocuments = ['aadhar', 'pan', 'addressProof', 'tenth', 'twelfth', 'degree', 'passportPhoto'];

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
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.user.id }).populate('reviewedBy', 'name email role');
  return res.json({ profile });
}

export async function saveProfile(req, res) {
  const { profileData, experienceType, documents } = req.body;
  if (experienceType && !['fresher', 'experienced'].includes(experienceType)) return res.status(400).json({ message: 'Invalid experienceType' });
  const profile = await EmployeeProfile.findOneAndUpdate(
    { companyId: req.user.companyId, userId: req.user.id },
    { $set: { ...(profileData ? { profileData } : {}), ...(experienceType ? { experienceType } : {}), ...(documents ? { documents } : {}), status: 'DRAFT', rejectionReason: undefined } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
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

export async function listProfiles(req, res) {
  const profiles = await EmployeeProfile.find({ companyId: req.user.companyId }).populate('userId', 'name email role mobile').sort({ updatedAt: -1 });
  return res.json({ profiles });
}

export async function reviewProfile(req, res) {
  const { status, rejectionReason } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
  const profile = await EmployeeProfile.findOne({ _id: req.params.id, companyId: req.user.companyId }).populate('userId', 'role');
  if (!profile) return res.status(404).json({ message: 'Employee profile not found' });
  if (String(profile.userId._id) === String(req.user.id)) return res.status(403).json({ message: 'You cannot review your own profile' });
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
