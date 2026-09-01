import Medical from '../models/Medical.js';
import { sendCsv } from '../utils/csv.js';

export const createMedical = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { name, contactPerson, mobile, email, licenseNumber, address, area, city, latitude, longitude, territoryId } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return res.status(400).json({ message: 'latitude and longitude are required and must be numbers' });
    // duplicate check
    const dup = await Medical.findOne({ companyId, name: name.trim(), address });
    if (dup) return res.status(409).json({ message: 'Medical/shop with same name/address already exists' });
    const med = new Medical({ name: name.trim(), contactPerson, mobile, email, licenseNumber, address, area, city, latitude, longitude, companyId, createdBy: req.user?.id });
    if (territoryId) med.territoryId = territoryId;
    await med.save();
    return res.status(201).json({ message: 'Medical created', medical: med });
  } catch (error) {
    console.error('Create medical error:', error);
    return res.status(500).json({ message: 'Error creating medical', error: error.message });
  }
};

export const listMedicals = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const query = companyId ? { companyId } : {};
    if (req.query?.unassigned === 'true') query.territoryId = null;
    else if (req.query?.territoryId) query.territoryId = req.query.territoryId;
    if (req.query.summary === 'true') return res.status(200).json({ medicals: [], pagination: { page: 1, limit: 0, total: await Medical.countDocuments(query), totalPages: 1 } });
    const meds = await Medical.find(query).populate('territoryId', 'name code');
    return res.status(200).json({ medicals: meds });
  } catch (error) {
    console.error('List medicals error:', error);
    return res.status(500).json({ message: 'Error listing medicals', error: error.message });
  }
};

// Company-scoped CSV of the medical/chemist directory.
export const exportMedicals = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const query = companyId ? { companyId } : {};
    if (req.query?.unassigned === 'true') query.territoryId = null;
    else if (req.query?.territoryId) query.territoryId = req.query.territoryId;
    const meds = await Medical.find(query).populate('territoryId', 'name code').sort({ name: 1 }).lean();
    const columns = [
      { label: 'Name', value: (m) => m.name },
      { label: 'Contact Person', value: (m) => m.contactPerson },
      { label: 'Mobile', value: (m) => m.mobile },
      { label: 'Email', value: (m) => m.email },
      { label: 'License Number', value: (m) => m.licenseNumber },
      { label: 'Address', value: (m) => m.address },
      { label: 'Area', value: (m) => m.area },
      { label: 'City', value: (m) => m.city },
      { label: 'Latitude', value: (m) => m.latitude },
      { label: 'Longitude', value: (m) => m.longitude },
      { label: 'Territory', value: (m) => m.territoryId?.name || '' },
      { label: 'Created At', value: (m) => (m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : '') },
    ];
    return sendCsv(res, `medicals-${new Date().toISOString().slice(0, 10)}.csv`, meds, columns);
  } catch (error) {
    console.error('Export medicals error:', error);
    return res.status(500).json({ message: 'Error exporting medicals', error: error.message });
  }
};

export const getMedical = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const med = await Medical.findOne(companyId ? { _id: id, companyId } : { _id: id }).populate('territoryId', 'name code');
    if (!med) return res.status(404).json({ message: 'Medical not found' });
    return res.status(200).json({ medical: med });
  } catch (error) {
    console.error('Get medical error:', error);
    return res.status(500).json({ message: 'Error fetching medical', error: error.message });
  }
};

const UPDATABLE_MEDICAL_FIELDS = ['name', 'contactPerson', 'mobile', 'email', 'licenseNumber', 'address', 'area', 'city', 'latitude', 'longitude'];

export const updateMedical = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const update = Object.fromEntries(UPDATABLE_MEDICAL_FIELDS.filter((field) => req.body?.[field] !== undefined).map((field) => [field, req.body[field]]));
    if (req.body?.territoryId !== undefined) update.territoryId = req.body.territoryId || null;
    const updated = await Medical.findOneAndUpdate(companyId ? { _id: id, companyId } : { _id: id }, update, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Medical not found' });
    return res.status(200).json({ medical: updated });
  } catch (error) {
    console.error('Update medical error:', error);
    return res.status(500).json({ message: 'Error updating medical', error: error.message });
  }
};

export const deleteMedical = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const deleted = await Medical.findOneAndDelete(companyId ? { _id: id, companyId } : { _id: id });
    if (!deleted) return res.status(404).json({ message: 'Medical not found' });
    return res.status(200).json({ message: 'Medical deleted' });
  } catch (error) {
    console.error('Delete medical error:', error);
    return res.status(500).json({ message: 'Error deleting medical', error: error.message });
  }
};

export default { createMedical, listMedicals, exportMedicals, getMedical, updateMedical, deleteMedical };
