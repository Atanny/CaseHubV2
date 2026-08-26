import supabase from '../../../lib/supabase';

/**
 * Read + delete side of the sessions API, needed by the Session Log page.
 * The write actions (time_in, time_out, log_case, start_break, etc.) belong
 * to the break-timer / shift-alarm system, which is its own milestone — this
 * route accepts the same `action` query params so that milestone can extend
 * it without changing the contract Session Log already depends on.
 */
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check your env vars and restart the dev server.' });
  }
  const { method } = req;

  if (method === 'GET') {
    const { email, date, action, session_id } = req.query;
    if (action === 'get_log' && session_id) {
      const { data, error } = await supabase.from('sessions').select('session_log').eq('id', session_id).single();
      if (error || !data) return res.status(200).json({ log: [] });
      try {
        return res.status(200).json({ log: JSON.parse(data.session_log || '[]') });
      } catch {
        return res.status(200).json({ log: [] });
      }
    }
    let q = supabase.from('sessions').select('*, session_cases(*), session_breaks(*)').order('time_in', { ascending: false });
    if (email) q = q.eq('email', email);
    if (date) q = q.gte('time_in', `${date}T00:00:00`).lte('time_in', `${date}T23:59:59`);
    const { data, error } = await q.limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await supabase.from('session_cases').delete().eq('session_id', id);
    await supabase.from('session_breaks').delete().eq('session_id', id);
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
