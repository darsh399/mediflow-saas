import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import { listShifts, createShift, updateShift, deleteShift } from '../controllers/workforceController.js'

const router = express.Router()
router.use(authMiddleware, companyMiddleware, requireModule('workforce'))
router.get('/shifts', listShifts)
router.post('/shifts', createShift)
router.patch('/shifts/:id', updateShift)
router.delete('/shifts/:id', deleteShift)

export default router