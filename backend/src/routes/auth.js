import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { login, getMe } from '../controllers/authController.js'

const router = Router()
router.post('/login', login)
router.get('/me', requireAuth, getMe)

export default router
