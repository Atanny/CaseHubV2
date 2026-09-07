import supabase from '../../../lib/supabase'
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  const { id } = req.query
  try {
    if (req.method === 'PUT') {
      const { title, body, badge, image_url } = req.body
      const updates = { title, body, badge }
      if (image_url !== undefined) updates.image_url = image_url
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json(data)
    }
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
