import { getDb } from '../config/db.js'

export function create({ candidateId, referredBy, referredCandidate, jobRequisitionId, jobTitle, note }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO referrals
      (candidate_id, referred_by_name, referred_by_email, referred_by_phone,
       referred_candidate_name, referred_candidate_email, referred_candidate_phone,
       job_requisition_id, job_title, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    candidateId || null,
    referredBy.name || '',
    referredBy.email || '',
    referredBy.phone || null,
    referredCandidate.name,
    referredCandidate.email,
    referredCandidate.phone || null,
    jobRequisitionId || null,
    jobTitle || null,
    note || null
  )
  return findById(result.lastInsertRowid)
}

// Candidate-side: referrals this candidate has referred. candidate_id is the
// referrer (the logged-in candidate), not the referred person.
export function findByReferrerId(candidateId) {
  const db = getDb()
  return db.prepare(`
    SELECT r.*, j.title as job_title, j.department as job_department
    FROM referrals r
    LEFT JOIN job_requisitions j ON j.id = r.job_requisition_id
    WHERE r.candidate_id = ?
    ORDER BY r.created_at DESC
  `).all(candidateId)
}

// HR-side: every referral across all candidates, joined with job info and
// the referrer's own candidate profile (for the avatar/initials).
export function findAllDetailed() {
  const db = getDb()
  return db.prepare(`
    SELECT r.*, j.title as job_title, j.department as job_department,
           c.name as referrer_candidate_name
    FROM referrals r
    LEFT JOIN job_requisitions j ON j.id = r.job_requisition_id
    LEFT JOIN candidates c ON c.id = r.candidate_id
    ORDER BY r.created_at DESC
  `).all()
}

export function findById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM referrals WHERE id = ?').get(id) || null
}

export function updateStatus(id, status) {
  const db = getDb()
  db.prepare("UPDATE referrals SET status = ? WHERE id = ?").run(status, id)
  return findById(id)
}

export function countByStatus() {
  const db = getDb()
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM referrals GROUP BY status').all()
  return new Map(rows.map(r => [r.status, r.count]))
}
