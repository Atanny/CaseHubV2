import supabase from '../../../lib/supabase'

function mapArchived(r) {
  const bundledWith = r.bundled_with ?? r.draft_data?._bundledWith ?? null
  return {
    ...r.draft_data,
    _id: r.id,
    _mode: r.mode,
    archivedAt: new Date(r.archived_at).toLocaleString(),
    savedAt: r.saved_at ? new Date(r.saved_at).toLocaleString() : null,
    _bundledWith: bundledWith
      ? (Array.isArray(bundledWith) ? bundledWith : [bundledWith]).filter(Boolean)
      : null,
  }
}

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  try {
    if (req.method === 'GET') {
      const { email } = req.query
      if (!email) return res.status(400).json({ error: 'email required' })
      const { data, error } = await supabase
        .from('archived_drafts')
        .select('*')
        .eq('user_email', email)
        .order('archived_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data.map(mapArchived))
    }

    if (req.method === 'POST') {
      // Archive a suspended draft: caller sends the full draft row
      const { userEmail, mode, draftData, savedAt } = req.body
      if (!userEmail || !mode) return res.status(400).json({ error: 'userEmail and mode required' })

      const bundledWith = draftData?._bundledWith
        ? (Array.isArray(draftData._bundledWith) ? draftData._bundledWith : [draftData._bundledWith]).filter(Boolean)
        : null

      const { data, error } = await supabase
        .from('archived_drafts')
        .insert([{
          user_email: userEmail,
          mode,
          draft_data: draftData,
          bundled_with: bundledWith,
          saved_at: savedAt || null,
          archived_at: new Date().toISOString(),
        }])
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(mapArchived(data))
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[archived-drafts]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
