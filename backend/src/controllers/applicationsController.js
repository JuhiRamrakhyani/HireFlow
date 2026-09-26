import * as Candidate from '../models/Candidate.js'
import * as JobRequisition from '../models/JobRequisition.js'
import * as JobApplication from '../models/JobApplication.js'
import { computeScore, diffSkills } from '../services/matchingService.js'
import { sendResumeFile } from './candidatesController.js'

export async function apply(req, res) {
  const { jobRequisitionId } = req.body

  const candidate = Candidate.findByUserId(req.user.id)
  const job = JobRequisition.findById(Number(jobRequisitionId))
  if (!candidate || !job) return res.status(404).json({ error: 'Not found' })

  const existing = JobApplication.findByCandidateAndJob(candidate.id, job.id)
  if (existing) return res.status(409).json({ error: 'Already applied to this vacancy' })

  const application = JobApplication.create({
    candidateId: candidate.id,
    jobRequisitionId: job.id,
    matchScore: computeScore(candidate.skills, job.skillRequirements)
  })

  res.status(201).json({
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    department: job.department,
    stage: application.stage,
    appliedAt: application.applied_at,
    stageUpdatedAt: application.stage_updated_at
  })
}

export async function getMyApplications(req, res) {
  const candidate = Candidate.findByUserId(req.user.id)
  if (!candidate) return res.json([])

  const apps = JobApplication.findByCandidateId(candidate.id)

  res.json(apps.map(a => ({
    applicationId: a.id,
    jobId: a.job_requisition_id,
    jobTitle: a.job_title,
    department: a.job_department,
    stage: a.stage,
    appliedAt: a.applied_at,
    stageUpdatedAt: a.stage_updated_at,
    feedback: a.feedback
  })))
}

// HR-side ranked candidate list for one vacancy - this is what powers both
// CandidateRankTable and PipelineBoard on the HR view. matchScore was
// computed and stored once, at apply-time, so this is just an ORDER BY read.
export async function getByJob(req, res) {
  const apps = JobApplication.findByJobId(Number(req.params.jobId))

  res.json(apps.map(a => ({
    applicationId: a.id,
    candidateId: a.candidate_id,
    name: a.candidate_name,
    location: a.candidate_location,
    experienceYears: a.candidate_experience_years,
    matchScorePercent: a.match_score,
    stage: a.stage,
    appliedAt: a.applied_at
  })))
}

// Full single-application view for HR - everything CandidateRankTable's row
// doesn't have room for: the candidate's whole profile (contact info, resume
// text), and - the part that actually answers "why this score" - a
// requirement-by-requirement breakdown showing exactly which skills the
// match score was earned or lost on. This is what backs the "Review" action
// on the HR side before someone accepts or rejects an applicant.
export async function getApplicationDetail(req, res) {
  const application = JobApplication.findById(Number(req.params.id))
  if (!application) return res.status(404).json({ error: 'Not found' })

  const candidate = Candidate.findById(application.candidate_id)
  const job = JobRequisition.findById(application.job_requisition_id)
  if (!candidate || !job) return res.status(404).json({ error: 'Not found' })

  const candidateSkillSet = new Set(candidate.skills.map(s => s.toLowerCase()))

  // Same present/missing split the candidate sees on their own side
  // (ResumeKeywordPanel), just surfaced here for HR instead - one source of
  // truth for what "matched" means, read from both directions.
  const skillBreakdown = [...job.skillRequirements]
    .sort((a, b) => {
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1
      return b.weight - a.weight
    })
    .map(req => ({
      skillName: req.skillName,
      isRequired: req.isRequired,
      weight: req.weight,
      matched: candidateSkillSet.has(req.skillName.toLowerCase())
    }))

  const { missing } = diffSkills(candidate.skills, job.skillRequirements)

  res.json({
    applicationId: application.id,
    stage: application.stage,
    matchScorePercent: application.match_score,
    appliedAt: application.applied_at,
    stageUpdatedAt: application.stage_updated_at,
    hrNotes: application.hr_notes,
    feedback: application.feedback,
    job: {
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      minExperienceYears: job.min_experience_years,
      description: job.description
    },
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      experienceYears: candidate.experience_years,
      skills: candidate.skills,
      resumeText: candidate.resume_text
    },
    skillBreakdown,
    extraCandidateSkills: candidate.skills.filter(
      s => !job.skillRequirements.some(r => r.skillName.toLowerCase() === s.toLowerCase())
    ),
    missingRequiredCount: missing.filter(name =>
      job.skillRequirements.find(r => r.skillName === name)?.isRequired
    ).length
  })
}

export async function updateStage(req, res) {
  const { stage, hrNotes, feedback } = req.body
  const validStages = ['Applied', 'Screened', 'Interview', 'Offer', 'Hired', 'Rejected']
  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${validStages.join(', ')}` })
  }

  const existing = JobApplication.findById(Number(req.params.id))
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const application = JobApplication.updateStage(existing.id, stage, hrNotes, feedback)
  const job = JobRequisition.findById(application.job_requisition_id)

  res.json({
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    department: job.department,
    stage: application.stage,
    appliedAt: application.applied_at,
    stageUpdatedAt: application.stage_updated_at
  })
}

// HR-side download of an applicant's saved resume PDF. Guards on the HR role
// (like every other /api/applications route) and resolves the file from the
// application's candidate row.
export async function getApplicationResume(req, res) {
  const application = JobApplication.findById(Number(req.params.id))
  if (!application) return res.status(404).json({ error: 'Not found' })

  const candidate = Candidate.findById(application.candidate_id)
  if (!candidate) return res.status(404).json({ error: 'Not found' })

  sendResumeFile(res, candidate)
}

export async function getKpis(req, res) {
  const openRoles = JobRequisition.findAll().filter(j => j.status === 'Open').length
  const inPipeline = JobApplication.countInPipeline()

  const hired = JobApplication.findHired()
  const avgDays = hired.length > 0
    ? hired.reduce((sum, a) => sum + (new Date(a.stage_updated_at) - new Date(a.applied_at)) / 86400000, 0) / hired.length
    : 0

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const offersThisMonth = JobApplication.countOffersSince(startOfMonth.toISOString().slice(0, 19).replace('T', ' '))

  res.json({
    openRoles,
    inPipeline,
    avgTimeToHireDays: Math.round(avgDays * 10) / 10,
    offersThisMonth
  })
}
