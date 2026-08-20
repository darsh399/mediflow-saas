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

export const uploadMultiple = upload.array("files", 5);

export const uploadFields = upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "documents", maxCount: 5 }
]);