import express from 'express';

import {
  createUser,
  loginUser,
  getAllMyVisits,
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
  searchUsers,
  profileComplete,
  updateProfile,
  logoutUser,
  changeUserStatus
} from '../controllers/userController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';

const router = express.Router();

router.post('/register', createUser);

router.post(
  '/users',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr'),
  createUser
);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

// Protected routes
router.get(
  '/users/myvisits',
  authMiddleware,
  companyMiddleware,
  getAllMyVisits
);

router.get(
  '/users/:id',
  authMiddleware,
  companyMiddleware,
  getUserById
);

router.put(
  '/users/:id',
  authMiddleware,
  companyMiddleware,
  updateUser
);

// Admin-only routes
router.delete(
  '/users/:id',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr', 'super_admin'),
  deleteUser
);

router.get(
  '/users',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr', 'super_admin', 'mr'),
  listUsers
);

router.get(
  '/users/search',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr', 'super_admin'),
  searchUsers
);

// Profile routes
router.put(
  '/users/:id/profile-complete',
  authMiddleware,
  companyMiddleware,
  profileComplete
);

router.put(
  '/users/:id/profile',
  authMiddleware,
  companyMiddleware,
  updateProfile
);

// Status route
router.patch(
  '/users/:id/status',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr'),
  changeUserStatus
);

export default router;