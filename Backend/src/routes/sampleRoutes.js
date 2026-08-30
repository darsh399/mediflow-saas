import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'
import {
  listItems, createItem, updateItem,
  getBalances, listTransactions,
  issueStock, recordGiven, recordReturn, adjustStock,
} from '../controllers/sampleController.js'

const router = express.Router()
const canManage = requireRole('admin', 'company_owner', 'hr_manager', 'manager', 'project_manager')

router.use(authMiddleware, companyMiddleware, requireModule('visits'))

router.get('/items', listItems)
router.post('/items', canManage, createItem)
router.patch('/items/:id', canManage, updateItem)

router.get('/balances', getBalances)
router.get('/transactions', listTransactions)

router.post('/issue', canManage, issueStock)
router.post('/given', recordGiven)
router.post('/return', recordReturn)
router.post('/adjust', canManage, adjustStock)

export default router
