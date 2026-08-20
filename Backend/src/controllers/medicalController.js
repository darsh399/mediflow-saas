import Medical from '../models/Medical.js';

export const createMedical = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { name, contactPerson, mobile, email, licenseNumber, address, area, city, latitude, longitude } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return res.status(400).json({ message: 'latitude and longitude are required and must be numbers' });
    // duplicate check
    const dup = await Medical.findOne({ companyId, name: name.trim(), address });
    if (dup) return res.status(409).json({ message: 'Medical/shop with same name/address already exists' });
    const med = new Medical({ name: name.trim(), contactPerson, mobile, email, licenseNumber, address, area, city, latitude, longitude, companyId, createdBy: req.user?.id });
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
    const meds = await Medical.find(query);
    return res.status(200).json({ medicals: meds });
  } catch (error) {
    console.error('List medicals error:', error);
    return res.status(500).json({ message: 'Error listing medicals', error: error.message });
  }
};

export const getMedical = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const med = await Medical.findOne(companyId ? { _id: id, companyId } : { _id: id });
    if (!med) return res.status(404).json({ message: 'Medical not found' });
    return res.status(200).json({ medical: med });
  } catch (error) {
    console.error('Get medical error:', error);
    return res.status(500).json({ message: 'Error fetching medical', error: error.message });
  }
};

export const updateMedical = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const updated = await Medical.findOneAndUpdate(companyId ? { _id: id, companyId } : { _id: id }, req.body, { new: true });
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

export default { createMedical, listMedicals, getMedical, updateMedical, deleteMedical };
