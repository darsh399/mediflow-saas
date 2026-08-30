import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, callback) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowed.includes(file.mimetype)) return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        callback(null, true);
    }
});

export const uploadSingle = upload.single("file");

export const uploadVisitPhoto = upload.single("visitPhoto");

export const uploadMultiple = upload.array("files", 5);

export const uploadFields = upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "documents", maxCount: 15 }
]);

// Spreadsheet upload (Doctor bulk import). Kept separate from `upload` so the
// existing PDF/image filter is untouched.
const spreadsheetMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/octet-stream', // some browsers send this for .xlsx
];
const spreadsheetUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const name = (file.originalname || '').toLowerCase();
        const extOk = name.endsWith('.xlsx') || name.endsWith('.xls');
        if (spreadsheetMimeTypes.includes(file.mimetype) && extOk) return callback(null, true);
        return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
});

export const uploadSpreadsheet = spreadsheetUpload.single("file");