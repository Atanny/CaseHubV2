import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ client: null }))
vi.mock('@server/db/supabase', () => ({
  get default() { return state.client },
}))

import { clearTokenCache } from '@server/http/auth'
import { caseToDb, dbToCase } from '@server/mappers/caseMapper'
import casesIndex from '../../pages/api/cases/index.js'
import caseById from '../../pages/api/cases/[id].js'
import announcements from '../../pages/api/announcements/index.js'
import requestors from '../../pages/api/requestors/index.js'
import sessions from '../../pages/api/sessions/index.js'

// Any query-builder chain resolves to `result`; `.maybeSingle()/.single()` too.
const chain = (result) => new Proxy(function () {}, {
  get(_, key) {
    if (key === 'then') return (resolve) => resolve(result)
    if (key === 'maybeSingle' || key === 'single') return async () => result
    return () => chain(result)
  },
  apply: () => chain(result),
})
const makeClient = ({ users = {}, result = { data: [], error: null }, rowResult = result } = {}) => ({
  auth: { getUser: async (t) => (users[t] ? { data: { user: { email: users[t] } }, error: null } : { data: { user: null }, error: { message: 'x' } }) },
  from: () => ({ select: () => chain(rowResult), insert: () => chain(result), update: () => chain(result), delete: () => chain(result), upsert: () => chain(result) }),
})
const mkRes = () => {
  const res = { code: null, body: null, headers: {} }
  res.status = (c) => { res.code = c; return res }
  res.json = (b) => { res.body = b; return res }
  res.setHeader = (k, v) => { res.headers[k] = v }
  return res
}
const call = async (handler, req) => { const res = mkRes(); await handler({ method: 'GET', headers: {}, query: {}, body: {}, url: '/api/x', ...req }, res); return res }

beforeEach(() => {
  delete process.env.API_AUTH_MODE
  clearTokenCache()
  state.client = makeClient({ users: { jane: 'jane@example.com' } })
})

describe('database guard', () => {
  it('answers 503 with the original message when the client is missing', async () => {
    state.client = null
    for (const handler of [casesIndex, caseById, announcements, requestors, sessions]) {
      const res = await call(handler, {})
      expect(res.code).toBe(503)
      expect(res.body.error).toBe('Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.')
    }
  })
})

describe('/api/sessions fall-throughs', () => {
  it('returns 400 for an unknown POST action instead of hanging', async () => {
    const res = await call(sessions, { method: 'POST', body: { action: 'nope' } })
    expect(res.code).toBe(400)
    expect(res.body.error).toMatch(/Unknown action: nope/)
  })
  it('returns 405 with an Allow header for other methods', async () => {
    const res = await call(sessions, { method: 'PUT' })
    expect(res.code).toBe(405)
    expect(res.headers.Allow).toEqual(['GET', 'POST', 'DELETE'])
  })
  it('keeps existing validation', async () => {
    expect((await call(sessions, { method: 'DELETE' })).body.error).toBe('Missing id')
    expect((await call(sessions, { method: 'POST', body: { action: 'save_log' } })).body.error).toBe('Missing session_id')
  })
})

describe('API auth in off mode (default)', () => {
  it('serves requests with no token, exactly as before', async () => {
    const res = await call(casesIndex, { query: { email: 'anyone@example.com' } })
    expect(res.code).toBe(200)
  })
})

describe('API auth in enforce mode', () => {
  beforeEach(() => { process.env.API_AUTH_MODE = 'enforce' })
  const bearer = { authorization: 'Bearer jane' }

  it('rejects unauthenticated requests on every protected resource', async () => {
    for (const handler of [casesIndex, caseById, announcements, requestors, sessions]) {
      expect((await call(handler, {})).code).toBe(401)
    }
  })

  it('lets a user read their own cases', async () => {
    const res = await call(casesIndex, { headers: bearer, query: { email: 'jane@example.com' } })
    expect(res.code).toBe(200)
  })

  it("forbids reading another user's cases", async () => {
    const res = await call(casesIndex, { headers: bearer, query: { email: 'bob@example.com' } })
    expect(res.code).toBe(403)
  })

  it("forbids creating a case for another user", async () => {
    const res = await call(casesIndex, { method: 'POST', headers: bearer, body: { userEmail: 'bob@example.com', caseNum: '1' } })
    expect(res.code).toBe(403)
  })

  it("forbids deleting a case that belongs to someone else", async () => {
    state.client = makeClient({ users: { jane: 'jane@example.com' }, rowResult: { data: { user_email: 'bob@example.com' }, error: null } })
    const res = await call(caseById, { method: 'DELETE', headers: bearer, query: { id: '5' } })
    expect(res.code).toBe(403)
  })

  it('allows shared resources (announcements) for any signed-in user', async () => {
    expect((await call(announcements, { headers: bearer })).code).toBe(200)
  })

  it('checks session ownership by session_id when no email is supplied', async () => {
    state.client = makeClient({ users: { jane: 'jane@example.com' }, rowResult: { data: { email: 'bob@example.com' }, error: null } })
    const res = await call(sessions, { method: 'POST', headers: bearer, body: { action: 'save_log', session_id: 's1', log_data: [] } })
    expect(res.code).toBe(403)
  })
})

describe('caseMapper', () => {
  it('maps client -> row and back without losing data', () => {
    const row = caseToDb({ userEmail: 'a@b.c', _mode: 'inbound', caseNum: '1', entries: [{ id: 1, _file: 'x', note: 'n' }], images: [{ url: 'u', name: 'n', path: 'p' }], backupImages: [{ url: 'u2', name: 'n2' }], _bundledWith: '9' })
    expect('_file' in row.entries[0]).toBe(false)
    expect(row.bundled_with).toEqual(['9'])
    expect(row.image_urls.map((i) => i.type)).toEqual(['main', 'backup'])
    const back = dbToCase({ id: 5, mode: 'inbound', user_email: 'a@b.c', case_num: '1', entries: row.entries, image_urls: row.image_urls, bundled_with: row.bundled_with, saved_at: '2026-01-01T00:00:00Z' })
    expect(back._id).toBe(5)
    expect(back.images[0].id).toBe('p')
    expect(back.backupImages[0].id).toBe('u2')
    expect(back._bundledWith[0]).toBe('9')
  })
})
