import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getMyProfile, saveProfile, submitProfile, listProfiles, reviewProfile } from '../controllers/employeeProfileController.js';
import { uploadProfileDocuments, downloadPrivateDocument, listEmployeeDocuments, verifyEmployeeDocument, deleteEmployeeDocument } from '../controllers/documentController.js';
import { uploadFields } from '../middleware/uploadMiddleware.js';
import requireModule from '../middleware/moduleMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';

const router = express.Router();
const reviewers = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager'];
router.use(authMiddleware, companyMiddleware);
router.get('/me', getMyProfile);
router.put('/me', saveProfile);
router.post('/me/documents', requireModule('documents'), authorize('document.upload'), uploadFields, uploadProfileDocuments);
router.get('/documents/employee/:userId', requireModule('documents'), authorize('document.view'), listEmployeeDocuments);
router.patch('/documents/employee/:userId/:documentId/verify', requireModule('documents'), authorize('document.verify'), verifyEmployeeDocument);
router.delete('/documents/employee/:userId/:documentId', requireModule('documents'), authorize('document.delete'), deleteEmployeeDocument);
router.get('/documents/:storageName', requireModule('documents'), authorize('document.view'), downloadPrivateDocument);
router.post('/me/submit', submitProfile);
router.get('/', roleMiddleware(...reviewers), listProfiles);
router.patch('/:id/review', roleMiddleware(...reviewers), reviewProfile);

export default router;
