import supabase from '@server/db/supabase'
import { caseToDb, dbToCase } from '@server/mappers/caseMapper'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize, ownerFromQueryOrUserEmail } from '@server/http/auth'

export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, { owner: ownerFromQueryOrUserEmail }))) return
  try {
    if (req.method === 'GET') {
      const { email } = req.query
      if (!email) return res.status(400).json({ error: 'email required' })
      const { data, error } = await supabase
        .from('cases').select('*').eq('user_email', email).order('saved_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data.map(dbToCase))
    }
    if (req.method === 'POST') {
      const row = caseToDb(req.body)
      if (!row.user_email) return res.status(400).json({ error: 'userEmail required' })
      const { data, error } = await supabase.from('cases').insert([row]).select().single()
      if (error) throw error
      return res.status(201).json(dbToCase(data))
    }
    res.setHeader('Allow', ['GET','POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[cases]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
