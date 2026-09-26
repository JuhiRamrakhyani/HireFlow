import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  apply, getMyApplications, getByJob, getApplicationDetail, updateStage, getKpis, getApplicationResume
} from '../controllers/applicationsController.js'

const router = Router()

router.post('/', requireAuth, requireRole('candidate'), apply)
router.get('/me', requireAuth, requireRole('candidate'), getMyApplications)

router.get('/job/:jobId', requireAuth, requireRole('hr'), getByJob)
// Literal paths (/kpis) must be registered before the /:id catch-all below,
// or a request to /kpis would match :id = "kpis" instead.
router.get('/kpis', requireAuth, requireRole('hr'), getKpis)
router.get('/:id', requireAuth, requireRole('hr'), getApplicationDetail)
router.get('/:id/resume', requireAuth, requireRole('hr'), getApplicationResume)
router.put('/:id/stage', requireAuth, requireRole('hr'), updateStage)

export default router
