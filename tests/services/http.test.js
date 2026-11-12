// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, getRequest, postJson } from '@/services/http'

const res = (status, data = {}) => ({ ok: status < 400, status, json: async () => data })
let fetchMock

beforeEach(() => {
  localStorage.clear()
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock
})

describe('apiFetch', () => {
  it('sends no Authorization header when logged out', async () => {
    fetchMock.mockResolvedValue(res(200))
    await getRequest('/api/links')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('attaches the stored access token as a bearer header', async () => {
    localStorage.setItem('ch_token', 'tok1')
    fetchMock.mockResolvedValue(res(200))
    await postJson('/api/cases', { a: 1 })
    const init = fetchMock.mock.calls[0][1]
    expect(init.headers.Authorization).toBe('Bearer tok1')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.method).toBe('POST')
  })

  it('refreshes once on a 401 and retries with the new token', async () => {
    localStorage.setItem('ch_token', 'old'); localStorage.setItem('ch_refresh', 'r1')
    fetchMock
      .mockResolvedValueOnce(res(401))                                              // original request
      .mockResolvedValueOnce(res(200, { access_token: 'new', refresh_token: 'r2' })) // /api/auth/refresh
      .mockResolvedValueOnce(res(200, { ok: true }))                                  // retry
    const out = await getRequest('/api/cases?email=x')
    expect(out.status).toBe(200)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refresh_token: 'r1' })
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new')
    expect(localStorage.getItem('ch_token')).toBe('new')
    expect(localStorage.getItem('ch_refresh')).toBe('r2')
  })

  it('shares ONE refresh between concurrent 401s (refresh tokens are single-use)', async () => {
    localStorage.setItem('ch_token', 'old'); localStorage.setItem('ch_refresh', 'r1')
    let refreshCalls = 0
    fetchMock.mockImplementation(async (url, init) => {
      if (url === '/api/auth/refresh') { refreshCalls++; return res(200, { access_token: 'new', refresh_token: 'r2' }) }
      return init.headers.Authorization === 'Bearer new' ? res(200) : res(401)
    })
    const results = await Promise.all([getRequest('/api/a'), getRequest('/api/b'), getRequest('/api/c')])
    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
    expect(refreshCalls).toBe(1)
  })

  it('returns the 401 when there is no refresh token', async () => {
    localStorage.setItem('ch_token', 'old')
    fetchMock.mockResolvedValue(res(401))
    const out = await getRequest('/api/links')
    expect(out.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns the original 401 when the refresh itself fails', async () => {
    localStorage.setItem('ch_token', 'old'); localStorage.setItem('ch_refresh', 'r1')
    fetchMock.mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(401))
    const out = await getRequest('/api/links')
    expect(out.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('never retries /api/auth/* requests', async () => {
    localStorage.setItem('ch_token', 'old'); localStorage.setItem('ch_refresh', 'r1')
    fetchMock.mockResolvedValue(res(401))
    const out = await apiFetch('/api/auth/signin', { method: 'POST' })
    expect(out.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not loop when the retry is also rejected', async () => {
    localStorage.setItem('ch_token', 'old'); localStorage.setItem('ch_refresh', 'r1')
    fetchMock.mockImplementation(async (url) => (url === '/api/auth/refresh' ? res(200, { access_token: 'new', refresh_token: 'r2' }) : res(401)))
    const out = await getRequest('/api/links')
    expect(out.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(3) // request, refresh, one retry
  })
})
