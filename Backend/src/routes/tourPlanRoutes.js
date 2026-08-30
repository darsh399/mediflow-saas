import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import {
  listTourPlans,
  getTourPlan,
  createTourPlan,
  updateTourPlan,
  submitTourPlan,
  reviewTourPlan,
  deleteTourPlan,
} from '../controllers/tourPlanController.js'

const router = express.Router()

// Reps plan their own visits; managers review. Ownership and reviewer checks
// live in the controller.
router.use(authMiddleware, companyMiddleware, requireModule('tour_plans'))

router.get('/', listTourPlans)
router.get('/:id', getTourPlan)
router.post('/', createTourPlan)
router.patch('/:id', updateTourPlan)
router.post('/:id/submit', submitTourPlan)
router.post('/:id/review', reviewTourPlan)
router.delete('/:id', deleteTourPlan)

export default router
