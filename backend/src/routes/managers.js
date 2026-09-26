import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  getAllManagers, getManagerById, createManager, updateManager, deleteManager
} from '../controllers/managersController.js'

const router = Router()

router.get('/', requireAuth, requireRole('hr'), getAllManagers)
router.get('/:id', requireAuth, requireRole('hr'), getManagerById)
router.post('/', requireAuth, requireRole('hr'), createManager)
router.put('/:id', requireAuth, requireRole('hr'), updateManager)
router.delete('/:id', requireAuth, requireRole('hr'), deleteManager)

export default router
