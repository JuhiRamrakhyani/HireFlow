import { getDb } from '../config/db.js'

export function findAll() {
  const db = getDb()
  return db.prepare('SELECT * FROM hiring_managers ORDER BY is_active DESC, name ASC').all()
}

export function findActive() {
  const db = getDb()
  return db.prepare("SELECT * FROM hiring_managers WHERE is_active = 1 ORDER BY name ASC").all()
}

export function findById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM hiring_managers WHERE id = ?').get(id) || null
}

export function findByEmail(email) {
  const db = getDb()
  return db.prepare('SELECT * FROM hiring_managers WHERE LOWER(email) = LOWER(?)').get(email) || null
}

export function create({ name, email, title, department, phone }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO hiring_managers (name, email, title, department, phone, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(name, email, title || null, department || null, phone || null)
  return findById(result.lastInsertRowid)
}

export function update(id, { name, email, title, department, phone, isActive }) {
  const db = getDb()
  db.prepare(`
    UPDATE hiring_managers
    SET name = ?, email = ?, title = ?, department = ?, phone = ?, is_active = ?
    WHERE id = ?
  `).run(name, email, title || null, department || null, phone || null, isActive === false ? 0 : 1, id)
  return findById(id)
}

export function remove(id) {
  const db = getDb()
  // Vacancies owned by this manager keep their row but lose the link
  // (SET NULL) so the hiring flow is never blocked by a deleted manager.
  db.prepare('DELETE FROM hiring_managers WHERE id = ?').run(id)
}

// How many open/active vacancies each manager is responsible for - used to
// show a workload number on the managers page.
export function jobCounts() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT j.hiring_manager_id as manager_id, COUNT(*) as count
    FROM job_requisitions j
    WHERE j.status IN ('Open', 'Draft')
    GROUP BY j.hiring_manager_id
  `).all()
  return new Map(rows.map(r => [r.manager_id, r.count]))
}
