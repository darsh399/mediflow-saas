import Doctor from '../models/Doctor.js';
import { doctorCompleteness } from '../utils/doctorCompleteness.js';

function withCompleteness(doctor) {
  if (!doctor) return doctor;
  const plain = typeof doctor.toObject === 'function' ? doctor.toObject() : doctor;
  return { ...plain, completeness: doctorCompleteness(plain) };
}

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('dateOfBirth must be a valid date');
  return date;
}

export const createDoctor = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { name, clinicName, address, city, district, state, latitude, longitude, altitude, phone, specialty, email, dateOfBirth, territoryId, tier, anniversaryDate } = req.body;
    if (!name || !clinicName) return res.status(400).json({ message: 'name and clinicName are required' });
    // Manual creation keeps its existing requirement: coordinates are mandatory.
    // (The Excel import has its own, looser validation layer and does not go
    // through this controller.)
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return res.status(400).json({ message: 'latitude and longitude are required and must be numbers' });

    // duplicate check within company
    const dup = await Doctor.findOne({ companyId, name: name.trim(), clinicName: clinicName.trim() });
    if (dup) return res.status(409).json({ message: 'Doctor with same name and clinic already exists' });

    const parsedDateOfBirth = parseOptionalDate(dateOfBirth);
    const data = { name: name.trim(), clinicName: clinicName.trim(), address: address?.trim(), city: city?.trim(), district: district?.trim(), state: state?.trim(), latitude, longitude, phone, specialty, email, companyId, createdBy: req.user?.id };
    if (typeof altitude === 'number' && Number.isFinite(altitude)) data.altitude = altitude;
    if (parsedDateOfBirth) data.dateOfBirth = parsedDateOfBirth;
    if (territoryId) data.territoryId = territoryId;
    if (tier && ['A', 'B', 'C', 'UNGRADED'].includes(String(tier).toUpperCase())) data.tier = String(tier).toUpperCase();
    if (anniversaryDate) { const parsed = new Date(anniversaryDate); if (!Number.isNaN(parsed.getTime())) data.anniversaryDate = parsed; }
    const doc = new Doctor(data);
    await doc.save();
    return res.status(201).json({ message: 'Doctor created', doctor: withCompleteness(doc) });
  } catch (error) {
    console.error('Create doctor error:', error);
    if (error.message === 'dateOfBirth must be a valid date') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Error creating doctor', error: error.message });
  }
};

export const listDoctors = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const query = companyId ? { companyId } : {};
    for (const field of ['city', 'district', 'state']) {
      const value = req.query?.[field];
      if (value) query[field] = new RegExp(`^${String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }
    if (req.query?.unassigned === 'true') query.territoryId = null;
    else if (req.query?.territoryId) query.territoryId = req.query.territoryId;
    if (req.query.summary === 'true') return res.status(200).json({ doctors: [], pagination: { page: 1, limit: 0, total: await Doctor.countDocuments(query), totalPages: 1 } });
    const docs = await Doctor.find(query).populate('territoryId', 'name code');
    return res.status(200).json({ doctors: docs.map(withCompleteness) });
  } catch (error) {
    console.error('List doctors error:', error);
    return res.status(500).json({ message: 'Error listing doctors', error: error.message });
  }
};

export const getDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const doc = await Doctor.findOne(companyId ? { _id: id, companyId } : { _id: id }).populate('territoryId', 'name code');
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });
    return res.status(200).json({ doctor: withCompleteness(doc) });
  } catch (error) {
    console.error('Get doctor error:', error);
    return res.status(500).json({ message: 'Error fetching doctor', error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const allowedFields = ['name', 'clinicName', 'address', 'city', 'district', 'state', 'latitude', 'longitude', 'altitude', 'phone', 'specialty', 'email', 'active'];
    const update = Object.fromEntries(allowedFields.filter((field) => req.body?.[field] !== undefined).map((field) => [field, req.body[field]]));
    if (req.body?.dateOfBirth !== undefined) update.dateOfBirth = parseOptionalDate(req.body.dateOfBirth);
    if (req.body?.territoryId !== undefined) update.territoryId = req.body.territoryId || null;
    const updated = await Doctor.findOneAndUpdate(companyId ? { _id: id, companyId } : { _id: id }, update, { new: true, runValidators: true }).populate('territoryId', 'name code');
    if (!updated) return res.status(404).json({ message: 'Doctor not found' });
    return res.status(200).json({ doctor: withCompleteness(updated) });
  } catch (error) {
    console.error('Update doctor error:', error);
    if (error.message === 'dateOfBirth must be a valid date') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Error updating doctor', error: error.message });
  }
};

// Fill in blanks on an existing doctor (typically an Excel-imported record).
// Only currently-empty whitelisted fields are written — existing data is never
// overwritten here, so this can safely be exposed to field roles (MR) without
// giving them full edit rights over name/clinic/territory/CRM.
const isBlank = (value) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && Number.isNaN(value));

export const completeDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const doctor = await Doctor.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const applied = [];
    const skipped = [];
    const errors = [];

    const stringFields = ['address', 'city', 'district', 'state', 'phone'];
    for (const field of stringFields) {
      if (req.body?.[field] === undefined) continue;
      if (!isBlank(doctor[field])) { skipped.push(field); continue; }
      const value = String(req.body[field]).trim();
      if (value) { doctor[field] = value; applied.push(field); }
    }

    if (req.body?.dateOfBirth !== undefined) {
      if (!isBlank(doctor.dateOfBirth)) skipped.push('dateOfBirth');
      else {
        try {
          const parsed = parseOptionalDate(req.body.dateOfBirth);
          if (parsed) { doctor.dateOfBirth = parsed; applied.push('dateOfBirth'); }
        } catch { errors.push('dateOfBirth is not a valid date'); }
      }
    }

    // Coordinates are written as a set.
    const wantsLat = req.body?.latitude !== undefined;
    const wantsLng = req.body?.longitude !== undefined;
    const locationAlreadySet = typeof doctor.latitude === 'number' && typeof doctor.longitude === 'number';
    if (wantsLat || wantsLng) {
      if (locationAlreadySet) {
        skipped.push('latitude', 'longitude');
      } else {
        const lat = Number(req.body.latitude);
        const lng = Number(req.body.longitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
          errors.push('latitude and longitude must both be valid coordinates');
        } else {
          doctor.latitude = lat;
          doctor.longitude = lng;
          applied.push('latitude', 'longitude');
        }
      }
    }

    if (req.body?.altitude !== undefined) {
      if (typeof doctor.altitude === 'number' && !Number.isNaN(doctor.altitude)) {
        skipped.push('altitude');
      } else if (req.body.altitude === null || req.body.altitude === '') {
        // nothing to do
      } else {
        const alt = Number(req.body.altitude);
        if (Number.isFinite(alt)) { doctor.altitude = alt; applied.push('altitude'); }
        else errors.push('altitude must be a number');
      }
    }

    if (errors.length) return res.status(400).json({ message: errors.join('; '), errors });
    if (!applied.length) return res.status(400).json({ message: 'Nothing to update — the provided fields are already filled in or empty', skipped });

    await doctor.save();
    await doctor.populate('territoryId', 'name code');
    return res.status(200).json({ message: 'Doctor details updated', doctor: withCompleteness(doctor), applied, skipped });
  } catch (error) {
    console.error('Complete doctor error:', error);
    if (error.message === 'dateOfBirth must be a valid date') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Error updating doctor', error: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const deleted = await Doctor.findOneAndDelete(companyId ? { _id: id, companyId } : { _id: id });
    if (!deleted) return res.status(404).json({ message: 'Doctor not found' });
    return res.status(200).json({ message: 'Doctor deleted' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return res.status(500).json({ message: 'Error deleting doctor', error: error.message });
  }
};

export default { createDoctor, listDoctors, getDoctor, updateDoctor, completeDoctor, deleteDoctor };
