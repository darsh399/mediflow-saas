import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import EmployeeProfile from '../models/EmployeeProfile.js';
import Notification from '../models/Notification.js';
import { canActOn } from '../utils/authorize.js';
import User from '../models/User.js';
import recordAudit from '../utils/audit.js';

const privateUploadDirectory = path.resolve(process.cwd(), 'private_uploads');
const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

export async function uploadProfileDocuments(req, res) {
  const files = [...(req.files?.documents || []), ...(req.files?.profileImage || [])];
  if (!files.length) return res.status(400).json({ message: 'At least one document is required' });
  await fs.mkdir(privateUploadDirectory, { recursive: true });
  const stored = [];
  for (const [index, file] of files.entries()) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) return res.status(400).json({ message: 'Unsupported document type' });
    const storageName = `${crypto.randomUUID()}${extension}`;
    await fs.writeFile(path.join(privateUploadDirectory, storageName), file.buffer, { flag: 'wx' });
    stored.push({
      type: file.fieldname === 'profileImage' ? 'passportPhoto' : (Array.isArray(req.body.documentType) ? req.body.documentType[index] : req.body.documentType || 'document'),
      url: `private_uploads/${storageName}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      expiresAt: req.body.expiryDate && !Number.isNaN(new Date(req.body.expiryDate).getTime()) ? new Date(req.body.expiryDate) : undefined,
    });
  }
  const profile = await EmployeeProfile.findOneAndUpdate(
    { companyId: req.user.companyId, userId: req.user.id },
    { $push: { documents: { $each: stored } } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return res.status(201).json({ documents: stored, profile });
}

export async function listEmployeeDocuments(req, res) {
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.params.userId }).populate('userId', 'name email role');
  if (!profile) return res.status(404).json({ message: 'Employee profile not found' });
  if (String(profile.userId._id) !== String(req.user.id) && !canActOn(req.user, profile.userId.role)) return res.status(403).json({ message: 'Document access denied' });
  return res.status(200).json({ documents: profile.documents, employee: profile.userId });
}

export async function verifyEmployeeDocument(req, res) {
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.params.userId }).populate('userId', 'role');
  if (!profile) return res.status(404).json({ message: 'Employee profile not found' });
  if (!canActOn(req.user, profile.userId.role)) return res.status(403).json({ message: 'Document verification denied' });
  const document = profile.documents.id ? profile.documents.id(req.params.documentId) : null;
  if (!document) return res.status(404).json({ message: 'Document not found' });
  document.verified = Boolean(req.body.verified);
  document.verifiedAt = document.verified ? new Date() : undefined;
  document.verifiedBy = document.verified ? req.user.id : undefined;
  await profile.save();
  await recordAudit(req, 'employee_document_verification_updated', { companyId: req.user.companyId, entityId: profile.userId._id, module: 'documents', newValue: { documentId: req.params.documentId, verified: document.verified } });
  return res.status(200).json({ message: 'Document verification updated', document });
}

// Reviewer asks the employee to re-upload the documents that are not yet
// verified — sends them one in-app notification listing exactly which ones.
export async function requestDocumentReupload(req, res) {
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.params.userId }).populate('userId', 'name role');
  if (!profile) return res.status(404).json({ message: 'Employee profile not found' });
  if (!canActOn(req.user, profile.userId.role)) return res.status(403).json({ message: 'Not allowed to request documents for this employee' });

  const unverified = (profile.documents || []).filter((document) => !document.verified);
  if (unverified.length === 0) return res.status(400).json({ message: 'Every document is already verified' });

  const names = unverified.map((document) => document.originalName || document.type).filter(Boolean);
  const note = String(req.body?.note || '').trim();

  await Notification.create({
    companyId: req.user.companyId,
    recipientId: profile.userId._id,
    type: 'DOCUMENT_REUPLOAD_REQUESTED',
    title: 'Please re-upload your onboarding documents',
    message: `These document(s) could not be verified and need to be re-uploaded: ${names.join(', ')}.${note ? ` Reviewer note: ${note}` : ''}`,
    link: '/employee/onboarding',
  });
  await recordAudit(req, 'document_reupload_requested', { companyId: req.user.companyId, entityId: profile.userId._id, module: 'documents', newValue: { count: unverified.length, documents: names } });

  return res.status(200).json({ message: `${profile.userId.name} was asked to re-upload ${unverified.length} document(s)`, count: unverified.length, documents: names });
}

export async function deleteEmployeeDocument(req, res) {
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, userId: req.params.userId }).populate('userId', 'role');
  if (!profile) return res.status(404).json({ message: 'Employee profile not found' });
  if (String(profile.userId._id) !== String(req.user.id) && !canActOn(req.user, profile.userId.role)) return res.status(403).json({ message: 'Document deletion denied' });
  const document = profile.documents.id ? profile.documents.id(req.params.documentId) : null;
  if (!document) return res.status(404).json({ message: 'Document not found' });
  const filePath = path.resolve(process.cwd(), document.url);
  await fs.unlink(filePath).catch(() => undefined);
  profile.documents.pull(req.params.documentId);
  await profile.save();
  await recordAudit(req, 'employee_document_deleted', { companyId: req.user.companyId, entityId: profile.userId._id, module: 'documents' });
  return res.status(200).json({ message: 'Document deleted' });
}

export async function downloadPrivateDocument(req, res) {
  const storageName = path.basename(req.params.storageName);
  const profile = await EmployeeProfile.findOne({ companyId: req.user.companyId, 'documents.url': `private_uploads/${storageName}` }).populate('userId', 'role');
  if (!profile) return res.status(404).json({ message: 'Document not found' });
  if (String(profile.userId._id) !== String(req.user.id) && !canActOn(req.user, profile.userId.role)) return res.status(403).json({ message: 'Document access denied' });
  const filePath = path.join(privateUploadDirectory, storageName);
  try {
    await fs.access(filePath);
    return res.download(filePath);
  } catch {
    return res.status(404).json({ message: 'Document file not found' });
  }
}
