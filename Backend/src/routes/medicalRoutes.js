import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createMedical, listMedicals, getMedical, updateMedical, deleteMedical } from '../controllers/medicalController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware, requireModule('medicals'));
router.post('/', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), createMedical);
router.get('/', listMedicals);
router.get('/:id', getMedical);
router.put('/:id', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), updateMedical);
router.delete('/:id', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), deleteMedical);

export default router;
