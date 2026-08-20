import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getMyProfile, saveProfile, submitProfile, listProfiles, reviewProfile } from '../controllers/employeeProfileController.js';
import { uploadProfileDocuments, downloadPrivateDocument } from '../controllers/documentController.js';
import { uploadFields } from '../middleware/uploadMiddleware.js';

const router = express.Router();
const reviewers = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager'];
router.use(authMiddleware, companyMiddleware);
router.get('/me', getMyProfile);
router.put('/me', saveProfile);
router.post('/me/documents', uploadFields, uploadProfileDocuments);
router.get('/documents/:storageName', downloadPrivateDocument);
router.post('/me/submit', submitProfile);
router.get('/', roleMiddleware(...reviewers), listProfiles);
router.patch('/:id/review', roleMiddleware(...reviewers), reviewProfile);

export default router;
