import express from 'express';
import { createCompany, getCompany } from '../controllers/companyController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Only SUPER_ADMIN should create companies; roleMiddleware uses requireRole
router.post('/', authMiddleware, roleMiddleware('super_admin'), createCompany);
router.get('/:id', authMiddleware, roleMiddleware('super_admin'), getCompany);

export default router;
