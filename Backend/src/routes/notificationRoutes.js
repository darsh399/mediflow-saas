import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { sendCompanyMessage } from '../controllers/notificationController.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { requireRole } from '../utils/authorize.js';
import multer from 'multer';

const router = express.Router();
router.use(authMiddleware);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.post('/send', companyMiddleware, requireRole('admin', 'company_owner', 'hr_manager'), upload.single('attachment'), sendCompanyMessage);
router.get('/', listNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
