import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createVisit, assignVisit, listVisits, listEmployeeVisitSummary, listEmployeeVisits, listTopPerformers, getVisitCalendarSummary, getVisit, updateVisit, deleteVisit, doctorVisit, medicalVisit, visitSummary, downloadVisitPhoto, rescheduleVisit, cancelVisit, completeVisit, getDoctorCoverage } from '../controllers/visitController.js';
import requireModule from '../middleware/moduleMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';
import { uploadVisitPhoto } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware, requireModule('visits'));
router.post('/', roleMiddleware('admin','company_owner','hr','mr','manager','superadmin','super_admin'), authorize('visit.create'), createVisit);
// Admin/hr_manager/manager schedules a doctor or medical visit for an employee on a future date.
router.post('/assign', roleMiddleware('admin','company_owner','hr_manager','manager','superadmin','super_admin'), authorize('visit.assign'), assignVisit);
router.post('/doctor', authorize('visit.create'), uploadVisitPhoto, doctorVisit);
router.post('/medical', authorize('visit.create'), uploadVisitPhoto, medicalVisit);
router.get('/summary', authorize('visit.view'), visitSummary);
router.get('/employee-summary', authorize('visit.view'), listEmployeeVisitSummary);
router.get('/top-performers', authorize('visit.view'), listTopPerformers);
router.get('/calendar-summary', authorize('visit.view'), getVisitCalendarSummary);
router.get('/coverage', roleMiddleware('admin','company_owner','hr_manager','manager','superadmin','super_admin'), authorize('visit.view'), getDoctorCoverage);
router.get('/employee/:employeeId', authorize('visit.view'), listEmployeeVisits);
router.get('/', authorize('visit.view'), listVisits);
router.get('/:id', authorize('visit.view'), getVisit);
router.get('/:id/photo', authorize('visit.view'), downloadVisitPhoto);
router.put('/:id', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), authorize('visit.update'), updateVisit);
// The assigned employee reschedules/cancels their own scheduled visit (with a required reason) — ownership is checked inside the controller.
router.patch('/:id/reschedule', authorize('visit.view'), rescheduleVisit);
router.patch('/:id/cancel', authorize('visit.view'), cancelVisit);
router.patch('/:id/complete', authorize('visit.view'), completeVisit);
router.delete('/:id', roleMiddleware('admin','company_owner','hr','manager','superadmin','super_admin'), deleteVisit);

export default router;
