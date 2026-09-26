import * as JobRequisition from '../models/JobRequisition.js'

function toSummaryDto(job, applicantCount) {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    status: job.status,
    applicantCount,
    requiredSkills: job.skillRequirements.filter(r => r.isRequired).map(r => r.skillName),
    hiringManagerId: job.hiring_manager_id || null,
    hiringManagerName: job.hiring_manager_name || null
  }
}

export async function getAllJobs(req, res) {
  const jobs = JobRequisition.findAll()
  const counts = JobRequisition.applicantCounts()
  res.json(jobs.map(j => toSummaryDto(j, counts.get(j.id) || 0)))
}

export async function getJobById(req, res) {
  const job = JobRequisition.findById(Number(req.params.id))
  if (!job) return res.status(404).json({ error: 'Not found' })

  const applicantCount = JobRequisition.applicantCount(job.id)

  res.json({
    ...toSummaryDto(job, applicantCount),
    description: job.description,
    minExperienceYears: job.min_experience_years,
    skillRequirements: job.skillRequirements
  })
}

export async function createJob(req, res) {
  const { title, department, location, description, minExperienceYears, skillRequirements, hiringManagerId } = req.body

  if (!title || !skillRequirements?.length) {
    return res.status(400).json({ error: 'title and at least one skill requirement are required' })
  }

  const job = JobRequisition.create({
    title, department, location, description, minExperienceYears, skillRequirements,
    hiringManagerId, createdByUserId: req.user.id
  })

  res.status(201).json(toSummaryDto(job, 0))
}

// Accepts an array of vacancies in one request and creates them all in a
// single transaction. Each item must have at least a title; skills are
// derived from a plain `skills` string (e.g. "Vue.js, CSS, Git") when a full
// skillRequirements array isn't provided. This is what the frontend's Excel
// bulk-upload sends after parsing the file into JSON.
export async function bulkCreateJobs(req, res) {
  const items = req.body.vacancies

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'body.vacancies must be a non-empty array' })
  }
  if (items.length > 200) {
    return res.status(400).json({ error: 'Max 200 vacancies per bulk upload' })
  }

  const created = []
  const errors = []

  for (const [index, item] of items.entries()) {
    const title = (item.title || '').trim()
    if (!title) {
      errors.push({ row: index + 1, title: '', error: 'missing title' })
      continue
    }

    let skillRequirements = item.skillRequirements
    if (!Array.isArray(skillRequirements) || skillRequirements.length === 0) {
      const names = String(item.skills || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      skillRequirements = names.map(n => ({ skillName: n, isRequired: true, weight: 2 }))
    }

    if (skillRequirements.length === 0) {
      errors.push({ row: index + 1, title, error: 'at least one skill required' })
      continue
    }

    const job = JobRequisition.create({
      title,
      department: (item.department || '').trim() || 'General',
      location: (item.location || '').trim() || 'Remote',
      description: (item.description || '').trim() || `Hiring for ${title}`,
      minExperienceYears: Number(item.minExperienceYears) || 0,
      skillRequirements,
      hiringManagerId: item.hiringManagerId ? Number(item.hiringManagerId) : null,
      createdByUserId: req.user.id
    })

    created.push(toSummaryDto(job, 0))
  }

  res.status(201).json({ created, errors, totalCreated: created.length })
}

// Edits an existing vacancy. Any field left out of the request body falls
// back to the job's current value, so the frontend can send a full form
// payload or just the fields that changed - either works.
export async function updateJob(req, res) {
  const job = JobRequisition.findById(Number(req.params.id))
  if (!job) return res.status(404).json({ error: 'Not found' })

  const {
    title = job.title,
    department = job.department,
    location = job.location,
    description = job.description,
    minExperienceYears = job.min_experience_years,
    skillRequirements = job.skillRequirements,
    status = job.status,
    hiringManagerId = job.hiring_manager_id
  } = req.body

  if (!title || !skillRequirements?.length) {
    return res.status(400).json({ error: 'title and at least one skill requirement are required' })
  }
  if (!['Draft', 'Open', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'status must be Draft, Open, or Closed' })
  }

  const updated = JobRequisition.update(job.id, {
    title, department, location, description, minExperienceYears, skillRequirements, status, hiringManagerId
  })
  const applicantCount = JobRequisition.applicantCount(updated.id)

  res.json({
    ...toSummaryDto(updated, applicantCount),
    description: updated.description,
    minExperienceYears: updated.min_experience_years,
    skillRequirements: updated.skillRequirements
  })
}
