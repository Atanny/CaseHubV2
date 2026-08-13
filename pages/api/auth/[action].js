import supabase from '../../../lib/supabase'

export default async function handler(req, res) {
  const { action } = req.query

  // Fail clearly instead of crashing with "Cannot read properties of null" if
  // the Supabase client failed to initialize (missing/unloaded env vars).
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase client is not initialized — NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY was not loaded. Stop the dev server, delete the .next folder, and restart npm run dev.'
    })
  }

  try {
    // ── SIGN IN ──
    if (action === 'signin' && req.method === 'POST') {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return res.status(401).json({ error: 'Invalid email or password' })
      const meta = data.user.user_metadata || {}
      return res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: meta.name || email.split('@')[0],
          role: meta.role || 'User',
          avatarUrl: meta.avatarUrl || null,
          ...(meta.fileNames || {}),
        },
      })
    }

    // ── SIGN UP ──
    if (action === 'signup' && req.method === 'POST') {
      const { email, password, name, role } = req.body
      if (!email || !password || !name) return res.status(400).json({ error: 'Email, password and name required' })
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, role: role || 'User' } },
      })
      if (error) {
        if (error.message.includes('already')) return res.status(409).json({ error: 'Email already registered' })
        return res.status(400).json({ error: error.message })
      }
      if (!data.session) {
        return res.status(200).json({ needsConfirmation: true, message: 'Check your email to confirm your account, then sign in.' })
      }
      const meta = data.user.user_metadata || {}
      return res.status(201).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: { id: data.user.id, email: data.user.email, name: meta.name || name, role: meta.role || 'User' },
      })
    }

    // ── REFRESH ──
    if (action === 'refresh' && req.method === 'POST') {
      const { refresh_token } = req.body
      if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' })
      const { data, error } = await supabase.auth.refreshSession({ refresh_token })
      if (error) return res.status(401).json({ error: 'Session expired, please sign in again' })
      const meta = data.user.user_metadata || {}
      return res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: meta.name || data.user.email.split('@')[0],
          role: meta.role || 'User',
          avatarUrl: meta.avatarUrl || null,
          ...(meta.fileNames || {}),
        },
      })
    }

    // ── UPDATE PROFILE ──
    if (action === 'update' && req.method === 'POST') {
      const { name, role, fileNames, avatarUrl, accessToken } = req.body
      if (!accessToken) return res.status(400).json({ error: 'accessToken required — please sign in again' })
      const authed = createAuthedClient(accessToken)

      // First fetch existing metadata so we don't wipe fields we're not updating
      const { data: existing, error: getErr } = await authed.auth.getUser()
      if (getErr) return res.status(401).json({ error: 'Could not fetch user — token may be expired' })

      const currentMeta = existing.user.user_metadata || {}

      // Merge: only overwrite fields we're explicitly setting
      const merged = {
        ...currentMeta,
        ...(name    !== undefined ? { name }    : {}),
        ...(role    !== undefined ? { role }    : {}),
        ...(fileNames             ? { fileNames } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      }

      const { error } = await authed.auth.updateUser({ data: merged })
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    // ── CHANGE PASSWORD ──
    if (action === 'password' && req.method === 'POST') {
      const { newPassword, accessToken } = req.body
      if (!newPassword || !accessToken) return res.status(400).json({ error: 'newPassword and accessToken required' })
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
      const authed = createAuthedClient(accessToken)
      const { error } = await authed.auth.updateUser({ password: newPassword })
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (err) {
    console.error(`[/api/auth/${action}]`, err.message)
    return res.status(500).json({ error: err.message })
  }
}

function createAuthedClient(accessToken) {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
}
