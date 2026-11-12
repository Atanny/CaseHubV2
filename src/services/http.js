// Thin wrappers over fetch for the app's own JSON API routes.
// They return the raw Response promise (same contract as fetch) so callers keep
// control over status handling.
//
// Every request carries the user's access token (`Authorization: Bearer ...`). The server only
// checks it when API_AUTH_MODE is `log` or `enforce`. If the server answers 401 the token has
// most likely expired mid-session, so we refresh it once and retry.

import { storage } from './storage'

const JSON_HEADERS = { 'Content-Type': 'application/json' }
const TOKEN_KEY = 'ch_token'
const REFRESH_KEY = 'ch_refresh'

let refreshInFlight = null

// Refresh tokens are single-use, so concurrent 401s must share ONE refresh request.
function refreshTokens() {
  const refreshToken = storage.get(REFRESH_KEY)
  if (!refreshToken) return Promise.resolve(false)
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (!res.ok) return false
        const data = await res.json()
        if (!data.access_token) return false
        storage.set(TOKEN_KEY, data.access_token)
        if (data.refresh_token) storage.set(REFRESH_KEY, data.refresh_token)
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

export async function apiFetch(url, init = {}) {
  const send = () => {
    const token = storage.get(TOKEN_KEY)
    const headers = { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    return fetch(url, { ...init, headers })
  }
  const res = await send()
  // Auth endpoints never need (or get) a token refresh retry.
  if (res.status !== 401 || String(url).startsWith('/api/auth/')) return res
  return (await refreshTokens()) ? send() : res
}

export const getRequest = (url) => apiFetch(url)

export const postJson = (url, body) =>
  apiFetch(url, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) })

export const putJson = (url, body) =>
  apiFetch(url, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(body) })

export const deleteRequest = (url) => apiFetch(url, { method: 'DELETE' })

// Query-string helper for the common `?email=` filter.
export const withEmail = (path, email) => `${path}?email=${encodeURIComponent(email)}`
