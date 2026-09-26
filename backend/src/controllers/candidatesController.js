import * as Candidate from '../models/Candidate.js'
import * as JobRequisition from '../models/JobRequisition.js'
import { computeScore, diffSkills } from '../services/matchingService.js'
import { extractText } from '../services/resumeTextExtractor.js'
import { extractSkills } from '../services/resumeKeywordService.js'
import fs from 'fs'
import path from 'path'

const UPLOADS_DIR = path.resolve(Candidate.BACKEND_ROOT, 'uploads', 'resumes')

function toCandidateDto(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    location: c.location,
    experienceYears: c.experience_years,
    skills: c.skills,
    resumeText: c.resume_text,
    resumeFileName: c.resume_file_name || null,
    resumeFileType: c.resume_file_type || null,
    referralCode: c.referral_code || null
  }
}

// Sends a stored resume file (used by both the candidate's own download and
// the HR-side download from the application review modal).
export function sendResumeFile(res, candidate) {
  const absPath = Candidate.resolveResumePath(candidate)
  if (!candidate?.resume_file_path || !absPath || !fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'No resume on file' })
  }

  res.setHeader('Content-Type', candidate.resume_file_type || 'application/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${candidate.resume_file_name || 'resume'}"`)
  res.sendFile(absPath)
}

// Guesses a safe file extension from the original name or the mime type so
// the stored file can be re-opened correctly later.
function pickExtension(originalName, mimeType) {
  const known = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
  const fromName = (originalName || '').match(/\.([a-zA-Z0-9]+)$/)
  if (fromName && known.includes(fromName[0].toLowerCase())) return fromName[0].toLowerCase()
  if (mimeType === 'application/pdf') return '.pdf'
  if (mimeType.includes('wordprocessingml')) return '.docx'
  if (mimeType === 'text/plain') return '.txt'
  return ''
}

export async function upsertCandidate(req, res) {
  const { name, email, phone, location, experienceYears, skills, resumeText } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' })
  }

  const candidate = Candidate.upsert(req.user.id, { name, email, phone, location, experienceYears, skills, resumeText })
  res.json(toCandidateDto(candidate))
}

export async function getMyCandidate(req, res) {
  const candidate = Candidate.findByUserId(req.user.id)
  if (!candidate) return res.status(404).json({ error: 'No profile yet' })
  res.json(toCandidateDto(candidate))
}

// HR-side candidate pool - every candidate who has built a profile, with
// their application activity. HR-only; candidates see their own profile via
// getMyCandidate.
export async function getCandidatePool(req, res) {
  const candidates = Candidate.findAllWithApplicationStats()
  res.json(candidates.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    location: c.location,
    experienceYears: c.experience_years,
    skills: c.skills,
    applicationCount: c.application_count,
    hiredCount: c.hired_count,
    avgMatch: c.avg_match,
    bestMatch: c.best_match,
    hasResume: !!c.resume_file_path,
    referralCode: c.referral_code
  })))
}

export async function getMyMatches(req, res) {
  const candidate = Candidate.findByUserId(req.user.id)
  if (!candidate) return res.status(404).json({ error: 'No profile yet' })

  const jobs = JobRequisition.findAll().filter(j => j.status === 'Open')

  const results = jobs.map(job => {
    const { present, missing } = diffSkills(candidate.skills, job.skillRequirements)
    return {
      jobId: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      matchScorePercent: computeScore(candidate.skills, job.skillRequirements),
      matchedSkills: present,
      missingSkills: missing
    }
  }).sort((a, b) => b.matchScorePercent - a.matchScorePercent)

  res.json(results)
}

export async function getKeywordSuggestions(req, res) {
  const candidate = Candidate.findByUserId(req.user.id)
  const job = JobRequisition.findById(Number(req.params.jobId))
  if (!candidate || !job) return res.status(404).json({ error: 'Not found' })

  const { present, missing } = diffSkills(candidate.skills, job.skillRequirements)
  const currentScore = computeScore(candidate.skills, job.skillRequirements)
  const potentialScore = computeScore([...candidate.skills, ...missing], job.skillRequirements)

  res.json({
    jobId: job.id,
    jobTitle: job.title,
    keywordsPresent: present,
    keywordsToAdd: missing,
    currentMatchPercent: currentScore,
    potentialMatchPercent: potentialScore
  })
}

export async function parseResume(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded (field name must be "file")' })
  }

  const text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname)
  const skills = extractSkills(text)

  res.json({
    rawText: text,
    skills,
    name: null,
    email: (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || null,
    location: null,
    experienceYears: 0
  })
}

// Uploads a resume, persists the actual file to disk (unlike /resume-parse
// which only extracts text), extracts text + skills, and records everything
// on the candidate row so the file survives page reloads and HR can later
// download it from the application review modal.
export async function uploadResume(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded (field name must be "file")' })
  }

  const text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname)
  const skills = extractSkills(text)
  const ext = pickExtension(req.file.originalname, req.file.mimetype)
  const fileName = `candidate-${req.user.id}-${Date.now()}${ext}`
  const relPath = path.join('uploads', 'resumes', fileName)

  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), req.file.buffer)

  const candidate = Candidate.saveResume(req.user.id, {
    fileName: req.file.originalname || fileName,
    fileType: req.file.mimetype || 'application/octet-stream',
    filePath: relPath,
    resumeText: text,
    skills
  })

  res.json({
    ...toCandidateDto(candidate),
    skills,
    name: null,
    email: (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || null,
    location: null,
    experienceYears: 0
  })
}

// Serves the logged-in candidate's own saved resume (view or download).
export async function getMyResume(req, res) {
  const candidate = Candidate.findByUserId(req.user.id)
  if (!candidate) return res.status(404).json({ error: 'No profile yet' })
  sendResumeFile(res, candidate)
}
