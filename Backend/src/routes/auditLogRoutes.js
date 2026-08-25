import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';
import { listAuditLogs } from '../controllers/auditLogController.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware);
router.get('/', authorize('audit.view'), listAuditLogs);

export default router;
