import { beforeEach, describe, expect, it, vi } from 'vitest'

// Controllable stand-in for the Supabase client used by server/http/auth.js
const state = vi.hoisted(() => ({ client: null }))
vi.mock('@server/db/supabase', () => ({
  get default() { return state.client },
}))

import { authorize, clearTokenCache, getAuthMode, ownerFromQueryOrEmail, ownerFromQueryOrUserEmail, rowOwner } from '@server/http/auth'

const makeClient = ({ users = {}, rows = {} } = {}) => ({
  auth: { getUser: vi.fn(async (token) => (users[token] ? { data: { user: { email: users[token] } }, error: null } : { data: { user: null }, error: { message: 'bad jwt' } })) },
  from: (table) => ({
    select: () => ({
      eq: (_col, id) => ({ maybeSingle: async () => ({ data: rows[`${table}:${id}`] ?? null }) }),
    }),
  }),
})

const mkRes = () => {
  const res = { code: null, body: null }
  res.status = (c) => { res.code = c; return res }
  res.json = (b) => { res.body = b; return res }
  return res
}
const req = (extra = {}) => ({ method: 'GET', url: '/api/x', headers: {}, query: {}, body: {}, ...extra })

beforeEach(() => {
  delete process.env.API_AUTH_MODE
  clearTokenCache()
  state.client = makeClient({ users: { good: 'Jane@Example.com', other: 'bob@example.com' } })
})

describe('getAuthMode', () => {
  it('defaults to off and ignores unknown values', () => {
    expect(getAuthMode()).toBe('off')
    process.env.API_AUTH_MODE = 'nonsense'
    expect(getAuthMode()).toBe('off')
    process.env.API_AUTH_MODE = 'ENFORCE'
    expect(getAuthMode()).toBe('enforce')
  })
})

describe('authorize in off mode (default)', () => {
  it('allows everything without touching Supabase', async () => {
    const res = mkRes()
    expect(await authorize(req(), res)).toBe(true)
    expect(state.client.auth.getUser).not.toHaveBeenCalled()
    expect(res.code).toBeNull()
  })
})

describe('authorize in enforce mode', () => {
  beforeEach(() => { process.env.API_AUTH_MODE = 'enforce' })

  it('rejects a missing token with 401', async () => {
    const res = mkRes()
    expect(await authorize(req(), res)).toBe(false)
    expect(res.code).toBe(401)
    expect(res.body.error).toMatch(/required/i)
  })

  it('rejects an invalid token with 401', async () => {
    const res = mkRes()
    expect(await authorize(req({ headers: { authorization: 'Bearer nope' } }), res)).toBe(false)
    expect(res.code).toBe(401)
  })

  it('accepts a valid token', async () => {
    const res = mkRes()
    expect(await authorize(req({ headers: { authorization: 'Bearer good' } }), res)).toBe(true)
    expect(res.code).toBeNull()
  })

  it('compares owner emails case-insensitively', async () => {
    const res = mkRes()
    const r = req({ headers: { authorization: 'Bearer good' }, query: { email: 'JANE@example.COM' } })
    expect(await authorize(r, res, { owner: ownerFromQueryOrEmail })).toBe(true)
  })

  it('rejects acting on someone else with 403', async () => {
    const res = mkRes()
    const r = req({ headers: { authorization: 'Bearer good' }, query: { email: 'bob@example.com' } })
    expect(await authorize(r, res, { owner: ownerFromQueryOrEmail })).toBe(false)
    expect(res.code).toBe(403)
  })

  it('reads the owner from body.userEmail on writes', async () => {
    const res = mkRes()
    const r = req({ method: 'POST', headers: { authorization: 'Bearer good' }, body: { userEmail: 'bob@example.com' } })
    expect(await authorize(r, res, { owner: ownerFromQueryOrUserEmail })).toBe(false)
    expect(res.code).toBe(403)
  })

  it('checks the owner of an existing row (rowOwner)', async () => {
    state.client = makeClient({ users: { good: 'jane@example.com' }, rows: { 'cases:7': { user_email: 'bob@example.com' }, 'cases:8': { user_email: 'jane@example.com' } } })
    const owner = rowOwner('cases', 'user_email', (r) => r.query.id)
    const bad = mkRes()
    expect(await authorize(req({ headers: { authorization: 'Bearer good' }, query: { id: '7' } }), bad, { owner })).toBe(false)
    expect(bad.code).toBe(403)
    expect(await authorize(req({ headers: { authorization: 'Bearer good' }, query: { id: '8' } }), mkRes(), { owner })).toBe(true)
  })

  it('does not block when the row does not exist (handler reports not-found)', async () => {
    const owner = rowOwner('cases', 'user_email', (r) => r.query.id)
    expect(await authorize(req({ headers: { authorization: 'Bearer good' }, query: { id: '999' } }), mkRes(), { owner })).toBe(true)
  })

  it('caches validated tokens so Supabase is not called on every request', async () => {
    const r = () => req({ headers: { authorization: 'Bearer good' } })
    await authorize(r(), mkRes()); await authorize(r(), mkRes()); await authorize(r(), mkRes())
    expect(state.client.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('answers 503 when the database client is unavailable', async () => {
    state.client = null
    const res = mkRes()
    expect(await authorize(req({ headers: { authorization: 'Bearer good' } }), res)).toBe(false)
    expect(res.code).toBe(503)
  })
})

describe('authorize in log mode', () => {
  it('lets the request through but logs what would be rejected', async () => {
    process.env.API_AUTH_MODE = 'log'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = mkRes()
    expect(await authorize(req(), res)).toBe(true)
    expect(res.code).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[api-auth] would reject'))
    warn.mockRestore()
  })
})
