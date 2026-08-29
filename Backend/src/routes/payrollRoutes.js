import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import controller from '../controllers/payrollController.js'

const router = express.Router()

// Same gate as the rest of payroll: company_owner / hr_manager / admin only.
const manager = roleMiddleware('admin', 'company_owner', 'hr_manager')

router.use(authMiddleware, companyMiddleware, requireModule('payroll'))

// An employee may pull their own annual summary; everything else is manager-only.
router.get('/summary', authorize('salary_slip.view'), controller.payrollAnnualSummary)

router.get('/settings', manager, authorize('salary.view'), controller.getPayrollSettings)
router.put('/settings', manager, authorize('salary.manage'), controller.updatePayrollSettings)

router.get('/runs', manager, authorize('salary_slip.view'), controller.listPayrollRuns)
router.get('/runs/preview', manager, authorize('salary_slip.manage'), controller.previewPayrollRun)
router.post('/runs', manager, authorize('salary_slip.manage'), controller.createPayrollRun)
router.get('/runs/:id', manager, authorize('salary_slip.view'), controller.getPayrollRun)
router.patch('/runs/:id', manager, authorize('salary_slip.manage'), controller.updatePayrollRun)
router.post('/runs/:id/recompute', manager, authorize('salary_slip.manage'), controller.recomputePayrollRun)
router.post('/runs/:id/approve', manager, authorize('salary_slip.manage'), controller.approvePayrollRun)
router.post('/runs/:id/generate', manager, authorize('salary_slip.manage'), controller.generatePayrollSlips)
router.post('/runs/:id/send', manager, authorize('salary_slip.manage'), controller.sendPayrollSlips)
router.post('/runs/:id/paid', manager, authorize('salary_slip.manage'), controller.markPayrollPaid)
router.delete('/runs/:id', manager, authorize('salary_slip.manage'), controller.deletePayrollRun)
router.get('/runs/:id/bank-advice', manager, authorize('salary_slip.view'), controller.payrollBankAdvice)

export default router
