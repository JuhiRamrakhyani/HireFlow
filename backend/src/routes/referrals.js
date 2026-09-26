import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  createReferral, getMyReferrals, getAllReferrals, updateReferralStatus
} from '../controllers/referralsController.js'

const router = Router()

router.post('/', requireAuth, requireRole('candidate'), createReferral)
router.get('/me', requireAuth, requireRole('candidate'), getMyReferrals)

router.get('/', requireAuth, requireRole('hr'), getAllReferrals)
router.put('/:id/status', requireAuth, requireRole('hr'), updateReferralStatus)

export default router
