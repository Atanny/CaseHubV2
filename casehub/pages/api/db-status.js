import supabase from '../../lib/supabase'
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!supabase) {
    return res.status(503).json({ ok: false, error: 'Supabase client is not initialized — NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY was not loaded by the server process. Stop npm run dev, delete the .next folder, and restart.' })
  }
  try {
    const { error } = await supabase.from('requestors').select('id').limit(1)
    if (error) throw error
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message })
  }
}
