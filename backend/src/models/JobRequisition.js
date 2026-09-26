import { getDb } from '../config/db.js'

function fromRow(row) {
  if (!row) return null
  return { ...row, skillRequirements: JSON.parse(row.skill_requirements || '[]') }
}

export function findAll() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT j.*, m.name as hiring_manager_name, m.email as hiring_manager_email
    FROM job_requisitions j
    LEFT JOIN hiring_managers m ON m.id = j.hiring_manager_id
    ORDER BY j.created_at DESC
  `).all()
  return rows.map(fromRow)
}

export function findById(id) {
  const db = getDb()
  const row = db.prepare(`
    SELECT j.*, m.name as hiring_manager_name, m.email as hiring_manager_email
    FROM job_requisitions j
    LEFT JOIN hiring_managers m ON m.id = j.hiring_manager_id
    WHERE j.id = ?
  `).get(id)
  return fromRow(row)
}

export function create({ title, department, location, description, minExperienceYears, skillRequirements, hiringManagerId, createdByUserId }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO job_requisitions (title, department, location, description, min_experience_years, skill_requirements, hiring_manager_id, created_by_user_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open')
  `).run(title, department, location, description, minExperienceYears || 0, JSON.stringify(skillRequirements || []), hiringManagerId || null, createdByUserId)

  return findById(result.lastInsertRowid)
}

// Full update of an existing vacancy - title/description/skills can all
// change after candidates have already applied. Existing job_applications
// rows keep whatever match_score was computed at apply-time (not
// recalculated retroactively), so editing a vacancy never silently
// reshuffles a ranking someone already reviewed.
export function update(id, { title, department, location, description, minExperienceYears, skillRequirements, status, hiringManagerId }) {
  const db = getDb()
  db.prepare(`
    UPDATE job_requisitions
    SET title = ?, department = ?, location = ?, description = ?, min_experience_years = ?, skill_requirements = ?, status = ?, hiring_manager_id = ?
    WHERE id = ?
  `).run(title, department, location, description, minExperienceYears || 0, JSON.stringify(skillRequirements || []), status, hiringManagerId || null, id)

  return findById(id)
}

// How many applications exist per job - used for the vacancy list's
// "X applicants" count, computed in one query rather than one per job.
export function applicantCounts() {
  const db = getDb()
  const rows = db.prepare('SELECT job_requisition_id, COUNT(*) as count FROM job_applications GROUP BY job_requisition_id').all()
  return new Map(rows.map(r => [r.job_requisition_id, r.count]))
}

export function applicantCount(jobId) {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM job_applications WHERE job_requisition_id = ?').get(jobId)
  return row.count
}
