import express from 'express';
import { createSubscription, getSubscription } from '../controllers/subscriptionController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Super admin can manage subscriptions for companies
router.post('/', authMiddleware, roleMiddleware('super_admin'), createSubscription);
router.get('/:companyId', authMiddleware, roleMiddleware('super_admin'), getSubscription);

export default router;
