import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { createProject, listProjects, updateProject } from '../controllers/projectController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware, requireModule('tasks'));
router.post('/', createProject);
router.get('/', listProjects);
router.patch('/:id', updateProject);
export default router;
