import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { createProject, listProjects, updateProject } from '../controllers/projectController.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware);
router.post('/', createProject);
router.get('/', listProjects);
router.patch('/:id', updateProject);
export default router;
