// SQLite replaces MongoDB here. The whole database is one file on disk
// (created automatically the first time the app runs) - no cloud account,
// no connection string, no network access needed at all for the database.
//
// better-sqlite3 is SYNCHRONOUS (unlike Mongoose, which is all Promises) -
// that's normal for SQLite libraries and is actually simpler to reason about:
// db.prepare(...).run(...) just returns immediately, no await needed. We
// still wrap the exported functions in a way that plays nicely with the
// async controllers elsewhere in the app.
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getFixedAccounts } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db = null

export function getDb() {
  if (!db) throw new Error('Database not initialized - call initDb() first')
  return db
}

export function initDb() {
  const relativePath = process.env.SQLITE_DB_PATH || './data/hireflow.sqlite'
  const dbPath = path.resolve(__dirname, '../../', relativePath)

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createSchema(db)
  seedFixedUsers(db)
  console.log(`SQLite database ready at ${dbPath}`)
  return db
}

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('candidate', 'hr')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      experience_years REAL NOT NULL DEFAULT 0,
      resume_text TEXT,
      resume_file_name TEXT,
      resume_file_type TEXT,
      resume_file_path TEXT,
      skills TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      parsed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS job_requisitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      min_experience_years REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Draft', 'Open', 'Closed')),
      skill_requirements TEXT NOT NULL DEFAULT '[]',
      hiring_manager_id INTEGER REFERENCES hiring_managers(id) ON DELETE SET NULL,
      created_by_user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_requisition_id INTEGER NOT NULL REFERENCES job_requisitions(id) ON DELETE CASCADE,
      stage TEXT NOT NULL DEFAULT 'Applied'
        CHECK(stage IN ('Applied', 'Screened', 'Interview', 'Offer', 'Hired', 'Rejected')),
      match_score REAL NOT NULL DEFAULT 0,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      stage_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      hr_notes TEXT,
      feedback TEXT,
      UNIQUE(candidate_id, job_requisition_id)
    );

    CREATE TABLE IF NOT EXISTS hiring_managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      title TEXT,
      department TEXT,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
      referred_by_name TEXT NOT NULL,
      referred_by_email TEXT NOT NULL,
      referred_by_phone TEXT,
      referred_candidate_name TEXT NOT NULL,
      referred_candidate_email TEXT NOT NULL,
      referred_candidate_phone TEXT,
      job_requisition_id INTEGER REFERENCES job_requisitions(id) ON DELETE SET NULL,
      job_title TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'Pending'
        CHECK(status IN ('Pending', 'Contacted', 'Interview', 'Hired', 'Rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  migrate(db)
}

// CREATE TABLE IF NOT EXISTS leaves existing databases untouched, so new
// columns added after a table already exists are migrated in here instead.
// Each check is idempotent - safe to run on every boot.
function migrate(db) {
  ensureColumn(db, 'candidates', 'resume_file_name', 'TEXT')
  ensureColumn(db, 'candidates', 'resume_file_type', 'TEXT')
  ensureColumn(db, 'candidates', 'resume_file_path', 'TEXT')
  ensureColumn(db, 'candidates', 'referral_code', 'TEXT')
  ensureColumn(db, 'job_applications', 'feedback', 'TEXT')
  ensureColumn(db, 'job_requisitions', 'hiring_manager_id', 'INTEGER')
  backfillReferralCodes(db)
}

function ensureColumn(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    console.log(`Migrated: added ${table}.${column}`)
  }
}

// Backfills referral codes for candidates that already existed before the
// referral_code column was added - new rows always get one at insert time.
function backfillReferralCodes(db) {
  const missing = db.prepare("SELECT id FROM candidates WHERE referral_code IS NULL OR referral_code = ''").all()
  for (const row of missing) {
    const code = `HF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    db.prepare('UPDATE candidates SET referral_code = ? WHERE id = ?').run(code, row.id)
  }
  if (missing.length) console.log(`Backfilled ${missing.length} referral code(s)`)
}

// Creates the two hardcoded HR/candidate user rows on first run so the rest
// of the app (job_requisitions.created_by_user_id, candidates.user_id, etc.)
// has a real user id to attach to from the very first request - no separate
// signup step needed.
function seedFixedUsers(db) {
  const accounts = getFixedAccounts()
  const upsert = db.prepare(`
    INSERT INTO users (username, role) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET role = excluded.role
  `)
  for (const account of Object.values(accounts)) {
    upsert.run(account.username, account.role)
  }
}
