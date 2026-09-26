import * as HiringManager from '../models/HiringManager.js'
import * as JobRequisition from '../models/JobRequisition.js'

function toDto(m, jobCount = 0) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    title: m.title,
    department: m.department,
    phone: m.phone,
    isActive: !!m.is_active,
    jobCount
  }
}

export async function getAllManagers(req, res) {
  const managers = HiringManager.findAll()
  const counts = HiringManager.jobCounts()
  res.json(managers.map(m => toDto(m, counts.get(m.id) || 0)))
}

export async function getManagerById(req, res) {
  const manager = HiringManager.findById(Number(req.params.id))
  if (!manager) return res.status(404).json({ error: 'Not found' })

  const jobs = JobRequisition.findAll().filter(j => j.hiring_manager_id === manager.id)
  res.json({ ...toDto(manager), jobs: jobs.map(j => ({ id: j.id, title: j.title, status: j.status })) })
}

export async function createManager(req, res) {
  const { name, email, title, department, phone } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' })
  }
  if (HiringManager.findByEmail(email)) {
    return res.status(409).json({ error: 'A manager with that email already exists' })
  }

  const manager = HiringManager.create({ name, email, title, department, phone })
  res.status(201).json(toDto(manager))
}

export async function updateManager(req, res) {
  const manager = HiringManager.findById(Number(req.params.id))
  if (!manager) return res.status(404).json({ error: 'Not found' })

  const {
    name = manager.name,
    email = manager.email,
    title = manager.title,
    department = manager.department,
    phone = manager.phone,
    isActive = !!manager.is_active
  } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' })
  }

  const existing = HiringManager.findByEmail(email)
  if (existing && existing.id !== manager.id) {
    return res.status(409).json({ error: 'A manager with that email already exists' })
  }

  const updated = HiringManager.update(manager.id, { name, email, title, department, phone, isActive })
  res.json(toDto(updated))
}

export async function deleteManager(req, res) {
  const manager = HiringManager.findById(Number(req.params.id))
  if (!manager) return res.status(404).json({ error: 'Not found' })

  HiringManager.remove(manager.id)
  res.json({ ok: true })
}
