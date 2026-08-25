import Doctor from '../models/Doctor.js';

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('dateOfBirth must be a valid date');
  return date;
}

export const createDoctor = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { name, clinicName, latitude, longitude, phone, specialty, email, dateOfBirth } = req.body;
    if (!name || !clinicName) return res.status(400).json({ message: 'name and clinicName are required' });
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return res.status(400).json({ message: 'latitude and longitude are required and must be numbers' });

    // duplicate check within company
    const dup = await Doctor.findOne({ companyId, name: name.trim(), clinicName: clinicName.trim() });
    if (dup) return res.status(409).json({ message: 'Doctor with same name and clinic already exists' });

    const parsedDateOfBirth = parseOptionalDate(dateOfBirth);
    const data = { name: name.trim(), clinicName: clinicName.trim(), latitude, longitude, phone, specialty, email, companyId, createdBy: req.user?.id };
    if (parsedDateOfBirth) data.dateOfBirth = parsedDateOfBirth;
    const doc = new Doctor(data);
    await doc.save();
    return res.status(201).json({ message: 'Doctor created', doctor: doc });
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
    const docs = await Doctor.find(query);
    return res.status(200).json({ doctors: docs });
  } catch (error) {
    console.error('List doctors error:', error);
    return res.status(500).json({ message: 'Error listing doctors', error: error.message });
  }
};

export const getDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const doc = await Doctor.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });
    return res.status(200).json({ doctor: doc });
  } catch (error) {
    console.error('Get doctor error:', error);
    return res.status(500).json({ message: 'Error fetching doctor', error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const allowedFields = ['name', 'clinicName', 'latitude', 'longitude', 'phone', 'specialty', 'email', 'active'];
    const update = Object.fromEntries(allowedFields.filter((field) => req.body?.[field] !== undefined).map((field) => [field, req.body[field]]));
    if (req.body?.dateOfBirth !== undefined) update.dateOfBirth = parseOptionalDate(req.body.dateOfBirth);
    const updated = await Doctor.findOneAndUpdate(companyId ? { _id: id, companyId } : { _id: id }, update, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Doctor not found' });
    return res.status(200).json({ doctor: updated });
  } catch (error) {
    console.error('Update doctor error:', error);
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

export default { createDoctor, listDoctors, getDoctor, updateDoctor, deleteDoctor };
