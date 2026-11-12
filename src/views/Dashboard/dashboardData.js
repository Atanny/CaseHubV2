// Pure calculations behind the dashboard (kept out of the component so they can be unit tested).

export const TYPE_COLORS = { siteComment: '#4760ff', inbound: '#8a38f5', bundle: '#58a767' }
export const STAGE_COLORS = { build: '#c54446', preLive: '#ff8a1f', postLive: '#ecbd0b' }
export const WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const sameDay = (a, b) => a.toDateString() === b.toDateString()
const pct = (value, total) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0)

// Monday 00:00 of the week containing `date`.
export function startOfWeek(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

// Round a chart maximum up to a value that divides evenly into four gridlines (minimum 4).
export function niceAxisMax(max) {
  return Math.max(4, Math.ceil(max / 4) * 4)
}

export function severityLabel(c) {
  const level = c._caseComplexity || 'minor'
  return level === 'major' ? 'Major' : level === 'complex' ? 'Complex' : 'Minor'
}

export function caseTypeKey(c) {
  if (Array.isArray(c._bundledWith) && c._bundledWith.length) return 'bundle'
  return c._mode === 'inbound' ? 'inbound' : 'siteComment'
}

export function caseBadge(c) {
  const key = caseTypeKey(c)
  const name = key === 'inbound' ? 'Inbound Email' : key === 'bundle' ? 'Bundle' : 'Site Comment'
  return { key, text: `${name} - ${severityLabel(c)}`, color: TYPE_COLORS[key] }
}

export function computeDashboardStats(savedCases, now = new Date()) {
  const total = savedCases.length
  const today = savedCases.filter((c) => sameDay(new Date(c.savedAt), now)).length
  const siteComments = savedCases.filter((c) => c._mode === 'siteComment').length
  const inbound = savedCases.filter((c) => c._mode === 'inbound').length
  const bundles = savedCases.filter((c) => Array.isArray(c._bundledWith) && c._bundledWith.length).length

  const weekStart = startOfWeek(now)
  const completedThisWeek = savedCases.filter(
    (c) => c.checklist && Object.values(c.checklist).every(Boolean) && new Date(c.savedAt) >= weekStart
  ).length

  // Cases saved on each day of the current week (Mon..Sun); days still to come are null.
  const weekCounts = WEEK_LABELS.map((_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    if (day > now && !sameDay(day, now)) return null
    return savedCases.filter((c) => sameDay(new Date(c.savedAt), day)).length
  })

  const slices = [
    { key: 'siteComment', label: 'Site Comment', value: siteComments },
    { key: 'inbound', label: 'Inbound', value: inbound },
    { key: 'bundle', label: 'Bundle', value: bundles },
  ].map((s) => ({ ...s, color: TYPE_COLORS[s.key], pct: pct(s.value, siteComments + inbound + bundles) }))

  // Build and Pre-Live screens are not built yet, so every saved case is a post-live case.
  const stages = [
    { key: 'build', label: 'Build', value: 0 },
    { key: 'preLive', label: 'Pre-Live', value: 0 },
    { key: 'postLive', label: 'Post-Live', value: total },
  ].map((s) => ({ ...s, color: STAGE_COLORS[s.key], pct: pct(s.value, total) }))

  const latest = [...savedCases]
    .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    .slice(0, 3)

  return { total, today, siteComments, inbound, bundles, completedThisWeek, weekCounts, slices, stages, latest }
}
