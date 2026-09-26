import * as User from '../models/User.js'
import { verifyCredentials, signToken } from '../config/auth.js'

// Checks the submitted username/password against the two hardcoded accounts
// (see backend/.env - HR_USERNAME/HR_PASSWORD and
// CANDIDATE_USERNAME/CANDIDATE_PASSWORD). There's no signup flow: both user
// rows are seeded once at startup in config/db.js, so login just has to find
// the matching row and hand back a session token.
export async function login(req, res) {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' })
  }

  const match = verifyCredentials(username, password)
  if (!match) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const user = User.findByUsername(match.username)
  if (!user) {
    // Should not happen - the fixed accounts are seeded at startup - but
    // fail clearly rather than issuing a token for a nonexistent user.
    return res.status(500).json({ error: 'Account is not set up. Restart the server to reseed it.' })
  }

  const token = signToken(user)
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  })
}

export async function getMe(req, res) {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role })
}
