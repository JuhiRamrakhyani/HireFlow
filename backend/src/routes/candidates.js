import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  upsertCandidate, getMyCandidate, getCandidatePool, getMyMatches, getKeywordSuggestions, parseResume,
  uploadResume, getMyResume
} from '../controllers/candidatesController.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.post('/', requireAuth, requireRole('candidate'), upsertCandidate)
router.get('/me', requireAuth, requireRole('candidate'), getMyCandidate)
router.get('/pool', requireAuth, requireRole('hr'), getCandidatePool)
router.get('/me/matches', requireAuth, requireRole('candidate'), getMyMatches)
router.get('/me/keyword-suggestions/:jobId', requireAuth, requireRole('candidate'), getKeywordSuggestions)
router.post('/resume-parse', requireAuth, requireRole('candidate'), upload.single('file'), parseResume)
router.post('/resume', requireAuth, requireRole('candidate'), upload.single('file'), uploadResume)
router.get('/resume', requireAuth, requireRole('candidate'), getMyResume)

export default router
