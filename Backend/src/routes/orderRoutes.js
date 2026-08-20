import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createOrder, listOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware);
router.post('/', roleMiddleware('mr', 'employee', 'manager', 'admin', 'company_owner'), createOrder);
router.get('/', listOrders);
router.patch('/:id/status', roleMiddleware('admin', 'company_owner', 'hr_manager', 'manager'), updateOrderStatus);

export default router;
