import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getMyProfile, saveProfile, submitProfile, listProfiles, reviewProfile, saveBankDetails } from '../controllers/employeeProfileController.js';
import { uploadProfileDocuments, downloadPrivateDocument, listEmployeeDocuments, verifyEmployeeDocument, deleteEmployeeDocument, requestDocumentReupload } from '../controllers/documentController.js';
import { uploadFields } from '../middleware/uploadMiddleware.js';
import requireModule from '../middleware/moduleMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';

const router = express.Router();
// Normal hr can browse profiles and check documents, but only company_owner
// and hr_manager may approve/reject them (admin retains its platform-wide
// override). Plain "manager" must not have either.
const viewers = ['admin', 'company_owner', 'hr_manager', 'hr'];
const reviewers = ['admin', 'company_owner', 'hr_manager'];
router.use(authMiddleware, companyMiddleware);
router.get('/me', getMyProfile);
router.put('/me', saveProfile);
router.put('/me/bank-details', saveBankDetails);
router.post('/me/documents', requireModule('documents'), authorize('document.upload'), uploadFields, uploadProfileDocuments);
router.get('/documents/employee/:userId', requireModule('documents'), authorize('document.view'), listEmployeeDocuments);
router.patch('/documents/employee/:userId/:documentId/verify', requireModule('documents'), authorize('document.verify'), verifyEmployeeDocument);
router.post('/documents/employee/:userId/request-reupload', requireModule('documents'), authorize('document.verify'), requestDocumentReupload);
router.delete('/documents/employee/:userId/:documentId', requireModule('documents'), authorize('document.delete'), deleteEmployeeDocument);
router.get('/documents/:storageName', requireModule('documents'), authorize('document.view'), downloadPrivateDocument);
router.post('/me/submit', submitProfile);
router.get('/', roleMiddleware(...viewers), listProfiles);
router.patch('/:id/review', roleMiddleware(...reviewers), reviewProfile);

export default router;
