import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';
import requireModule from '../middleware/moduleMiddleware.js';
import { createProduct, listProducts, getProduct, updateProduct, updateProductStatus, deleteProduct } from '../controllers/companyProductController.js';

const upload = multer({
  dest: 'uploads/company-products/',
  limits: { fileSize: 5 * 1024 * 1024, files: 9 },
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only JPG, PNG, or WEBP images are allowed'), allowed.includes(file.mimetype));
  },
});
const uploadImages = upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 8 }]);

const router = express.Router();

router.use(authMiddleware, companyMiddleware, requireModule('products'));

// Company Owner and HR Manager only (admin/super_admin keep their
// platform-wide override via the '*' permission).
router.post('/', authorize('companyProduct.manage'), uploadImages, createProduct);
router.put('/:id', authorize('companyProduct.manage'), uploadImages, updateProduct);
router.patch('/:id/status', authorize('companyProduct.manage'), updateProductStatus);
router.delete('/:id', authorize('companyProduct.manage'), deleteProduct);

// Every company member (including employee/mr) can view the catalog.
router.get('/', authorize('companyProduct.view'), listProducts);
router.get('/:id', authorize('companyProduct.view'), getProduct);

export default router;
