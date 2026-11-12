import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize } from '@server/http/auth'
export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, {}))) return
  const { name } = req.query
  try {
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('requestors').delete().eq('name', name)
      if (error) throw error
      return res.status(200).json({ success: true })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
