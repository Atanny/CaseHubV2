import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize, rowOwner } from '@server/http/auth'

export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, { owner: rowOwner('archived_drafts', 'user_email', (r) => r.query.id) }))) return
  const { id } = req.query
  try {
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('archived_drafts').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[archived-drafts/id]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
