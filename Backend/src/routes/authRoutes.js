import express from 'express';
import { sendInvite, acceptInvite, forgotPassword, resetPassword, changePassword, currentUser } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../utils/authorize.js';

const router = express.Router();

// Protected: only admin/hr/manager can send invites
router.post('/invite/send', authMiddleware, requireRole('admin','company_owner','hr_manager','hr','manager'), sendInvite);
// Public: recipient accepts invite using token and provides password + profile data
router.post('/invite/accept/:token', acceptInvite);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', authMiddleware, changePassword);
router.get('/me', authMiddleware, currentUser);

export default router;
