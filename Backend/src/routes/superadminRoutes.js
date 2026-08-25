import express from 'express'
import { login as superLogin, createCompanyOnboard, dashboard as superDashboard, logout as superLogout, updateCompanySubscription, updateCompanyModules, getCompanyUsage, listAuditLogs } from '../controllers/superAdminController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireRole } from '../utils/authorize.js'

const router = express.Router()

// Public: superadmin login
router.post('/login', superLogin)

// Protected: dashboard
router.get('/dashboard', authMiddleware, requireRole('super_admin'), superDashboard)
router.get('/audit-logs', authMiddleware, requireRole('super_admin'), listAuditLogs)

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

router.patch('/companies/:id/subscription', authMiddleware, requireRole('super_admin'), updateCompanySubscription)
router.patch('/companies/:id/modules', authMiddleware, requireRole('super_admin'), updateCompanyModules)
router.get('/companies/:id/usage', authMiddleware, requireRole('super_admin'), getCompanyUsage)

// delete company
router.delete('/companies/:id', authMiddleware, requireRole('super_admin'), async (req, res, next) => {
    try { await import('../controllers/superAdminController.js').then(m=>m.deleteCompany(req, res)) } catch(err){ next(err) }
})

export default router
