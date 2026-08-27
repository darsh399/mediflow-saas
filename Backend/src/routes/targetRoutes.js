import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import {
  listTargets,
  getTarget,
  createTarget,
  updateTarget,
  deleteTarget,
  getTargetDashboard,
} from '../controllers/targetController.js'

const router = express.Router()

// Reps view their own target; team leads and company-wide roles view/manage
// more. Every scope and permission check is enforced in the controller.
router.use(authMiddleware, companyMiddleware, requireModule('orders'))

router.get('/dashboard', getTargetDashboard)
router.get('/', listTargets)
router.get('/:id', getTarget)
router.post('/', createTarget)
router.put('/:id', updateTarget)
router.delete('/:id', deleteTarget)

export default router
