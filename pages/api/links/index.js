import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize, ownerFromQueryOrUserEmail } from '@server/http/auth'
export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, { owner: ownerFromQueryOrUserEmail }))) return
  try {
    if (req.method === 'GET') {
      const { email } = req.query
      if (!email) return res.status(400).json({ error: 'email required' })
      const { data, error } = await supabase.from('links').select('*').eq('user_email', email).order('id')
      if (error) throw error
      return res.status(200).json(data)
    }
    if (req.method === 'POST') {
      const { title, url, icon, userEmail } = req.body
      if (!title || !url) return res.status(400).json({ error: 'title and url required' })
      const { data, error } = await supabase.from('links').insert([{ title, url, icon: icon || '🔗', user_email: userEmail }]).select().single()
      if (error) throw error
      return res.status(201).json(data)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
