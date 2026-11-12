import { describe, expect, it } from 'vitest'
import { caseBadge, computeDashboardStats, niceAxisMax, startOfWeek } from '@/views/Dashboard/dashboardData'

const NOW = new Date(2026, 6, 23, 12, 0) // Thu 23 Jul 2026
const at = (d, h = 10) => new Date(2026, 6, d, h).toISOString()
const mk = (over) => ({ _mode: 'siteComment', savedAt: at(23), checklist: { a: true }, ...over })

describe('week helpers', () => {
  it('starts the week on Monday', () => {
    const s = startOfWeek(NOW)
    expect([s.getDay(), s.getDate(), s.getHours()]).toEqual([1, 20, 0])
    expect(startOfWeek(new Date(2026, 6, 26)).getDate()).toBe(20) // Sunday belongs to the same week
  })
  it('rounds the chart max up to 4 gridlines, minimum 4', () => {
    expect([niceAxisMax(0), niceAxisMax(3), niceAxisMax(5), niceAxisMax(13)]).toEqual([4, 4, 8, 16])
  })
})

describe('computeDashboardStats', () => {
  const cases = [
    mk({ _id: 1 }),
    mk({ _id: 2, _mode: 'inbound', savedAt: at(22) }),
    mk({ _id: 3, _bundledWith: ['x'], savedAt: at(20) }),
    mk({ _id: 4, savedAt: at(10), checklist: { a: false } }),
  ]
  const s = computeDashboardStats(cases, NOW)

  it('counts totals, today and this-week completions', () => {
    expect([s.total, s.today]).toEqual([4, 1])
    expect(s.completedThisWeek).toBe(3) // the 10 Jul case is last week; the others are complete
  })
  it('counts cases per day for the current week and leaves future days empty', () => {
    expect(s.weekCounts).toEqual([1, 0, 1, 1, null, null, null]) // Mon 20, Tue, Wed 22, Thu 23, then future
  })
  it('splits types and computes percentages that follow the case type', () => {
    expect(s.slices.map((x) => [x.key, x.value])).toEqual([['siteComment', 3], ['inbound', 1], ['bundle', 1]])
    expect(s.slices[0].pct).toBe(60)
  })
  it('attributes every saved case to post-live while Build/Pre-Live are not built', () => {
    expect(s.stages.map((x) => [x.key, x.value, x.pct])).toEqual([['build', 0, 0], ['preLive', 0, 0], ['postLive', 4, 100]])
  })
  it('lists the three most recent cases first', () => {
    expect(s.latest.map((c) => c._id)).toEqual([1, 2, 3])
  })
  it('is safe with no cases', () => {
    const e = computeDashboardStats([], NOW)
    expect([e.total, e.today, e.completedThisWeek]).toEqual([0, 0, 0])
    expect(e.slices.every((x) => x.pct === 0)).toBe(true)
  })
})

describe('caseBadge', () => {
  it('combines type and severity', () => {
    expect(caseBadge({ _mode: 'inbound', _caseComplexity: 'major' }).text).toBe('Inbound Email - Major')
    expect(caseBadge({ _mode: 'siteComment' }).text).toBe('Site Comment - Minor')
    expect(caseBadge({ _mode: 'siteComment', _bundledWith: ['1'], _caseComplexity: 'complex' }).text).toBe('Bundle - Complex')
  })
})
