import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createDoctor, listDoctors, getDoctor, updateDoctor, completeDoctor, deleteDoctor } from '../controllers/doctorController.js';
import { receiveSpreadsheet, downloadDoctorTemplate, importDoctors } from '../controllers/doctorImportController.js';
import {
  updateDoctorCrm,
  listInteractions,
  createInteraction,
  deleteInteraction,
  getDoctorSummary,
  getDoctorTimeline,
  listDoctorEngagement,
} from '../controllers/doctorCrmController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();

// Reps update CRM fields and log interactions for their doctors, so a broader
// role set than plain doctor edits.
const crmRoles = roleMiddleware('admin', 'company_owner', 'hr', 'hr_manager', 'mr', 'manager', 'project_manager', 'superadmin', 'super_admin');

// Excel bulk import is limited to Company Owner and HR Manager (admin/super_admin
// keep their platform-wide override).
const importRoles = roleMiddleware('admin', 'company_owner', 'hr_manager', 'superadmin', 'super_admin');

// "Complete missing details" — any company member. This only fills blanks
// (see completeDoctor), it never overwrites or deletes, so it is safe to let
// every employee add an address / GPS location for a doctor they visit.
const completeRoles = roleMiddleware('admin', 'company_owner', 'hr', 'hr_manager', 'mr', 'manager', 'project_manager', 'employee', 'user', 'superadmin', 'super_admin');

router.use(authMiddleware, companyMiddleware, requireModule('doctors'));

router.post('/', roleMiddleware('admin', 'company_owner', 'hr', 'mr', 'manager', 'superadmin', 'super_admin'), createDoctor);
router.get('/', listDoctors);

// Static routes before the /:id param route.
router.get('/engagement', listDoctorEngagement);
router.get('/import/template', importRoles, downloadDoctorTemplate);
router.post('/import', importRoles, receiveSpreadsheet, importDoctors);

router.get('/:id', getDoctor);
router.get('/:id/summary', getDoctorSummary);
router.get('/:id/timeline', getDoctorTimeline);
router.get('/:id/interactions', listInteractions);
router.post('/:id/interactions', crmRoles, createInteraction);
router.delete('/:id/interactions/:interactionId', crmRoles, deleteInteraction);
router.patch('/:id/crm', crmRoles, updateDoctorCrm);
router.patch('/:id/complete', completeRoles, completeDoctor);

router.put('/:id', roleMiddleware('admin', 'company_owner', 'hr', 'manager', 'superadmin', 'super_admin'), updateDoctor);
router.delete('/:id', roleMiddleware('admin', 'company_owner', 'hr', 'manager', 'superadmin', 'super_admin'), deleteDoctor);

export default router;
