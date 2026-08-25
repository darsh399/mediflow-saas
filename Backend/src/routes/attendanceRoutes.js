import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import { checkIn, checkOut, toggleBreak, getTodayAttendance, requestCorrection, reviewCorrection, listAttendance, listEmployeeAttendance, listEmployees } from '../controllers/attendanceController.js'

const router = express.Router()

router.use(authMiddleware, companyMiddleware, requireModule('attendance'))
router.post('/check-in', authorize('attendance.create'), checkIn)
router.post('/check-out', authorize('attendance.create'), checkOut)
router.post('/break', authorize('attendance.create'), toggleBreak)
router.get('/today', authorize('attendance.view'), getTodayAttendance)
router.post('/:id/correction', authorize('attendance.create'), requestCorrection)
router.post('/:id/correction/review', authorize('attendance.approve'), reviewCorrection)
router.get('/employees', authorize('attendance.view'), listEmployees)
router.get('/employee/:employeeId', authorize('attendance.view'), listEmployeeAttendance)
router.get('/', authorize('attendance.view'), listAttendance)

export default router
