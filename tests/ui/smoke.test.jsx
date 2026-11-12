// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseHubApp } from '@/core/CaseHubApp'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const USER = { id: 'u1', email: 'jane@example.com', name: 'Jane Doe', role: 'Analyst' }
const DATA = {
  cases: [{ _id: 'c1', _mode: 'siteComment', userEmail: USER.email, caseNum: '10001', accountNum: 'A-1', amendType: 'Edit', entries: [{ id: 'e1', number: '1', note: 'Updated hours', clarification: '' }], devices: {}, checklist: {}, images: [], backupImages: [], savedAt: '10/30/2026, 3:00:00 PM' }],
  announcements: [{ id: 1, title: 'Welcome', body: 'Hello team', badge: 'info', author: 'Admin', created_at: '2026-10-30T10:00:00Z' }],
  links: [{ id: 1, title: 'Tracker', url: 'https://tracker.example', icon: 'T' }],
  requestors: ['Alice VIP'],
  profile: { email: USER.email, name: USER.name, role: 'Analyst', greeting_messages: [] },
}

const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data, text: async () => JSON.stringify(data) })
const apiMock = async (url, init = {}) => {
  const u = String(url)
  const method = (init.method || 'GET').toUpperCase()
  if (u.startsWith('/api/auth/refresh')) return json({ access_token: 't2', refresh_token: 'r2', user: USER })
  if (u.startsWith('/api/cases')) return json(method === 'GET' ? DATA.cases : {})
  if (u.startsWith('/api/announcements')) return json(DATA.announcements)
  if (u.startsWith('/api/links')) return json(DATA.links)
  if (u.startsWith('/api/requestors')) return json(DATA.requestors)
  if (u.startsWith('/api/profile')) return json(DATA.profile)
  if (u.startsWith('/api/sessions')) return json([])
  if (u.startsWith('/api/db-status')) return json({ ok: true })
  return json(method === 'GET' ? [] : {})
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let container, root, errors

async function mount() {
  container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => { root = createRoot(container); root.render(createElement(CaseHubApp)) })
  for (let i = 0; i < 8; i++) await act(async () => { await sleep(30) })
}

beforeEach(() => {
  errors = []
  localStorage.clear()
  globalThis.fetch = vi.fn(apiMock)
  vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map(String).join(' ').slice(0, 200)))
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
  Element.prototype.scrollTo = () => {}
  HTMLElement.prototype.scrollIntoView = () => {}
})
afterEach(async () => {
  await act(async () => root?.unmount())
  container?.remove()
  vi.restoreAllMocks()
})

const signedIn = (page) => {
  localStorage.setItem('ch_user', JSON.stringify(USER))
  localStorage.setItem('ch_refresh', 'r1')
  localStorage.setItem('ch_token', 't1')
  if (page) localStorage.setItem('ch_page', page)
}

describe('CaseHubApp smoke', () => {
  it('shows the login screen when signed out', async () => {
    await mount()
    expect(container.textContent).toMatch(/login/i)
    expect(container.querySelector('.rail')).toBeNull()
    expect(errors).toEqual([])
  })

  const pages = [
    ['dashboard', /Dashboard/], ['history', /Case History/], ['announcements', /Welcome/], ['links', /Tracker/],
    ['profile', /Jane/], ['sessions', /Session/], ['filenames', /File Name/], ['archives', /Archive/],
    ['build', /Build/], ['prelive', /Pre-Live/], ['postlive', /Post-Live/],
  ]
  it.each(pages)('renders the %s screen for a signed-in user', async (page, expected) => {
    signedIn(page)
    await mount()
    expect(container.querySelector('.rail')).not.toBeNull()
    expect(container.textContent).toMatch(expected)
    expect(errors).toEqual([])
  })

  it('sends the access token with API calls', async () => {
    signedIn('dashboard')
    await mount()
    const apiCalls = globalThis.fetch.mock.calls.filter(([u]) => String(u).startsWith('/api/cases'))
    expect(apiCalls.length).toBeGreaterThan(0)
    expect(apiCalls[0][1].headers.Authorization).toMatch(/^Bearer /)
  })

  it('falls back to the dashboard for an unknown saved page', async () => {
    signedIn('definitely-not-a-page')
    await mount()
    expect(container.textContent).toMatch(/Dashboard/)
  })
})
