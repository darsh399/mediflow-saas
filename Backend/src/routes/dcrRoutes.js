import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import { getDay, listReports, updateReport, submitReport, reviewReport } from '../controllers/dcrController.js'

const router = express.Router()

// Reps file their own day; managers review their team. Ownership and reviewer
// checks live in the controller.
router.use(authMiddleware, companyMiddleware, requireModule('visits'))

router.get('/', listReports)
router.post('/day', getDay)
router.patch('/:id', updateReport)
router.post('/:id/submit', submitReport)
router.post('/:id/review', reviewReport)

export default router
