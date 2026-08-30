// Excel helpers for the Doctor bulk import.
//
// This is a SEPARATE validation layer from the manual "Add Doctor" controller.
// Manual creation requires latitude/longitude; the Excel import treats them as
// optional and only five fields are mandatory:
//   Doctor Name, Clinic Name, City Name, District Name, Territory
//
// Everything here works on an in-memory buffer (multer memoryStorage) — nothing
// is written to disk.

import * as XLSX from 'xlsx';

// Canonical field -> accepted header spellings (compared case/space-insensitively).
const HEADER_ALIASES = {
  name: ['doctor name', 'name', 'doctorname', 'dr name'],
  clinicName: ['clinic name', 'clinic', 'clinicname', 'hospital name'],
  address: ['current address', 'address', 'currentaddress', 'clinic address'],
  city: ['city name', 'city', 'cityname'],
  district: ['district name', 'district', 'districtname'],
  state: ['state name', 'state', 'statename'],
  dateOfBirth: ['dob', 'date of birth', 'dateofbirth', 'birth date', 'birthdate'],
  territory: ['territory', 'territory name', 'territoryname', 'area'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lng', 'long', 'lon'],
  altitude: ['altitude', 'alt', 'elevation'],
  specialty: ['specialty', 'speciality', 'specialization'],
  phone: ['phone', 'mobile', 'contact', 'phone number', 'contact number'],
  email: ['email', 'email address', 'e-mail'],
};

const CANONICAL_BY_ALIAS = new Map();
for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
  for (const alias of aliases) CANONICAL_BY_ALIAS.set(alias, field);
}

// The columns we publish in the downloadable template. `*` = mandatory.
// Only Doctor Name and City Name are required — everything else can be added
// later by the company owner / field staff.
export const TEMPLATE_COLUMNS = [
  'Doctor Name *',
  'City Name *',
  'Clinic Name',
  'District Name',
  'Territory',
  'Current Address',
  'DOB',
  'Specialty',
  'Phone',
  'Latitude',
  'Longitude',
  'Altitude',
];

const normaliseHeader = (h) => String(h ?? '').trim().toLowerCase().replace(/\*/g, '').replace(/\s+/g, ' ').trim();

// "" / null / undefined / whitespace -> null. Strings are trimmed.
export function normaliseCell(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  return str === '' ? null : str;
}

// dd/mm/yyyy and dd-mm-yyyy are read the Indian way; anything else falls back to
// the JS Date parser (ISO, "12 Jan 1980", Excel Date objects, serial numbers).
export function parseExcelDate(value) {
  if (value === null || value === undefined || value === '') return { date: null };
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? { error: true } : { date: value };
  if (typeof value === 'number') {
    const parsed = XLSX.SSF ? XLSX.SSF.parse_date_code(value) : null;
    if (parsed) return { date: new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)) };
  }
  const str = String(value).trim();
  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    d = Number(d); m = Number(m); y = Number(y);
    if (y < 100) y += y < 50 ? 2000 : 1900;
    const date = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return { error: true };
    return { date };
  }
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? { error: true } : { date };
}

// Present-but-not-a-number is an error; absent stays null.
export function parseOptionalNumber(value, { min, max } = {}) {
  if (value === null || value === undefined || value === '') return { value: null };
  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(num)) return { error: true };
  if (min !== undefined && num < min) return { error: true };
  if (max !== undefined && num > max) return { error: true };
  return { value: num };
}

/**
 * Parse a spreadsheet buffer into canonical row objects.
 * @returns {{ rows: Array<{ rowNumber:number, data:object }>, headerFields: string[] }}
 * @throws if the file cannot be read as a spreadsheet or has no header row.
 */
export function parseDoctorWorkbook(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch {
    throw new Error('The uploaded file could not be read as an Excel workbook');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no sheets');
  const sheet = workbook.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null, raw: false });
  if (!matrix.length) throw new Error('The sheet is empty');

  const headerRow = matrix[0].map(normaliseHeader);
  const columnMap = headerRow.map((h) => CANONICAL_BY_ALIAS.get(h) || null);
  const headerFields = columnMap.filter(Boolean);
  if (!headerFields.includes('name')) {
    throw new Error('Could not find a "Doctor Name" column — download the template and use its headers');
  }

  const rows = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const raw = matrix[i];
    if (!raw || raw.every((cell) => normaliseCell(cell) === null)) continue; // skip fully-blank lines
    const data = {};
    columnMap.forEach((field, colIndex) => {
      if (!field) return;
      data[field] = normaliseCell(raw[colIndex]);
    });
    rows.push({ rowNumber: i + 1, data }); // 1-based, matches the spreadsheet
  }
  return { rows, headerFields };
}

// Build the downloadable .xlsx template: one header row, one example row, and a
// second "Instructions" sheet.
export function buildDoctorTemplateWorkbook() {
  const example = {
    'Doctor Name *': 'Dr. ABC',
    'City Name *': 'Pune',
    'Clinic Name': 'ABC Clinic',
    'District Name': 'Pune',
    'Territory': 'Pune Central',
    'Current Address': '123 MG Road, Pune',
    'DOB': '1980-05-14',
    'Specialty': 'Cardiologist',
    'Phone': '9876543210',
    'Latitude': 18.5204,
    'Longitude': 73.8567,
    'Altitude': 560,
  };
  const dataSheet = XLSX.utils.json_to_sheet([example], { header: TEMPLATE_COLUMNS });
  dataSheet['!cols'] = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(14, c.length + 2) }));

  const instructions = XLSX.utils.aoa_to_sheet([
    ['MediFlow — Doctor Import Template'],
    [],
    ['Mandatory columns (marked * in the Doctors sheet):'],
    ['  Doctor Name, City Name'],
    [],
    ['Optional columns:'],
    ['  Clinic Name, District Name, Territory, Current Address, DOB,'],
    ['  Specialty, Phone, Latitude, Longitude, Altitude'],
    [],
    ['Notes:'],
    ['  • Territory: if the name is new it will be created automatically for your company.'],
    ['  • DOB accepts 1980-05-14, 14/05/1980 or 14-05-1980. Leave blank if unknown.'],
    ['  • Leave Latitude / Longitude / Altitude blank if you do not have them —'],
    ['    an MR can capture the real GPS location later from the doctor page.'],
    ['  • Delete the example row before uploading.'],
  ]);
  instructions['!cols'] = [{ wch: 90 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Doctors');
  XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export default { parseDoctorWorkbook, buildDoctorTemplateWorkbook, normaliseCell, parseExcelDate, parseOptionalNumber, TEMPLATE_COLUMNS };
