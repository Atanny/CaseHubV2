import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize, rowOwner } from '@server/http/auth'
export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, { owner: rowOwner('drafts', 'user_email', (r) => r.query.id) }))) return
  const { id } = req.query
  try {
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('drafts').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }
    if (req.method === 'PUT') {
      const { draftData } = req.body
      if (!draftData) return res.status(400).json({ error: 'Missing draftData' })
      const { error } = await supabase
        .from('drafts')
        .update({ draft_data: draftData })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json({ ...draftData, _id: id })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
