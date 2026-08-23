import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createVisit, listVisits, getVisit, updateVisit, deleteVisit, doctorVisit, medicalVisit } from '../controllers/visitController.js';

const router = express.Router();

router.post('/', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr','mr','manager','superadmin','super_admin'), createVisit);
router.post('/doctor', authMiddleware, companyMiddleware, doctorVisit);
router.post('/medical', authMiddleware, companyMiddleware, medicalVisit);
router.get('/', authMiddleware, companyMiddleware, listVisits);
router.get('/:id', authMiddleware, companyMiddleware, getVisit);
router.put('/:id', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), updateVisit);
router.delete('/:id', authMiddleware, companyMiddleware, roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), deleteVisit);

export default router;
