import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import authorize from '../middleware/permissionMiddleware.js';
import requireModule from '../middleware/moduleMiddleware.js';
import { applyExpense, listExpenses, exportExpenses, reviewExpense, getExpenseSettings, updateExpenseSettings, previewTravelClaim } from '../controllers/expenseController.js';

const upload = multer({
  dest: 'uploads/expenses/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only PDF, JPG, PNG, or WEBP receipts are allowed'), allowed.includes(file.mimetype));
  },
});

const router = express.Router();

router.use(authMiddleware, companyMiddleware, requireModule('expenses'));
// Proof document is optional — upload.single lets the request through with
// or without a "receipt" file attached.
router.post('/', authorize('expense.apply'), upload.single('receipt'), applyExpense);
router.get('/', authorize('expense.view'), listExpenses);
router.get('/export', authorize('expense.view'), exportExpenses);
router.get('/settings', authorize('expense.view'), getExpenseSettings);
router.patch('/settings', authorize('expense.approve'), updateExpenseSettings);
router.get('/travel-claim/preview', authorize('expense.view'), previewTravelClaim);
router.post('/:id/review', authorize('expense.approve'), reviewExpense);

export default router;
