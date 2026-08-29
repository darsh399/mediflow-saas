// Row-level validation + creation for the Doctor Excel import.
//
// Kept separate from doctorController.createDoctor on purpose: manual creation
// requires latitude/longitude (and a clinic name); the import only requires
// Doctor Name + City. Everything else is filled in later.
//
// The only rule shared with manual creation is the duplicate check.

import Doctor from '../models/Doctor.js';
import Territory from '../models/Territory.js';
import { parseExcelDate, parseOptionalNumber } from '../utils/doctorExcel.js';

// Only these two are mandatory per row.
const REQUIRED_LABELS = {
  name: 'Doctor Name',
  city: 'City Name',
};

function territoryKey(value) {
  return String(value).trim().toLowerCase();
}

/**
 * @param {{ companyId: any, userId: any, rows: Array<{rowNumber:number, data:object}> }} params
 */
export async function importDoctorRows({ companyId, userId, rows }) {
  const territories = await Territory.find({ companyId }).select('_id name code').lean();
  const byName = new Map(territories.map((t) => [territoryKey(t.name), t]));
  const byCode = new Map(territories.filter((t) => t.code).map((t) => [territoryKey(t.code), t]));

  const summary = { total: rows.length, imported: 0, failed: 0, duplicates: 0, territoriesCreated: [], errors: [], created: [] };

  // Resolve a territory name/code to an id, creating the territory if it is new.
  // Importers are Company Owner / HR Manager, who own territory management, so
  // auto-creating here is within their rights.
  async function resolveOrCreateTerritory(rawValue) {
    const key = territoryKey(rawValue);
    const found = byName.get(key) || byCode.get(key);
    if (found) return found._id;
    const name = String(rawValue).trim();
    try {
      const created = await Territory.create({ companyId, name, createdBy: userId });
      const lean = { _id: created._id, name: created.name, code: created.code };
      byName.set(territoryKey(created.name), lean);
      if (created.code) byCode.set(territoryKey(created.code), lean);
      summary.territoriesCreated.push(name);
      return created._id;
    } catch (error) {
      // Unique-index race: another row in this same import already created it.
      if (error?.code === 11000) {
        const again = await Territory.findOne({ companyId, name }).select('_id name code').lean();
        if (again) {
          byName.set(territoryKey(again.name), again);
          return again._id;
        }
      }
      throw error;
    }
  }

  for (const { rowNumber, data } of rows) {
    const rowErrors = [];

    for (const [field, label] of Object.entries(REQUIRED_LABELS)) {
      if (!data[field] || !String(data[field]).trim()) rowErrors.push(`${label} is required`);
    }

    const dob = parseExcelDate(data.dateOfBirth);
    if (dob.error) rowErrors.push('DOB is not a valid date');

    const lat = parseOptionalNumber(data.latitude, { min: -90, max: 90 });
    const lng = parseOptionalNumber(data.longitude, { min: -180, max: 180 });
    const alt = parseOptionalNumber(data.altitude);
    if (lat.error) rowErrors.push('Latitude must be a number between -90 and 90');
    if (lng.error) rowErrors.push('Longitude must be a number between -180 and 180');
    if (alt.error) rowErrors.push('Altitude must be a number');
    const hasLat = lat.value !== null && lat.value !== undefined;
    const hasLng = lng.value !== null && lng.value !== undefined;
    if (hasLat !== hasLng) rowErrors.push('Latitude and Longitude must be provided together');

    if (rowErrors.length) {
      summary.failed += 1;
      summary.errors.push({ row: rowNumber, message: rowErrors.join('; ') });
      continue;
    }

    const name = String(data.name).trim();
    const clinicName = data.clinicName ? String(data.clinicName).trim() : '';

    // Duplicate rule: name + clinic when a clinic is given, otherwise name alone.
    const dupQuery = { companyId, name };
    if (clinicName) dupQuery.clinicName = clinicName;
    const existing = await Doctor.findOne(dupQuery).select('_id').lean();
    if (existing) {
      summary.duplicates += 1;
      const where = clinicName ? ` at "${clinicName}"` : '';
      summary.errors.push({ row: rowNumber, message: `Doctor "${name}"${where} already exists`, duplicate: true });
      continue;
    }

    let territoryId = null;
    if (data.territory && String(data.territory).trim()) {
      try {
        territoryId = await resolveOrCreateTerritory(data.territory);
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({ row: rowNumber, message: `Could not resolve territory "${String(data.territory).trim()}": ${error.message}` });
        continue;
      }
    }

    const doc = { companyId, createdBy: userId, name, city: String(data.city).trim(), territoryId };
    if (clinicName) doc.clinicName = clinicName;
    if (data.district) doc.district = String(data.district).trim();
    if (data.address) doc.address = String(data.address).trim();
    if (data.state) doc.state = String(data.state).trim();
    if (data.specialty) doc.specialty = String(data.specialty).trim();
    if (data.phone) doc.phone = String(data.phone).trim();
    if (data.email) doc.email = String(data.email).trim();
    if (dob.date) doc.dateOfBirth = dob.date;
    if (hasLat && hasLng) { doc.latitude = lat.value; doc.longitude = lng.value; }
    if (alt.value !== null && alt.value !== undefined) doc.altitude = alt.value;

    try {
      const created = await Doctor.create(doc);
      summary.imported += 1;
      summary.created.push(created._id);
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({ row: rowNumber, message: error?.message || 'Could not save this row' });
    }
  }

  return summary;
}

export default { importDoctorRows };
