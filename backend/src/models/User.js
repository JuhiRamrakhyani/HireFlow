// Every "model" file here is a small set of plain functions wrapping SQL
// statements - this replaces the Mongoose Schema/Model pattern. There's no
// magic ORM layer; each function does exactly the query its name says.
import { getDb } from '../config/db.js'

export function findByUsername(username) {
  const db = getDb()
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null
}

export function findById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null
}
