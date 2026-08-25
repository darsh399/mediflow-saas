import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { createActivity, listActivities } from '../controllers/activityController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware, requireModule('employees'));
router.post('/', createActivity);
router.get('/', listActivities);
export default router;
