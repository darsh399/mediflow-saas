import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { applyLeave, listLeaves, exportLeaves, reviewLeave } from '../controllers/leaveController.js';
import multer from 'multer';
import requireModule from '../middleware/moduleMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';

const upload = multer({
  dest: 'uploads/leaves/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only PDF, JPG, PNG, or WEBP documents are allowed'), allowed.includes(file.mimetype));
  },
});

const router = express.Router();

router.use(authMiddleware, companyMiddleware, requireModule('leaves'));
router.post('/', authorize('leave.apply'), upload.single('document'), applyLeave);
router.get('/', authorize('leave.view'), listLeaves);
router.get('/export', authorize('leave.view'), exportLeaves);
// Normal hr can view leave requests (see the GET route below) but not approve/reject them.
router.post('/:id/review', roleMiddleware('admin','company_owner','hr_manager','manager','project_manager','superadmin','super_admin'), authorize('leave.approve'), reviewLeave);

export default router;
