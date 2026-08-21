import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createMedical, listMedicals, getMedical, updateMedical, deleteMedical } from '../controllers/medicalController.js';

const router = express.Router();

router.post('/', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), createMedical);
router.get('/', authMiddleware, companyMiddleware, listMedicals);
router.get('/:id', authMiddleware, companyMiddleware, getMedical);
router.put('/:id', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), updateMedical);
router.delete('/:id', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), deleteMedical);

export default router;
