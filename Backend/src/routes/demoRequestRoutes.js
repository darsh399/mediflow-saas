import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../utils/authorize.js';
import rateLimit from '../middleware/rateLimitMiddleware.js';
import { createDemoRequest, listDemoRequests, updateDemoRequestStatus } from '../controllers/demoRequestController.js';

const router = express.Router();

// Public — the Contact page's enquiry form. Unauthenticated, so throttle to
// curb spam/abuse: 5 submissions per IP per 15 minutes.
const demoRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
router.post('/', demoRequestLimiter, createDemoRequest);

// Super admin only — reviewing submitted leads.
router.get('/', authMiddleware, requireRole('super_admin'), listDemoRequests);
router.patch('/:id/status', authMiddleware, requireRole('super_admin'), updateDemoRequestStatus);

export default router;
