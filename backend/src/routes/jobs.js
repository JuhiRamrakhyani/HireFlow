import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getAllJobs, getJobById, createJob, bulkCreateJobs, updateJob } from '../controllers/jobsController.js'

const router = Router()

router.get('/', requireAuth, getAllJobs)
router.get('/:id', requireAuth, getJobById)
router.post('/', requireAuth, requireRole('hr'), createJob)
router.post('/bulk', requireAuth, requireRole('hr'), bulkCreateJobs)
router.put('/:id', requireAuth, requireRole('hr'), updateJob)

export default router
