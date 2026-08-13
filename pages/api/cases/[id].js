import supabase from '../../../lib/supabase'
import { caseToDb, dbToCase } from './index'

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  const { id } = req.query
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('cases').select('*').eq('id', id).single()
      if (error) throw error
      return res.status(200).json(dbToCase(data))
    }
    if (req.method === 'PUT') {
      const { data, error } = await supabase.from('cases').update(caseToDb(req.body)).eq('id', id).select().single()
      if (error) throw error
      return res.status(200).json(dbToCase(data))
    }
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('cases').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }
    res.setHeader('Allow', ['GET','PUT','DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[cases/id]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
