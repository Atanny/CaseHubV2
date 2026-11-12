import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { caseToDb, dbToCase } from '@server/mappers/caseMapper'
import { authorize, rowOwner } from '@server/http/auth'

export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, { owner: rowOwner('cases', 'user_email', (r) => r.query.id) }))) return
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
