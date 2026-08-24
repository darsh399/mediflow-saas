import express from 'express'
import { login as superLogin,createCompanyOnboard, dashboard as superDashboard, logout as superLogout } from '../controllers/superAdminController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireRole } from '../utils/authorize.js'

const router = express.Router()

// Public: superadmin login
router.post('/login', superLogin)

// Protected: dashboard
router.get('/dashboard', authMiddleware, requireRole('super_admin'), superDashboard)

// logout
router.post('/logout', authMiddleware, superLogout)

// Create company + subscription + invite (onboarding) - Super Admin only
// router.post('/companies', authMiddleware, requireRole('super_admin'), async (req, res, next) => {
// 	// delegate to controller method
// 	try {
// 		const result = await import('../controllers/superAdminController.js').then(m=>m.createCompanyOnboard(req, res))
// 	} catch (err) { next(err) }
// })

router.post(
  '/companies',
  authMiddleware,
  requireRole('super_admin'),
  (req, res, next) => {

    console.log('');
    console.log('========================================');
    console.log('🔥 POST /api/superadmin/companies HIT');
    console.log('🔥 METHOD:', req.method);
    console.log('🔥 URL:', req.originalUrl);
    console.log('🔥 BODY:', req.body);
    console.log('🔥 USER:', req.user);
    console.log('========================================');

    createCompanyOnboard(req, res, next);
  }
);

// list companies
router.get('/companies', authMiddleware, requireRole('super_admin'), async (req, res, next) => {
	try { await import('../controllers/superAdminController.js').then(m=>m.listCompanies(req, res)) } catch(err){ next(err) }
})

// company detail
router.get('/companies/:id', authMiddleware, requireRole('super_admin'), async (req, res, next) => {
	try { await import('../controllers/superAdminController.js').then(m=>m.getCompanyDetails(req, res)) } catch(err){ next(err) }
})

// update company status (e.g., BLOCKED, ACTIVE, SUSPENDED)
router.patch('/companies/:id/status', authMiddleware, requireRole('super_admin'), async (req, res, next) => {
	try { await import('../controllers/superAdminController.js').then(m=>m.updateCompanyStatus(req, res)) } catch(err){ next(err) }
})

// delete company
router.delete('/companies/:id', authMiddleware, requireRole('super_admin'), async (req, res, next) => {
    try { await import('../controllers/superAdminController.js').then(m=>m.deleteCompany(req, res)) } catch(err){ next(err) }
})

export default router
