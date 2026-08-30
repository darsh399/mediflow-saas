import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import authorize from '../middleware/permissionMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import controller from '../controllers/salaryController.js'

const router = express.Router()
// Only company_owner and hr_manager may manage salary structures, salary
// assignments, salary slips and offer letters (admin retains its platform-wide
// override). Normal hr must not.
const manager = roleMiddleware('admin', 'company_owner', 'hr_manager')
router.use(authMiddleware, companyMiddleware, requireModule('payroll'))

router.get('/structures', manager, authorize('salary.view'), controller.listStructures)
router.post('/structures', manager, authorize('salary.manage'), controller.createStructure)
router.put('/structures/:id', manager, authorize('salary.manage'), controller.updateStructure)
router.delete('/structures/:id', manager, authorize('salary.manage'), controller.deleteStructure)

router.get('/my', authorize('salary.view'), controller.getMySalary)
router.get('/', authorize('salary.view'), controller.listSalaries)
router.post('/', manager, authorize('salary.manage'), controller.createSalary)
router.put('/:id', manager, authorize('salary.manage'), controller.updateSalary)
router.delete('/:id', manager, authorize('salary.manage'), controller.deleteSalary)

router.get('/slips/my', authorize('salary_slip.view'), controller.getMySlips)
router.get('/slips', authorize('salary_slip.view'), controller.listSlips)
router.get('/slips/preview', manager, authorize('salary_slip.manage'), controller.previewSlip)
router.post('/slips', manager, authorize('salary_slip.manage'), controller.createSlip)
router.get('/slips/:id', authorize('salary_slip.view'), controller.getSlip)
router.delete('/slips/:id', manager, authorize('salary_slip.manage'), controller.deleteSlip)
router.post('/slips/:id/send', manager, authorize('salary_slip.manage'), controller.sendSlip)

router.get('/offers/my', requireModule('offer_letters'), authorize('offer.view'), controller.listOffers)
router.get('/offers', requireModule('offer_letters'), authorize('offer.view'), controller.listOffers)
router.get('/offers/:id', requireModule('offer_letters'), authorize('offer.view'), controller.getOffer)
router.post('/offers', requireModule('offer_letters'), manager, authorize('offer.manage'), controller.createOffer)
router.put('/offers/:id', requireModule('offer_letters'), manager, authorize('offer.manage'), controller.updateOffer)
router.post('/offers/:id/send', requireModule('offer_letters'), manager, authorize('offer.manage'), controller.sendOffer)

export default router
