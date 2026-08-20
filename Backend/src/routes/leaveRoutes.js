import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { applyLeave, listLeaves, reviewLeave } from '../controllers/leaveController.js';

const router = express.Router();

router.post('/', authMiddleware, companyMiddleware, applyLeave);
router.get('/', authMiddleware, companyMiddleware, roleMiddleware('admin','hr','manager','superadmin','super_admin'), listLeaves);
router.post('/:id/review', authMiddleware, companyMiddleware, roleMiddleware('admin','hr','manager','superadmin','super_admin'), reviewLeave);

export default router;
