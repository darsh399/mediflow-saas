import Visit from '../models/Visit.js';
import Doctor from '../models/Doctor.js';
import Medical from '../models/Medical.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import calculateDistance from '../utils/calculateDistance.js';
import recordAudit from '../utils/audit.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { canActOn } from '../utils/authorize.js';
import { resolveDateRange as getVisitDateRange } from '../utils/dateRange.js';

const privateUploadDirectory = path.resolve(process.cwd(), 'private_uploads');
const allowedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function saveVisitPhoto(file) {
  if (!file) return undefined;
  if (!allowedPhotoTypes.has(file.mimetype)) throw new Error('Visit photo must be JPG, PNG, or WEBP');
  await fs.mkdir(privateUploadDirectory, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
  const storageName = `${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(privateUploadDirectory, storageName), file.buffer, { flag: 'wx' });
  return { storageName, originalName: file.originalname, mimeType: file.mimetype, size: file.size };
}

function parseCoordinate(value, field, minimum, maximum) {
  const coordinate = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) throw new Error(`${field} is required and must be a valid number`)
  return coordinate
}

const RADIUS_METERS = Number(process.env.VISIT_RADIUS_METERS || 90);
const COMPANY_VISIT_ROLES = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager', 'project_manager'];

function canViewEmployeeVisitRecords(user) {
  return COMPANY_VISIT_ROLES.includes(user?.role);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const createVisit = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const data = { ...(req.body || {}), companyId, createdBy: req.user?.id };
    const visit = new Visit(data);
    await visit.save();
    await recordAudit(req, 'visit_created', { companyId, entityId: visit._id, module: 'visits', newValue: { status: visit.status, employeeId: visit.employeeId } });
    return res.status(201).json({ message: 'Visit created', visit });
  } catch (error) {
    console.error('Create visit error:', error);
    return res.status(500).json({ message: 'Error creating visit', error: error.message });
  }
};

// Employee/ MR visits a doctor: verify location and create visit only if within allowed radius
export const doctorVisit = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.id;
    const { doctorId, currentLatitude, currentLongitude, purpose, notes } = req.body;
    if (!doctorId) return res.status(400).json({ message: 'doctorId is required' });
    const latitude = parseCoordinate(currentLatitude, 'currentLatitude', -90, 90);
    const longitude = parseCoordinate(currentLongitude, 'currentLongitude', -180, 180);

    const doctor = await Doctor.findOne({ _id: doctorId, companyId });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (typeof doctor.latitude !== 'number' || typeof doctor.longitude !== 'number') return res.status(400).json({ message: 'Doctor does not have a registered location' });

    const distance = calculateDistance(latitude, longitude, doctor.latitude, doctor.longitude);
    const distanceMeters = Number(distance.toFixed(3));
    if (distanceMeters > RADIUS_METERS) {
      return res.status(400).json({ success: false, message: `Location not matched. You must be within ${RADIUS_METERS} meters of the registered location.`, distanceInMeters: distanceMeters, allowedRadiusMeters: RADIUS_METERS });
    }

    const visit = new Visit({ companyId, employeeId, doctorId, purpose, notes, visitLatitude: latitude, visitLongitude: longitude, registeredLatitude: doctor.latitude, registeredLongitude: doctor.longitude, distanceInMeters: distanceMeters, locationVerified: true, visitedAt: new Date(), createdBy: employeeId, visitPhoto: await saveVisitPhoto(req.file) });
    await visit.save();
    await recordAudit(req, 'visit_created', { companyId, entityId: visit._id, module: 'visits', newValue: { status: visit.status, employeeId } });
    return res.status(201).json({ success: true, message: 'Visit successfully recorded', distanceInMeters: distanceMeters, visit });
  } catch (error) {
    console.error('Doctor visit error:', error);
    return res.status(500).json({ message: 'Error recording doctor visit', error: error.message });
  }
};

// Employee visits a medical/shop
export const medicalVisit = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.id;
    const { medicalId, currentLatitude, currentLongitude, purpose, notes } = req.body;
    if (!medicalId) return res.status(400).json({ message: 'medicalId is required' });
    const latitude = parseCoordinate(currentLatitude, 'currentLatitude', -90, 90);
    const longitude = parseCoordinate(currentLongitude, 'currentLongitude', -180, 180);

    const med = await Medical.findOne({ _id: medicalId, companyId });
    if (!med) return res.status(404).json({ message: 'Medical not found' });
    if (typeof med.latitude !== 'number' || typeof med.longitude !== 'number') return res.status(400).json({ message: 'Medical does not have a registered location' });

    const distance = calculateDistance(latitude, longitude, med.latitude, med.longitude);
    const distanceMeters = Number(distance.toFixed(3));
    if (distanceMeters > RADIUS_METERS) {
      return res.status(400).json({ success: false, message: `Location not matched. You must be within ${RADIUS_METERS} meters of the registered location.`, distanceInMeters: distanceMeters, allowedRadiusMeters: RADIUS_METERS });
    }

    const visit = new Visit({ companyId, employeeId, medicalId, purpose, notes, visitLatitude: latitude, visitLongitude: longitude, registeredLatitude: med.latitude, registeredLongitude: med.longitude, distanceInMeters: distanceMeters, locationVerified: true, visitedAt: new Date(), createdBy: employeeId, visitPhoto: await saveVisitPhoto(req.file) });
    await visit.save();
    await recordAudit(req, 'visit_created', { companyId, entityId: visit._id, module: 'visits', newValue: { status: visit.status, employeeId } });
    return res.status(201).json({ success: true, message: 'Visit successfully recorded', distanceInMeters: distanceMeters, visit });
  } catch (error) {
    console.error('Medical visit error:', error);
    return res.status(500).json({ message: 'Error recording medical visit', error: error.message });
  }
};

export const listEmployeeVisitSummary = async (req, res) => {
  try {
    if (!canViewEmployeeVisitRecords(req.user)) return res.status(403).json({ message: 'Insufficient permissions to view employee visit records' });
    const { start, end, startDate, endDate } = getVisitDateRange(req.query);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = String(req.query.search || '').trim();
    const employeeMatch = {
      companyId: req.user.companyId,
      role: { $nin: ['admin', 'company_owner', 'super_admin', 'superadmin'] },
    };
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      employeeMatch.$or = [{ name: pattern }, { firstName: pattern }, { lastName: pattern }, { employeeId: pattern }, { email: pattern }, { $expr: { $regexMatch: { input: { $concat: [{ $ifNull: ['$firstName', ''] }, ' ', { $ifNull: ['$lastName', ''] }] }, regex: escapeRegex(search), options: 'i' } } }];
    }
    const sortBy = ['name', 'employeeId', 'visitCount', 'lastVisit'].includes(req.query.sortBy) ? req.query.sortBy : 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder, _id: 1 };
    const [result] = await User.aggregate([
      { $match: employeeMatch },
      { $lookup: { from: 'visits', let: { employeeId: '$_id', companyId: '$companyId' }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$companyId', '$$companyId'] }, { $eq: ['$employeeId', '$$employeeId'] }, { $gte: ['$visitedAt', startDate] }, { $lt: ['$visitedAt', endDate] }] } } }, { $sort: { visitedAt: -1 } }, { $project: { visitedAt: 1 } }], as: 'periodVisits' } },
      { $addFields: { visitCount: { $size: '$periodVisits' }, lastVisit: { $arrayElemAt: ['$periodVisits.visitedAt', 0] } } },
      { $facet: { employees: [{ $sort: sort }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _id: 1, name: 1, firstName: 1, lastName: 1, employeeId: 1, email: 1, role: 1, active: 1, visitCount: 1, lastVisit: 1 } }], metadata: [{ $count: 'total' }] } },
    ]);
    const total = result?.metadata?.[0]?.total || 0;
    return res.status(200).json({ employees: result?.employees || [], dateRange: { startDate: start, endDate: end }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Employee visit summary error:', error);
    return res.status(400).json({ message: error.message || 'Unable to load employee visit summary' });
  }
};

export const listTopPerformers = async (req, res) => {
  try {
    if (!canViewEmployeeVisitRecords(req.user)) return res.status(403).json({ message: 'Insufficient permissions to view top performers' });
    const { start, end, startDate, endDate } = getVisitDateRange(req.query);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
    const employeeMatch = { companyId: req.user.companyId, role: { $nin: ['admin', 'company_owner', 'super_admin', 'superadmin'] } };
    const ranked = await User.aggregate([
      { $match: employeeMatch },
      { $lookup: { from: 'visits', let: { employeeId: '$_id', companyId: '$companyId' }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$companyId', '$$companyId'] }, { $eq: ['$employeeId', '$$employeeId'] }, { $gte: ['$visitedAt', startDate] }, { $lt: ['$visitedAt', endDate] }] } } }, { $project: { status: 1 } }], as: 'periodVisits' } },
      { $addFields: { visitCount: { $size: '$periodVisits' }, completedCount: { $size: { $filter: { input: '$periodVisits', as: 'visit', cond: { $in: ['$$visit.status', ['completed', 'approved']] } } } } } },
      { $match: { visitCount: { $gt: 0 } } },
      { $sort: { completedCount: -1, visitCount: -1, name: 1 } },
      { $project: { _id: 1, name: 1, firstName: 1, lastName: 1, employeeId: 1, email: 1, role: 1, visitCount: 1, completedCount: 1 } },
    ]);
    const topPerformers = ranked.slice(0, limit).map((item, index) => ({ ...item, rank: index + 1 }));

    let employee = null;
    if (req.query.employeeId) {
      if (!mongoose.isValidObjectId(req.query.employeeId)) return res.status(400).json({ message: 'Invalid employee id' });
      const index = ranked.findIndex((item) => String(item._id) === String(req.query.employeeId));
      if (index >= 0) employee = { ...ranked[index], rank: index + 1 };
      else {
        const found = await User.findOne({ _id: req.query.employeeId, ...employeeMatch }).select('_id name firstName lastName employeeId email role').lean();
        if (!found) return res.status(404).json({ message: 'Employee not found in this company' });
        employee = { ...found, visitCount: 0, completedCount: 0, rank: null };
      }
    }

    return res.status(200).json({ topPerformers, employee, totalRanked: ranked.length, dateRange: { startDate: start, endDate: end } });
  } catch (error) {
    console.error('Top performers error:', error);
    return res.status(400).json({ message: error.message || 'Unable to load top performers' });
  }
};

export const listEmployeeVisits = async (req, res) => {
  try {
    if (!canViewEmployeeVisitRecords(req.user)) return res.status(403).json({ message: 'Insufficient permissions to view employee visit records' });
    if (!mongoose.isValidObjectId(req.params.employeeId)) return res.status(400).json({ message: 'Invalid employee id' });
    const employee = await User.findOne({ _id: req.params.employeeId, companyId: req.user.companyId, role: { $nin: ['admin', 'company_owner', 'super_admin', 'superadmin'] } }).select('_id name firstName lastName employeeId email role active').lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found in this company' });
    const { start, end, startDate, endDate } = getVisitDateRange(req.query);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = { companyId: req.user.companyId, employeeId: employee._id, visitedAt: { $gte: startDate, $lt: endDate } };
    const [visits, total] = await Promise.all([
      Visit.find(filter).populate('doctorId', 'name specialty phone').populate('medicalId', 'name address phone').sort({ visitedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Visit.countDocuments(filter),
    ]);
    return res.status(200).json({ employee, visits, dateRange: { startDate: start, endDate: end }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Employee visit history error:', error);
    return res.status(400).json({ message: error.message || 'Unable to load employee visit history' });
  }
};

export const getVisitCalendarSummary = async (req, res) => {
  try {
    if (!canViewEmployeeVisitRecords(req.user)) return res.status(403).json({ message: 'Insufficient permissions to view visit calendar' });
    const { startDate, endDate } = getVisitDateRange({ startDate: req.query.startDate, endDate: req.query.endDate });
    const match = { companyId: req.user.companyId, visitedAt: { $gte: startDate, $lt: endDate } };
    if (req.query.employeeId) {
      if (!mongoose.isValidObjectId(req.query.employeeId)) return res.status(400).json({ message: 'Invalid employee id' });
      const employee = await User.exists({ _id: req.query.employeeId, companyId: req.user.companyId, role: { $nin: ['admin', 'company_owner', 'super_admin', 'superadmin'] } });
      if (!employee) return res.status(404).json({ message: 'Employee not found in this company' });
      match.employeeId = new mongoose.Types.ObjectId(req.query.employeeId);
    }
    const visits = await Visit.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt', timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata' } }, count: { $sum: 1 } } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
      { $sort: { date: 1 } },
    ]);
    return res.status(200).json({ visits });
  } catch (error) {
    console.error('Visit calendar summary error:', error);
    return res.status(400).json({ message: error.message || 'Unable to load visit calendar' });
  }
};

export const listVisits = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const query = companyId ? { companyId } : {};

    const visits = await Visit.find(query)
      .populate('employeeId', 'name email role')
      .populate('doctorId', 'name specialty phone')
      .populate('medicalId', 'name address phone')
      .sort({ visitedAt: -1 });

    return res.status(200).json({ visits });
  } catch (error) {
    console.error('List visits error:', error);
    return res.status(500).json({
      message: 'Error listing visits',
      error: error.message
    });
  }
};

export const getVisit = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const visit = await Visit.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    return res.status(200).json({ visit });
  } catch (error) {
    console.error('Get visit error:', error);
    return res.status(500).json({ message: 'Error fetching visit', error: error.message });
  }
};

export const downloadVisitPhoto = async (req, res) => {
  const visit = await Visit.findOne({ _id: req.params.id, companyId: req.user.companyId }).populate('employeeId', 'role');
  if (!visit?.visitPhoto?.storageName) return res.status(404).json({ message: 'Visit photo not found' });
  if (String(visit.employeeId?._id) !== String(req.user.id) && !canActOn(req.user, visit.employeeId?.role)) return res.status(403).json({ message: 'Visit photo access denied' });
  const filePath = path.join(privateUploadDirectory, path.basename(visit.visitPhoto.storageName));
  try { await fs.access(filePath); return res.download(filePath, visit.visitPhoto.originalName || 'visit-photo'); } catch { return res.status(404).json({ message: 'Visit photo file not found' }); }
};

export const visitSummary = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const to = req.query.to ? new Date(req.query.to) : new Date(from);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return res.status(400).json({ message: 'Invalid date range' });
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    if (to < from) return res.status(400).json({ message: 'End date cannot be before start date' });
    const match = { companyId: req.user.companyId, visitedAt: { $gte: from, $lte: to } };
    if (req.query.employeeId) match.employeeId = req.query.employeeId;
    const [summary] = await Visit.aggregate([
      { $match: match },
      { $group: { _id: null, totalVisits: { $sum: 1 }, successfulVisits: { $sum: { $cond: [{ $in: ['$status', ['completed', 'approved']] }, 1, 0] } }, failedVisits: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'rejected']] }, 1, 0] } }, doctorVisits: { $sum: { $cond: [{ $ne: ['$doctorId', null] }, 1, 0] } }, medicalVisits: { $sum: { $cond: [{ $ne: ['$medicalId', null] }, 1, 0] } }, verifiedVisits: { $sum: { $cond: ['$locationVerified', 1, 0] } }, distanceTravelledMeters: { $sum: { $ifNull: ['$distanceInMeters', 0] } } } },
      { $project: { _id: 0, totalVisits: 1, successfulVisits: 1, failedVisits: 1, doctorVisits: 1, medicalVisits: 1, verifiedVisits: 1, distanceTravelledMeters: { $round: ['$distanceTravelledMeters', 2] } } },
    ]);
    return res.status(200).json({ from, to, summary: summary || { totalVisits: 0, successfulVisits: 0, failedVisits: 0, doctorVisits: 0, medicalVisits: 0, verifiedVisits: 0, distanceTravelledMeters: 0 } });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateVisit = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const existing = await Visit.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!existing) return res.status(404).json({ message: 'Visit not found' });
    const oldValue = { status: existing.status, rejectionReason: existing.rejectionReason };
    const allowed = ['status', 'rejectionReason', 'purpose', 'notes'];
    for (const field of allowed) if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) existing[field] = req.body[field];
    if (existing.status === 'approved') { existing.approvedBy = req.user.id; existing.approvedAt = new Date(); }
    const updated = await existing.save();
    await recordAudit(req, 'visit_updated', { companyId, entityId: updated._id, module: 'visits', oldValue, newValue: { status: updated.status, rejectionReason: updated.rejectionReason } });
    if (!updated) return res.status(404).json({ message: 'Visit not found' });
    return res.status(200).json({ visit: updated });
  } catch (error) {
    console.error('Update visit error:', error);
    return res.status(500).json({ message: 'Error updating visit', error: error.message });
  }
};

export const deleteVisit = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const deleted = await Visit.findOneAndDelete(companyId ? { _id: id, companyId } : { _id: id });
    if (!deleted) return res.status(404).json({ message: 'Visit not found' });
    return res.status(200).json({ message: 'Visit deleted' });
  } catch (error) {
    console.error('Delete visit error:', error);
    return res.status(500).json({ message: 'Error deleting visit', error: error.message });
  }
};

export default { createVisit, listVisits, getVisit, updateVisit, deleteVisit, downloadVisitPhoto };
