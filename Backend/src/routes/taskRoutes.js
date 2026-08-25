import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createTask, listTasks, updateTask } from '../controllers/taskController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware, requireModule('tasks'));
router.post('/', roleMiddleware('admin', 'company_owner', 'hr_manager', 'hr', 'manager'), createTask);
router.get('/', listTasks);
router.patch('/:id', updateTask);

export default router;
