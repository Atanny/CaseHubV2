import supabase from '../../../lib/supabase'

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  // ── GET profile ──
  if (req.method === 'GET') {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email required' })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
    return res.status(200).json(data || {})
  }

  // ── UPSERT profile — true merge, never overwrites fields not in payload ──
  if (req.method === 'POST') {
    const { email, ...fields } = req.body
    if (!email) return res.status(400).json({ error: 'email required' })

    // Fetch existing row first so we merge cleanly
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    const merged = {
      ...(existing || {}),
      ...fields,
      email,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(merged, { onConflict: 'email' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
