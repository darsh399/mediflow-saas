import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import { listUnits, createUnit, updateUnit, deleteUnit, getOrgChart } from '../controllers/organizationController.js'

const router = express.Router()
router.use(authMiddleware, companyMiddleware, requireModule('organization_chart'))
// The reporting chart is company-wide, non-sensitive context — any authenticated
// member of the company can view it (names, roles, reporting lines only).
router.get('/chart', getOrgChart)
router.get('/', authorize('organization.view'), listUnits)
router.post('/', authorize('organization.manage'), createUnit)
router.patch('/:id', authorize('organization.manage'), updateUnit)
router.delete('/:id', authorize('organization.manage'), deleteUnit)

export default router
