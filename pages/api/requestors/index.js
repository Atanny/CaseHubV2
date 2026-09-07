import supabase from '../../../lib/supabase'
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('requestors').select('*').order('name')
      if (error) throw error
      return res.status(200).json(data.map(r => r.name))
    }
    if (req.method === 'POST') {
      const { name } = req.body
      if (!name) return res.status(400).json({ error: 'name required' })
      const { error } = await supabase.from('requestors').insert([{ name }])
      if (error) throw error
      return res.status(201).json({ success: true, name })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
