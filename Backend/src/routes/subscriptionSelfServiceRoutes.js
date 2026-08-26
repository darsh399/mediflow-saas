import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';
import { getMySubscription } from '../controllers/subscriptionSelfServiceController.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware);
router.get('/my', authorize('subscription.view'), getMySubscription);

export default router;
