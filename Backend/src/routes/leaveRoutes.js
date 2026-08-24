import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { applyLeave, listLeaves, reviewLeave } from '../controllers/leaveController.js';
import multer from 'multer';

const upload = multer({
  dest: 'uploads/leaves/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only PDF, JPG, PNG, or WEBP documents are allowed'), allowed.includes(file.mimetype));
  },
});

const router = express.Router();

router.post('/', authMiddleware, companyMiddleware, upload.single('document'), applyLeave);
router.get('/', authMiddleware, companyMiddleware, listLeaves);
router.post('/:id/review', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr_manager','hr','manager','project_manager','superadmin','super_admin'), reviewLeave);

export default router;
