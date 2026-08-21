import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import EmployeeProfile from '../models/EmployeeProfile.js';
import { canActOn } from '../utils/authorize.js';

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
      mimeType: file.mimetype
    });
  }
  const profile = await EmployeeProfile.findOneAndUpdate(
    { companyId: req.user.companyId, userId: req.user.id },
    { $push: { documents: { $each: stored } } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return res.status(201).json({ documents: stored, profile });
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
