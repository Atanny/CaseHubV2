import supabase from '../../../lib/supabase'

function mapDraft(r) {
  const bundledWith = r.bundled_with ?? r.draft_data?._bundledWith ?? null
  return {
    ...r.draft_data,
    _id: r.id,
    _mode: r.mode,
    draftAt: new Date(r.saved_at).toLocaleString(),
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
        .from('drafts').select('*').eq('user_email', email).order('saved_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data.map(mapDraft))
    }

    if (req.method === 'POST') {
      const { userEmail, mode, draftData } = req.body
      if (!userEmail || !mode) return res.status(400).json({ error: 'userEmail and mode required' })
      const savedAt = new Date().toISOString()
      const caseNum = String(draftData?.caseNum || '').trim()
      let existingId = null

      if (caseNum) {
        const { data: existingDrafts, error: lookupError } = await supabase
          .from('drafts')
          .select('id, mode, draft_data')
          .eq('user_email', userEmail)
        if (lookupError) throw lookupError
        const sameCase = (existingDrafts || []).find(r => String(r?.draft_data?.caseNum || '').trim() === caseNum)
        if (sameCase?.id) existingId = sameCase.id
      }

      if (!existingId) {
        const { data: sameModeDraft, error: modeLookupError } = await supabase
          .from('drafts')
          .select('id')
          .eq('user_email', userEmail)
          .eq('mode', mode)
          .maybeSingle()
        if (modeLookupError) throw modeLookupError
        if (sameModeDraft?.id) existingId = sameModeDraft.id
      }

      // _bundledWith lives inside draft_data (the JSONB blob) — no separate column needed for suspend to work.
      // The bundled_with column (added via migration) is populated separately for querying convenience,
      // but we only write it if the column already exists to avoid breaking suspend before migration runs.
      const basePayload = {
        user_email: userEmail,
        mode,
        draft_data: draftData,
        saved_at: savedAt,
      }

      const query = existingId
        ? supabase.from('drafts').update(basePayload).eq('id', existingId)
        : supabase.from('drafts').insert([basePayload])

      const { data, error } = await query.select().single()
      if (error) throw error
      return res.status(200).json(mapDraft(data))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[drafts]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
