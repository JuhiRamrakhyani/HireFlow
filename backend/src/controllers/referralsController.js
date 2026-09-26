import * as Candidate from '../models/Candidate.js'
import * as JobRequisition from '../models/JobRequisition.js'
import * as Referral from '../models/Referral.js'

const REFERRAL_STATUSES = ['Pending', 'Contacted', 'Interview', 'Hired', 'Rejected']

// Candidate-side: submit a friend/acquaintance for a role. HR sees this in
// the referrals tab. The referrer (logged-in candidate) is auto-attached.
export async function createReferral(req, res) {
  const { name, email, phone, jobRequisitionId, note } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Referred person name and email are required' })
  }

  const referrer = Candidate.findByUserId(req.user.id)
  let jobTitle = null
  if (jobRequisitionId) {
    const job = JobRequisition.findById(Number(jobRequisitionId))
    if (job) jobTitle = job.title
  }

  const referral = Referral.create({
    candidateId: referrer?.id || null,
    referredBy: {
      name: referrer?.name || req.user.username,
      email: referrer?.email || '',
      phone: referrer?.phone
    },
    referredCandidate: { name, email, phone },
    jobRequisitionId: jobRequisitionId ? Number(jobRequisitionId) : null,
    jobTitle,
    note
  })

  res.status(201).json(toDto(referral, jobTitle))
}

export async function getMyReferrals(req, res) {
  const referrer = Candidate.findByUserId(req.user.id)
  if (!referrer) return res.json([])

  const referrals = Referral.findByReferrerId(referrer.id)
  res.json(referrals.map(r => toDto(r, r.job_title)))
}

// HR-side: all referrals with status counts for the tab header.
export async function getAllReferrals(req, res) {
  const referrals = Referral.findAllDetailed()
  const counts = Referral.countByStatus()

  res.json({
    referrals: referrals.map(r => toDto(r, r.job_title, r.referrer_candidate_name)),
    statusCounts: {
      total: referrals.length,
      pending: counts.get('Pending') || 0,
      contacted: counts.get('Contacted') || 0,
      interview: counts.get('Interview') || 0,
      hired: counts.get('Hired') || 0,
      rejected: counts.get('Rejected') || 0
    }
  })
}

export async function updateReferralStatus(req, res) {
  const { status } = req.body
  if (!REFERRAL_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${REFERRAL_STATUSES.join(', ')}` })
  }

  const referral = Referral.findById(Number(req.params.id))
  if (!referral) return res.status(404).json({ error: 'Not found' })

  const updated = Referral.updateStatus(referral.id, status)
  const job = updated.job_requisition_id ? JobRequisition.findById(updated.job_requisition_id) : null
  res.json(toDto(updated, job?.title))
}

function toDto(r, jobTitle, referrerCandidateName) {
  return {
    id: r.id,
    referredCandidate: {
      name: r.referred_candidate_name,
      email: r.referred_candidate_email,
      phone: r.referred_candidate_phone
    },
    referredBy: {
      name: r.referred_by_name,
      email: r.referred_by_email,
      phone: r.referred_by_phone,
      candidateId: r.candidate_id
    },
    referrerCandidateName: referrerCandidateName || null,
    job: {
      id: r.job_requisition_id,
      title: jobTitle || r.job_title || null
    },
    note: r.note,
    status: r.status,
    createdAt: r.created_at
  }
}
