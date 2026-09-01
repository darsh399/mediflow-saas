import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createOrder, listOrders, updateOrderStatus, updateFulfillmentStatus, listFulfillmentEvents } from '../controllers/orderController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware, requireModule('orders'));
router.post('/', roleMiddleware('mr', 'employee', 'manager', 'admin', 'company_owner'), createOrder);
router.get('/', listOrders);
router.patch('/:id/status', roleMiddleware('admin', 'company_owner', 'hr_manager', 'manager'), updateOrderStatus);
router.patch('/:id/fulfillment', roleMiddleware('admin', 'company_owner', 'hr_manager', 'manager'), requireModule('order_fulfillment'), updateFulfillmentStatus);
router.get('/:id/fulfillment-events', requireModule('order_fulfillment'), listFulfillmentEvents);

export default router;
