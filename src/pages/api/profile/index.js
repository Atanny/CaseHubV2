import supabase from '../../../lib/supabase';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check your env vars and restart the dev server.' });
  }

  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    return res.status(200).json(data || {});
  }

  if (req.method === 'POST') {
    const { email, ...fields } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    // Merge with the existing row so a partial save (e.g. avatar only) never
    // clobbers fields not present in this payload.
    const { data: existing } = await supabase.from('profiles').select('*').eq('email', email).single();
    const merged = { ...(existing || {}), ...fields, email, updated_at: new Date().toISOString() };

    const { data, error } = await supabase.from('profiles').upsert(merged, { onConflict: 'email' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
