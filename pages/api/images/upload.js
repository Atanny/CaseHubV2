import supabase from '../../../lib/supabase'
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' })
  }
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { fileBase64, fileName, mimeType } = req.body
    if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 and fileName required' })
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = mimeType?.split('/')[1] || 'png'
    const path = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`
    const { error } = await supabase.storage.from('case-images').upload(path, buffer, { contentType: mimeType || 'image/png', upsert: false })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('case-images').getPublicUrl(path)
    return res.status(200).json({ url: urlData.publicUrl, path, name: fileName, id: path })
  } catch (err) {
    console.error('[images/upload]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
