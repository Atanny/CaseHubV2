import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize, rowOwner } from '@server/http/auth'
export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, { owner: rowOwner('links', 'user_email', (r) => r.query.id) }))) return
  const { id } = req.query
  try {
    if (req.method === 'PUT') {
      const { title, url, icon } = req.body
      const { data, error } = await supabase.from('links').update({ title, url, icon }).eq('id', id).select().single()
      if (error) throw error
      return res.status(200).json(data)
    }
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('links').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
