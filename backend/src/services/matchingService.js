// Unchanged from the MongoDB version - this works on plain JS arrays, so it
// doesn't care what database they came from.

export function computeScore(candidateSkills, skillRequirements) {
  if (!skillRequirements || skillRequirements.length === 0) return 0

  const candidateSkillSet = new Set(candidateSkills.map(s => s.toLowerCase()))

  let totalWeight = 0
  let earnedWeight = 0

  for (const req of skillRequirements) {
    const weight = req.weight * (req.isRequired ? 2 : 1)
    totalWeight += weight
    if (candidateSkillSet.has(req.skillName.toLowerCase())) {
      earnedWeight += weight
    }
  }

  if (totalWeight === 0) return 0
  return Math.round((earnedWeight / totalWeight) * 1000) / 10
}

export function diffSkills(candidateSkills, skillRequirements) {
  const candidateSkillSet = new Set(candidateSkills.map(s => s.toLowerCase()))

  const sorted = [...skillRequirements].sort((a, b) => {
    if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1
    return b.weight - a.weight
  })

  const present = sorted.filter(r => candidateSkillSet.has(r.skillName.toLowerCase())).map(r => r.skillName)
  const missing = sorted.filter(r => !candidateSkillSet.has(r.skillName.toLowerCase())).map(r => r.skillName)

  return { present, missing }
}
