import supabase from '../../../lib/supabase'
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  try {
    if (req.method === 'GET') {
      const { email } = req.query
      if (!email) return res.status(400).json({ error: 'email required' })
      const { data, error } = await supabase.from('links').select('*').eq('user_email', email).order('id')
      if (error) throw error
      return res.status(200).json(data)
    }
    if (req.method === 'POST') {
      const { title, url, icon, userEmail } = req.body
      if (!title || !url) return res.status(400).json({ error: 'title and url required' })
      const { data, error } = await supabase.from('links').insert([{ title, url, icon: icon || '🔗', user_email: userEmail }]).select().single()
      if (error) throw error
      return res.status(201).json(data)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
