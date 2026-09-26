import { getDb } from '../config/db.js'

export function findByCandidateAndJob(candidateId, jobRequisitionId) {
  const db = getDb()
  return db.prepare(
    'SELECT * FROM job_applications WHERE candidate_id = ? AND job_requisition_id = ?'
  ).get(candidateId, jobRequisitionId) || null
}

export function findById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM job_applications WHERE id = ?').get(id) || null
}

export function create({ candidateId, jobRequisitionId, matchScore }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO job_applications (candidate_id, job_requisition_id, match_score, stage)
    VALUES (?, ?, ?, 'Applied')
  `).run(candidateId, jobRequisitionId, matchScore)
  return findById(result.lastInsertRowid)
}

// Joined with the job title/department, for the candidate's own tracker view
export function findByCandidateId(candidateId) {
  const db = getDb()
  return db.prepare(`
    SELECT a.*, j.title as job_title, j.department as job_department
    FROM job_applications a
    JOIN job_requisitions j ON j.id = a.job_requisition_id
    WHERE a.candidate_id = ?
    ORDER BY a.applied_at DESC
  `).all(candidateId)
}

// Joined with candidate details, ranked by match score - this is the HR-side
// "ranked candidates for this vacancy" table.
export function findByJobId(jobRequisitionId) {
  const db = getDb()
  return db.prepare(`
    SELECT a.*, c.name as candidate_name, c.location as candidate_location, c.experience_years as candidate_experience_years
    FROM job_applications a
    JOIN candidates c ON c.id = a.candidate_id
    WHERE a.job_requisition_id = ?
    ORDER BY a.match_score DESC
  `).all(jobRequisitionId)
}

export function updateStage(id, stage, hrNotes, feedback) {
  const db = getDb()
  if (hrNotes !== undefined && feedback !== undefined) {
    db.prepare(`
      UPDATE job_applications SET stage = ?, stage_updated_at = datetime('now'), hr_notes = ?, feedback = ? WHERE id = ?
    `).run(stage, hrNotes, feedback, id)
  } else if (hrNotes !== undefined) {
    db.prepare(`
      UPDATE job_applications SET stage = ?, stage_updated_at = datetime('now'), hr_notes = ? WHERE id = ?
    `).run(stage, hrNotes, id)
  } else if (feedback !== undefined) {
    db.prepare(`
      UPDATE job_applications SET stage = ?, stage_updated_at = datetime('now'), feedback = ? WHERE id = ?
    `).run(stage, feedback, id)
  } else {
    db.prepare(`
      UPDATE job_applications SET stage = ?, stage_updated_at = datetime('now') WHERE id = ?
    `).run(stage, id)
  }
  return findById(id)
}

export function countInPipeline() {
  const db = getDb()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM job_applications WHERE stage NOT IN ('Hired', 'Rejected')"
  ).get()
  return row.count
}

export function findHired() {
  const db = getDb()
  return db.prepare("SELECT * FROM job_applications WHERE stage = 'Hired'").all()
}

export function countOffersSince(isoDate) {
  const db = getDb()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM job_applications WHERE stage = 'Offer' AND stage_updated_at >= ?"
  ).get(isoDate)
  return row.count
}
