import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import { getReport, reportEmployees } from '../controllers/reportController.js'

const router = express.Router()

router.use(authMiddleware, companyMiddleware, requireModule('reports'))

// report.view: company_owner / hr_manager / hr / manager / project_manager.
// CSV export additionally requires report.export (checked in the controller).
router.get('/employees', authorize('report.view'), reportEmployees)
router.get('/:type', authorize('report.view'), getReport)

export default router
