import express from 'express';

import {createUser, loginUser, getUserById, updateUser, deleteUser, listUsers, searchUsers, profileComplete, updateProfile, logoutUser} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { changeUserStatus } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', createUser);
router.post('/users', authMiddleware, requireRole('admin', 'company_owner', 'hr_manager', 'hr'), createUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected routes - require authentication
router.get('/users/:id', authMiddleware, companyMiddleware, getUserById);
router.put('/users/:id', authMiddleware, companyMiddleware, updateUser);
// delete/list/search are admin-only actions
router.delete('/users/:id', authMiddleware, requireRole('admin','company_owner','hr_manager','hr','super_admin'), deleteUser);
router.get('/users', authMiddleware, requireRole('admin','company_owner','hr_manager','hr','super_admin'), listUsers);
router.get('/users/search', authMiddleware, requireRole('admin','company_owner','hr_manager','hr','super_admin'), searchUsers);

// Profile updates - authenticated users (owner or admin) can update
router.put('/users/:id/profile-complete', authMiddleware, companyMiddleware, profileComplete);
router.put('/users/:id/profile', authMiddleware, companyMiddleware, updateProfile);
// Status changes (disable/block/unblock)
router.patch('/users/:id/status', authMiddleware, requireRole('admin','company_owner','hr_manager','hr'), changeUserStatus);

export default router;