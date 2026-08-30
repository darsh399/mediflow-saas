import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import companyMiddleware from '../middleware/companyMiddleware.js'
import requireModule from '../middleware/moduleMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'
import {
  listTerritories,
  getTerritory,
  createTerritory,
  updateTerritory,
  deleteTerritory,
  setTerritoryPlaces,
} from '../controllers/territoryController.js'

const router = express.Router()

const canManage = requireRole('admin', 'company_owner', 'hr_manager', 'manager')

router.use(authMiddleware, companyMiddleware, requireModule('territories'))

// Any company member can see the territory list / their territory.
router.get('/', listTerritories)
router.get('/:id', getTerritory)

router.post('/', canManage, createTerritory)
router.patch('/:id', canManage, updateTerritory)
router.delete('/:id', canManage, deleteTerritory)
router.patch('/:id/places', canManage, setTerritoryPlaces)

export default router
