import supabase from '@server/db/supabase'

/**
 * Opt-in API authentication.
 *
 *   API_AUTH_MODE=off      (default) no checks, identical to the pre-auth behavior
 *   API_AUTH_MODE=log      verify tokens and ownership, only log what WOULD be rejected
 *   API_AUTH_MODE=enforce  reject with 401 (no/invalid token) or 403 (not the owner)
 *
 * Rollout: deploy with `off`, then `log` and watch the logs for "[api-auth] would reject",
 * then switch to `enforce`. The client sends `Authorization: Bearer <access token>` (see
 * src/services/http.js) and transparently refreshes the token once on a 401.
 */
export const getAuthMode = () => {
  const mode = String(process.env.API_AUTH_MODE || 'off').toLowerCase()
  return mode === 'log' || mode === 'enforce' ? mode : 'off'
}

const TOKEN_CACHE_MS = 60 * 1000
const tokenCache = new Map() // token -> { email, until }

export const clearTokenCache = () => tokenCache.clear()

const readBearer = (req) => {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(String(header))
  return match ? match[1].trim() : null
}

async function resolveEmail(token) {
  const cached = tokenCache.get(token)
  if (cached && cached.until > Date.now()) return cached.email
  const { data, error } = await supabase.auth.getUser(token)
  const email = !error && data?.user?.email ? String(data.user.email).toLowerCase() : null
  if (email) tokenCache.set(token, { email, until: Date.now() + TOKEN_CACHE_MS })
  else tokenCache.delete(token)
  return email
}

/**
 * Builds an `owner` resolver that looks up who owns a row, e.g.
 *   authorize(req, res, { owner: rowOwner('cases', 'user_email', (r) => r.query.id) })
 * A missing row resolves to null (no ownership constraint; the handler reports not-found itself).
 */
export const rowOwner = (table, column, getId) => async (req) => {
  const id = getId(req)
  if (id === undefined || id === null || id === '') return null
  const { data } = await supabase.from(table).select(column).eq('id', id).maybeSingle()
  return data?.[column] ?? null
}

async function evaluate(req, owner) {
  if (!supabase) return { ok: false, status: 503, error: 'Auth backend unavailable' }
  const token = readBearer(req)
  if (!token) return { ok: false, status: 401, error: 'Authentication required' }
  const email = await resolveEmail(token)
  if (!email) return { ok: false, status: 401, error: 'Invalid or expired token' }
  if (owner) {
    const expected = await owner(req)
    if (expected && String(expected).toLowerCase() !== email) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
  }
  return { ok: true, email }
}

/**
 * Returns true when the handler may continue. When it returns false a response was already sent.
 * `owner` is an optional (req) => email | Promise<email|null>: the user the request acts on behalf of.
 */
export async function authorize(req, res, { owner = null } = {}) {
  const mode = getAuthMode()
  if (mode === 'off') return true
  const result = await evaluate(req, owner)
  if (result.ok) return true
  if (mode === 'log') {
    console.warn(`[api-auth] would reject ${req.method} ${req.url}: ${result.status} ${result.error}`)
    return true
  }
  res.status(result.status).json({ error: result.error })
  return false
}

// Common owner resolvers -----------------------------------------------------------------------

// GET ?email=...  |  POST body { userEmail }
export const ownerFromQueryOrUserEmail = (req) =>
  req.method === 'GET' || req.method === 'DELETE' ? req.query?.email : req.body?.userEmail

// GET ?email=...  |  POST body { email }
export const ownerFromQueryOrEmail = (req) =>
  req.method === 'GET' ? req.query?.email : req.body?.email
