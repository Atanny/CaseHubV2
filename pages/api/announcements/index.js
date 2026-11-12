import supabase from '@server/db/supabase'
import { rejectIfNoDb } from '@server/http/guards'
import { authorize } from '@server/http/auth'
export default async function handler(req, res) {
  if (rejectIfNoDb(res)) return
  if (!(await authorize(req, res, {}))) return
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data)
    }
    if (req.method === 'POST') {
      const { title, body, badge, author, image_url } = req.body
      if (!title) return res.status(400).json({ error: 'title required' })
      const { data, error } = await supabase.from('announcements').insert([{ title, body, badge: badge || 'info', author, image_url: image_url || null }]).select().single()
      if (error) throw error
      return res.status(201).json(data)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[announcements]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
