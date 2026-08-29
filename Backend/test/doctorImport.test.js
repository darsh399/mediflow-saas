import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  parseDoctorWorkbook,
  buildDoctorTemplateWorkbook,
  normaliseCell,
  parseExcelDate,
  parseOptionalNumber,
} from '../src/utils/doctorExcel.js';

function sheetBuffer(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

test('normaliseCell turns blank/whitespace into null and trims strings', () => {
  assert.equal(normaliseCell(''), null);
  assert.equal(normaliseCell('   '), null);
  assert.equal(normaliseCell(null), null);
  assert.equal(normaliseCell(undefined), null);
  assert.equal(normaliseCell('  Dr. ABC '), 'Dr. ABC');
  assert.equal(normaliseCell(12.5), 12.5);
});

test('parseOptionalNumber: empty -> null, junk -> error, valid -> number', () => {
  assert.deepEqual(parseOptionalNumber(''), { value: null });
  assert.deepEqual(parseOptionalNumber(null), { value: null });
  assert.deepEqual(parseOptionalNumber('abc'), { error: true });
  assert.deepEqual(parseOptionalNumber('18.52'), { value: 18.52 });
  assert.deepEqual(parseOptionalNumber(200, { min: -90, max: 90 }), { error: true });
});

test('parseExcelDate handles dd/mm/yyyy, ISO, blanks and rubbish', () => {
  assert.equal(parseExcelDate('').date, null);
  const dmy = parseExcelDate('14/05/1980');
  assert.equal(dmy.date.getUTCFullYear(), 1980);
  assert.equal(dmy.date.getUTCMonth(), 4);
  assert.equal(dmy.date.getUTCDate(), 14);
  assert.equal(parseExcelDate('1980-05-14').date.getUTCFullYear(), 1980);
  assert.equal(parseExcelDate('not-a-date').error, true);
  assert.equal(parseExcelDate('32/01/2020').error, true);
});

test('parseDoctorWorkbook maps headers, skips blank rows, keeps 1-based row numbers', () => {
  const buffer = sheetBuffer([
    ['Doctor Name *', 'Clinic Name *', 'City Name *', 'District Name *', 'Territory *', 'Latitude', 'Longitude'],
    ['Dr. ABC', 'ABC Clinic', 'Pune', 'Pune', 'Pune Central', '', ''],
    ['', '', '', '', '', '', ''],
    ['Dr. XYZ', 'XYZ Clinic', 'Mumbai', 'Mumbai', 'Mumbai West', 19.07, 72.87],
  ]);
  const { rows } = parseDoctorWorkbook(buffer);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].rowNumber, 2);
  assert.equal(rows[0].data.name, 'Dr. ABC');
  assert.equal(rows[0].data.latitude, null);
  assert.equal(rows[1].rowNumber, 4);
  assert.equal(rows[1].data.city, 'Mumbai');
});

test('parseDoctorWorkbook rejects a file with no Doctor Name column', () => {
  const buffer = sheetBuffer([['Clinic', 'City'], ['ABC Clinic', 'Pune']]);
  assert.throws(() => parseDoctorWorkbook(buffer), /Doctor Name/);
});

test('buildDoctorTemplateWorkbook produces a readable workbook with a Doctors sheet', () => {
  const buffer = buildDoctorTemplateWorkbook();
  const wb = XLSX.read(buffer, { type: 'buffer' });
  assert.ok(wb.SheetNames.includes('Doctors'));
  assert.ok(wb.SheetNames.includes('Instructions'));
  const { rows } = parseDoctorWorkbook(buffer);
  assert.equal(rows[0].data.name, 'Dr. ABC');
  assert.equal(rows[0].data.territory, 'Pune Central');
});
