import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { listProducts, createProduct, updateProduct } from '../controllers/productController.js';
import requireModule from '../middleware/moduleMiddleware.js';

const router = express.Router();
router.use(authMiddleware, companyMiddleware, requireModule('orders'));
router.get('/', listProducts);
router.post('/', roleMiddleware('admin', 'company_owner', 'hr_manager', 'hr'), createProduct);
router.put('/:id', roleMiddleware('admin', 'company_owner', 'hr_manager', 'hr'), updateProduct);

export default router;
