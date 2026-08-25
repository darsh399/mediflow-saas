import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import { listHolidays, createHoliday, updateHoliday, deleteHoliday, getCalendarSettings, updateCalendarSettings } from '../controllers/holidayController.js'

const router = express.Router()
router.use(authMiddleware, companyMiddleware, requireModule('calendar'))
router.get('/', authorize('calendar.view'), listHolidays)
router.get('/settings', authorize('calendar.view'), getCalendarSettings)
router.patch('/settings', authorize('calendar.manage'), updateCalendarSettings)
router.post('/', authorize('calendar.manage'), createHoliday)
router.patch('/:id', authorize('calendar.manage'), updateHoliday)
router.delete('/:id', authorize('calendar.manage'), deleteHoliday)

export default router
