const KNOWN_SKILLS = [
  'Vue.js', 'Vue', 'React', 'React.js', 'Angular', 'JavaScript', 'TypeScript',
  'ASP.NET Core', '.NET', 'Node.js', 'Express', 'C#', 'SQL Server', 'SQLite',
  'MySQL', 'PostgreSQL', 'Pinia', 'Vuex', 'Redux', 'REST API', 'GraphQL',
  'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Git', 'Docker', 'Azure', 'AWS',
  'Firebase', 'AG Grid', 'Unit Testing', 'CI/CD', 'Agile', 'Scrum'
]

export function extractSkills(resumeText) {
  if (!resumeText || !resumeText.trim()) return []

  const found = []
  for (const skill of KNOWN_SKILLS) {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (pattern.test(resumeText)) found.push(skill)
  }
  return [...new Set(found)]
}
