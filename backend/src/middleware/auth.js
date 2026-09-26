import { verifyToken } from '../config/auth.js'
import * as User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header' })
    }

    const decoded = verifyToken(token)

    const user = User.findById(decoded.sub)
    if (!user) {
      return res.status(401).json({ error: 'Session refers to a user that no longer exists' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth verification failed:', err.message)
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `This action requires the '${role}' role` })
    }
    next()
  }
}
