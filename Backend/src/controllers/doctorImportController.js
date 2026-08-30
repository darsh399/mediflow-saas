import multer from 'multer';
import { uploadSpreadsheet } from '../middleware/uploadMiddleware.js';
import { parseDoctorWorkbook, buildDoctorTemplateWorkbook } from '../utils/doctorExcel.js';
import { importDoctorRows } from '../services/doctorImportService.js';
import recordAudit from '../utils/audit.js';

// Wrap the multer middleware so a bad file type / oversized file becomes a clean
// 400 instead of an unhandled error (there is no global multer handler).
export function receiveSpreadsheet(req, res, next) {
  uploadSpreadsheet(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'The file is too large (max 5 MB)'
        : 'Upload a single .xlsx or .xls file in the "file" field';
      return res.status(400).json({ message });
    }
    return res.status(400).json({ message: err.message || 'Could not read the uploaded file' });
  });
}

export const downloadDoctorTemplate = async (req, res) => {
  try {
    const buffer = buildDoctorTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="doctor-import-template.xlsx"');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Doctor template error:', error);
    return res.status(500).json({ message: 'Could not generate the template', error: error.message });
  }
};

export const importDoctors = async (req, res) => {
  try {
    const companyId = req.user?.companyId; // never from the file or the body
    if (!companyId) return res.status(400).json({ message: 'Company context missing' });
    if (!req.file?.buffer) return res.status(400).json({ message: 'No file uploaded' });

    let parsed;
    try {
      parsed = parseDoctorWorkbook(req.file.buffer);
    } catch (parseError) {
      return res.status(400).json({ message: parseError.message });
    }

    if (!parsed.rows.length) {
      return res.status(400).json({ message: 'The file has no data rows' });
    }
    const MAX_ROWS = 2000;
    if (parsed.rows.length > MAX_ROWS) {
      return res.status(400).json({ message: `Too many rows (${parsed.rows.length}). Split the file into batches of ${MAX_ROWS}.` });
    }

    const summary = await importDoctorRows({ companyId, userId: req.user?.id, rows: parsed.rows });

    await recordAudit(req, 'doctors_imported', {
      companyId,
      module: 'doctors',
      newValue: { total: summary.total, imported: summary.imported, failed: summary.failed, duplicates: summary.duplicates },
    });

    return res.status(200).json({
      message: `Imported ${summary.imported} of ${summary.total} row(s)`,
      total: summary.total,
      imported: summary.imported,
      failed: summary.failed,
      duplicates: summary.duplicates,
      territoriesCreated: summary.territoriesCreated,
      errors: summary.errors,
    });
  } catch (error) {
    console.error('Doctor import error:', error);
    return res.status(500).json({ message: 'Error importing doctors', error: error.message });
  }
};

export default { receiveSpreadsheet, downloadDoctorTemplate, importDoctors };
