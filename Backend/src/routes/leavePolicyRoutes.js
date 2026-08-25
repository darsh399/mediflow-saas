import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import { getPolicy, updatePolicy, getMyBalances, getEmployeeBalances, getEmployeeLedger, adjustBalance, getLeaveHistory } from '../controllers/leavePolicyController.js'

const router = express.Router()
router.use(authMiddleware, companyMiddleware, requireModule('leaves'))
router.get('/policy', authorize('leave.view'), getPolicy)
router.patch('/policy', authorize('leave.manage_policy'), updatePolicy)
router.get('/balances/me', authorize('leave.view'), getMyBalances)
router.get('/balances/:employeeId', authorize('leave.view'), getEmployeeBalances)
router.get('/ledger/:employeeId', authorize('leave.view_ledger'), getEmployeeLedger)
router.post('/balances/:employeeId/adjust', authorize('leave.adjust_balance'), adjustBalance)
router.get('/:leaveId/history', authorize('leave.view_history'), getLeaveHistory)

export default router
