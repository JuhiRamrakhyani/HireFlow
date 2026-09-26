import { getDb } from '../config/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

// Backend folder root - used to turn the relative resume_file_path stored in
// the DB (e.g. uploads/resumes/foo.pdf) into an absolute path for sendFile.
export const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// SQLite has no native array/JSON type, so `skills` is stored as a JSON
// string and parsed back into a real array on the way out. toRow/fromRow
// keep that conversion in one place instead of scattering JSON.parse calls
// through the controllers.
function fromRow(row) {
  if (!row) return null
  return { ...row, skills: JSON.parse(row.skills || '[]') }
}

export function resolveResumePath(candidate) {
  if (!candidate?.resume_file_path) return null
  return path.resolve(BACKEND_ROOT, candidate.resume_file_path)
}

// Short, human-readable referral code (e.g. HF-AB3K) shared by a candidate
// so friends can credit them when they apply. Generated once, never changes.
export function generateReferralCode(name) {
  const base = (name || 'cand')
    .trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'CAND'
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${base}-${suffix}`
}

function ensureReferralCode(db, id) {
  const row = db.prepare('SELECT referral_code FROM candidates WHERE id = ?').get(id)
  if (row && !row.referral_code) {
    db.prepare('UPDATE candidates SET referral_code = ? WHERE id = ?').run(generateReferralCode(''), id)
  }
}

// Records a resume file that was just uploaded for this user. If the
// candidate row doesn't exist yet (someone who uploads a resume before ever
// saving a profile), a placeholder row is created first - name/email are
// TEXT NOT NULL so they start as empty strings and get filled in by the
// normal profile save.
export function saveResume(userId, { fileName, fileType, filePath, resumeText, skills }) {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM candidates WHERE user_id = ?').get(userId)

  if (!existing) {
    const result = db.prepare(`
      INSERT INTO candidates (user_id, name, email, experience_years, resume_text, resume_file_name, resume_file_type, resume_file_path, skills, referral_code, parsed_at)
      VALUES (?, '', '', 0, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(userId, resumeText || null, fileName, fileType, filePath, JSON.stringify(skills || []), generateReferralCode(''))
    ensureReferralCode(db, result.lastInsertRowid)
    return findById(result.lastInsertRowid)
  }

  db.prepare(`
    UPDATE candidates
    SET resume_text = ?, resume_file_name = ?, resume_file_type = ?, resume_file_path = ?, skills = ?, parsed_at = datetime('now')
    WHERE id = ?
  `).run(resumeText || null, fileName, fileType, filePath, JSON.stringify([...new Set(skills || [])]), existing.id)
  ensureReferralCode(db, existing.id)
  return findById(existing.id)
}

export function findByUserId(userId) {
  const db = getDb()
  const row = db.prepare('SELECT * FROM candidates WHERE user_id = ?').get(userId)
  return fromRow(row)
}

export function findById(id) {
  const db = getDb()
  const row = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id)
  return fromRow(row)
}

// HR-side candidate pool: every candidate with the number of applications
// they've made and their overall best/average match, so the candidates page
// can show who's active in the pipeline without one query per candidate.
export function findAllWithApplicationStats() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM job_applications a WHERE a.candidate_id = c.id) as application_count,
           (SELECT COUNT(*) FROM job_applications a WHERE a.candidate_id = c.id AND a.stage = 'Hired') as hired_count,
           (SELECT ROUND(AVG(match_score), 1) FROM job_applications a WHERE a.candidate_id = c.id) as avg_match,
           (SELECT MAX(match_score) FROM job_applications a WHERE a.candidate_id = c.id) as best_match
    FROM candidates c
    ORDER BY c.created_at DESC
  `).all()
  return rows.map(fromRow)
}

// Creates the candidate row if none exists for this user yet, otherwise
// updates the existing one - this is the "upsert" the old Mongoose
// findOneAndUpdate(..., { upsert: true }) used to do.
export function upsert(userId, { name, email, phone, location, experienceYears, skills, resumeText }) {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM candidates WHERE user_id = ?').get(userId)
  const skillsJson = JSON.stringify([...new Set(skills || [])])

  if (existing) {
    db.prepare(`
      UPDATE candidates
      SET name = ?, email = ?, phone = ?, location = ?, experience_years = ?, skills = ?, resume_text = ?, parsed_at = datetime('now')
      WHERE id = ?
    `).run(name, email, phone || null, location || null, experienceYears || 0, skillsJson, resumeText || null, existing.id)
    ensureReferralCode(db, existing.id)
    return findById(existing.id)
  }

  const result = db.prepare(`
    INSERT INTO candidates (user_id, name, email, phone, location, experience_years, skills, resume_text, referral_code, parsed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(userId, name, email, phone || null, location || null, experienceYears || 0, skillsJson, resumeText || null, generateReferralCode(name))

  return findById(result.lastInsertRowid)
}
