import supabase from '../../../lib/supabase'
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data)
    }
    if (req.method === 'POST') {
      const { title, body, badge, author } = req.body
      if (!title) return res.status(400).json({ error: 'title required' })
      const { data, error } = await supabase.from('announcements').insert([{ title, body, badge: badge || 'info', author }]).select().single()
      if (error) throw error
      return res.status(201).json(data)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[announcements]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
