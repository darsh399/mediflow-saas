import Visit from '../models/Visit.js';
import Doctor from '../models/Doctor.js';
import Medical from '../models/Medical.js';
import calculateDistance from '../utils/calculateDistance.js';

const RADIUS_METERS = Number(process.env.VISIT_RADIUS_METERS || 15);

export const createVisit = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const data = { ...(req.body || {}), companyId, createdBy: req.user?.id };
    const visit = new Visit(data);
    await visit.save();
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
    if (typeof currentLatitude !== 'number' || typeof currentLongitude !== 'number') return res.status(400).json({ message: 'currentLatitude and currentLongitude are required and must be numbers' });

    const doctor = await Doctor.findOne({ _id: doctorId, companyId });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (typeof doctor.latitude !== 'number' || typeof doctor.longitude !== 'number') return res.status(400).json({ message: 'Doctor does not have a registered location' });

    const distance = calculateDistance(currentLatitude, currentLongitude, doctor.latitude, doctor.longitude);
    const distanceMeters = Number(distance.toFixed(3));
    if (distanceMeters > RADIUS_METERS) {
      return res.status(400).json({ success: false, message: `Location not matched. You must be within ${RADIUS_METERS} meters of the registered location.`, distanceInMeters: distanceMeters, allowedRadiusMeters: RADIUS_METERS });
    }

    const visit = new Visit({ companyId, employeeId, doctorId, purpose, notes, visitLatitude: currentLatitude, visitLongitude: currentLongitude, registeredLatitude: doctor.latitude, registeredLongitude: doctor.longitude, distanceInMeters: distanceMeters, locationVerified: true, visitedAt: new Date(), createdBy: employeeId });
    await visit.save();
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
    if (typeof currentLatitude !== 'number' || typeof currentLongitude !== 'number') return res.status(400).json({ message: 'currentLatitude and currentLongitude are required and must be numbers' });

    const med = await Medical.findOne({ _id: medicalId, companyId });
    if (!med) return res.status(404).json({ message: 'Medical not found' });
    if (typeof med.latitude !== 'number' || typeof med.longitude !== 'number') return res.status(400).json({ message: 'Medical does not have a registered location' });

    const distance = calculateDistance(currentLatitude, currentLongitude, med.latitude, med.longitude);
    const distanceMeters = Number(distance.toFixed(3));
    if (distanceMeters > RADIUS_METERS) {
      return res.status(400).json({ success: false, message: `Location not matched. You must be within ${RADIUS_METERS} meters of the registered location.`, distanceInMeters: distanceMeters, allowedRadiusMeters: RADIUS_METERS });
    }

    const visit = new Visit({ companyId, employeeId, medicalId, purpose, notes, visitLatitude: currentLatitude, visitLongitude: currentLongitude, registeredLatitude: med.latitude, registeredLongitude: med.longitude, distanceInMeters: distanceMeters, locationVerified: true, visitedAt: new Date(), createdBy: employeeId });
    await visit.save();
    return res.status(201).json({ success: true, message: 'Visit successfully recorded', distanceInMeters: distanceMeters, visit });
  } catch (error) {
    console.error('Medical visit error:', error);
    return res.status(500).json({ message: 'Error recording medical visit', error: error.message });
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

export const updateVisit = async (req, res) => {
  try {
    const id = req.params.id;
    const companyId = req.user?.companyId;
    const updated = await Visit.findOneAndUpdate(companyId ? { _id: id, companyId } : { _id: id }, req.body, { new: true });
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

export default { createVisit, listVisits, getVisit, updateVisit, deleteVisit };
