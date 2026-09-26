// Replaces Firebase Auth entirely. Two fixed accounts (one HR, one
// candidate) live in .env - no external auth provider, no network call,
// no service account JSON. Sessions are plain JWTs signed with JWT_SECRET.
//
// This is intentionally simple: it's meant to get the full HR <-> candidate
// pipeline runnable end-to-end locally, not to be a production auth system.
// Swap this file out for real auth (Firebase, Auth0, your own user table
// with hashed passwords, etc.) later without touching anything downstream -
// every other route only ever sees req.user = { id, username, role }.
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '7d'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. Copy backend/.env.example to backend/.env and fill it in.`)
  }
  return value
}

// The two hardcoded accounts. Change the values in backend/.env - never
// hardcode real credentials directly in source.
export function getFixedAccounts() {
  return {
    hr: {
      username: requiredEnv('HR_USERNAME'),
      password: requiredEnv('HR_PASSWORD'),
      role: 'hr'
    },
    candidate: {
      username: requiredEnv('CANDIDATE_USERNAME'),
      password: requiredEnv('CANDIDATE_PASSWORD'),
      role: 'candidate'
    }
  }
}

// Checks a submitted username/password against both fixed accounts and
// returns the matching account's role, or null if nothing matched.
export function verifyCredentials(username, password) {
  const accounts = getFixedAccounts()
  for (const account of Object.values(accounts)) {
    if (username === account.username && password === account.password) {
      return { username: account.username, role: account.role }
    }
  }
  return null
}

export function signToken(user) {
  requiredEnv('JWT_SECRET')
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  requiredEnv('JWT_SECRET')
  return jwt.verify(token, JWT_SECRET)
}
