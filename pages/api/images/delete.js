import supabase from '../../../lib/supabase'
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  if (req.method !== 'DELETE') return res.status(405).end()
  try {
    const { path } = req.body
    if (!path) return res.status(400).json({ error: 'path required' })
    const { error } = await supabase.storage.from('case-images').remove([path])
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
