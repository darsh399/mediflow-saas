import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createDoctor, listDoctors, getDoctor, updateDoctor, deleteDoctor } from '../controllers/doctorController.js';

const router = express.Router();

router.post('/', authMiddleware, companyMiddleware, roleMiddleware('admin','hr','manager','superadmin','super_admin'), createDoctor);
router.get('/', authMiddleware, companyMiddleware, listDoctors);
router.get('/:id', authMiddleware, companyMiddleware, getDoctor);
router.put('/:id', authMiddleware, companyMiddleware, roleMiddleware('admin','hr','manager','superadmin','super_admin'), updateDoctor);
router.delete('/:id', authMiddleware, companyMiddleware, roleMiddleware('admin','hr','manager','superadmin','super_admin'), deleteDoctor);

export default router;
