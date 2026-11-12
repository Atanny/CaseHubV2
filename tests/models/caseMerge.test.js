// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { cacheCaseExtras, mergeSavedCase } from '@/models/caseMerge'

beforeEach(() => localStorage.clear())

describe('mergeSavedCase', () => {
  it('prefers the saved (API) values', () => {
    const m = mergeSavedCase({ caseNum: '1', customerName: 'Local' }, { customerName: 'Server' })
    expect(m.customerName).toBe('Server')
  })
  it('falls back to the payload for fields the API did not return', () => {
    const m = mergeSavedCase({ customerName: 'Local', businessName: 'Acme', trackerChecklistLink: 'http://t' }, {})
    expect(m.customerName).toBe('Local')
    expect(m.businessName).toBe('Acme')
    expect(m.trackerChecklistLink).toBe('http://t')
  })
  it('keeps payload entries/images when the API returns empty lists', () => {
    const m = mergeSavedCase({ entries: [{ id: 1 }], images: [{ url: 'a' }], backupImages: [{ url: 'b' }] }, { entries: [], images: [], backupImages: [] })
    expect(m.entries).toHaveLength(1)
    expect(m.images).toHaveLength(1)
    expect(m.backupImages).toHaveLength(1)
  })
  it('uses ?? for inProgress so an explicit false from the API is respected', () => {
    expect(mergeSavedCase({ inProgress: true }, { inProgress: false }).inProgress).toBe(false)
    expect(mergeSavedCase({ inProgress: true }, {}).inProgress).toBe(true)
    expect(mergeSavedCase({}, {}).inProgress).toBe(false)
  })
})

describe('cacheCaseExtras', () => {
  it('stores extras keyed by case number and preserves earlier entries', () => {
    cacheCaseExtras({ caseNum: '1', customerName: 'A' })
    cacheCaseExtras({ caseNum: '2', customerName: 'B' })
    const cache = JSON.parse(localStorage.getItem('ch_case_extra_cache'))
    expect(Object.keys(cache).sort()).toEqual(['1', '2'])
    expect(cache['1'].customerName).toBe('A')
  })
  it('ignores cases without a number and survives corrupt cache data', () => {
    cacheCaseExtras({ customerName: 'A' })
    expect(localStorage.getItem('ch_case_extra_cache')).toBeNull()
    localStorage.setItem('ch_case_extra_cache', '{not json')
    expect(() => cacheCaseExtras({ caseNum: '3' })).not.toThrow()
  })
})
