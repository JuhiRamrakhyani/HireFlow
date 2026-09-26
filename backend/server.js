import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { initDb } from './src/config/db.js'

import authRoutes from './src/routes/auth.js'
import candidateRoutes from './src/routes/candidates.js'
import jobRoutes from './src/routes/jobs.js'
import applicationRoutes from './src/routes/applications.js'
import managerRoutes from './src/routes/managers.js'
import referralRoutes from './src/routes/referrals.js'

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
fs.mkdirSync(path.join(BACKEND_ROOT, 'uploads', 'resumes'), { recursive: true })

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/managers', managerRoutes)
app.use('/api/referrals', referralRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000

function start() {
  initDb() // synchronous - the SQLite file is ready immediately, no await needed
  app.listen(PORT, () => console.log(`HireFlow API listening on port ${PORT}`))
}

try {
  start()
} catch (err) {
  console.error('Failed to start server:', err)
  process.exit(1)
}
