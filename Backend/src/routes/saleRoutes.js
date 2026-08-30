import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import { createSale, listSales, getSale, deleteSale } from '../controllers/saleController.js'

const router = express.Router()

router.use(authMiddleware, companyMiddleware, requireModule('orders'))

router.post('/', createSale)
router.get('/', listSales)
router.get('/:id', getSale)
router.delete('/:id', deleteSale)

export default router
