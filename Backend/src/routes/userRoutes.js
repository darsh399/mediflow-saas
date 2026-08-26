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
  changeUserStatus,
  promoteEmployee,
  listColleagues
} from '../controllers/userController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.post(
  '/users',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr'),
  authorize('employee.create'),
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

// Registered ahead of the /users/:id param route so "colleagues" is never
// swallowed as an :id value.
router.get(
  '/users/colleagues',
  authMiddleware,
  companyMiddleware,
  listColleagues
);

router.get(
  '/users',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr', 'super_admin', 'mr'),
  authorize('employee.view'),
  listUsers
);

// Must be registered before /users/:id — otherwise Express matches "search"
// as the :id param and this route is never reached.
router.get(
  '/users/search',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr', 'super_admin'),
  authorize('employee.view'),
  searchUsers
);

router.get(
  '/users/:id',
  authMiddleware,
  companyMiddleware,
  authorize('employee.view'),
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
  authorize('employee.delete'),
  deleteUser
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
  authorize('employee.update'),
  changeUserStatus
);

// Promotion route
router.post(
  '/users/:id/promote',
  authMiddleware,
  requireRole('admin', 'company_owner', 'hr_manager', 'hr'),
  authorize('employee.update'),
  promoteEmployee
);

export default router;