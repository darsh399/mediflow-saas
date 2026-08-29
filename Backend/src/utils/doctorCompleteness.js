// Shared definition of "what makes a doctor record complete".
//
// Excel-imported doctors are allowed to exist with only the five mandatory
// fields; the remaining details are filled in later (usually by the MR who
// actually visits the clinic). This helper is the single source of truth for
// which optional fields are still missing so the list page, the detail page
// and the "complete details" form all agree.

// Fields an authorised user is allowed to fill in later via the completion flow.
// Deliberately a whitelist — completion must never touch name / clinic / tier /
// consent / territory etc.
export const COMPLETABLE_FIELDS = ['address', 'city', 'district', 'state', 'dateOfBirth', 'phone', 'latitude', 'longitude', 'altitude'];

export function doctorMissingFields(doctor) {
  if (!doctor) return [];
  const missing = [];
  if (!doctor.address || !String(doctor.address).trim()) missing.push('address');
  if (!doctor.dateOfBirth) missing.push('dateOfBirth');
  if (typeof doctor.latitude !== 'number' || typeof doctor.longitude !== 'number') missing.push('location');
  return missing;
}

export function doctorCompleteness(doctor) {
  const missing = doctorMissingFields(doctor);
  return {
    complete: missing.length === 0,
    missing,
    // A doctor with no registered coordinates cannot be visited (the 15m/
    // radius check has nothing to compare against) — surface that separately.
    needsLocation: missing.includes('location'),
  };
}

export default { doctorCompleteness, doctorMissingFields, COMPLETABLE_FIELDS };
