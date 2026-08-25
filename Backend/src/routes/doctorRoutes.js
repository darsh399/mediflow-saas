import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createDoctor, listDoctors, getDoctor, updateDoctor, deleteDoctor } from '../controllers/doctorController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware, requireModule('doctors'));
router.post('/', roleMiddleware('admin','company_owner','hr','mr','manager','superadmin','super_admin'), createDoctor);
router.get('/', listDoctors);
router.get('/:id', getDoctor);
router.put('/:id', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), updateDoctor);
router.delete('/:id', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), deleteDoctor);

export default router;
