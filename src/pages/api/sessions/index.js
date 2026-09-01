import supabase from '../../../lib/supabase';

/**
 * Sessions API — read/delete (used by Session Log) plus the write actions
 * ported from the legacy app's AppContext.jsx: time_in, time_out, log_case,
 * save_log, start_break, end_break. Same action names and payload shape as
 * the legacy /api/sessions endpoint, so useSessionTimer's calls line up
 * directly.
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

  if (method === 'POST') {
    const { action } = req.body || {};

    if (action === 'time_in') {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });
      const { data, error } = await supabase.from('sessions').insert([{ email, time_in: new Date().toISOString() }]).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ id: data.id });
    }

    if (action === 'time_out') {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ error: 'session_id required' });
      const { error } = await supabase.from('sessions').update({ time_out: new Date().toISOString() }).eq('id', session_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'log_case') {
      const { session_id, case_num, case_type, note } = req.body;
      if (!session_id) return res.status(400).json({ error: 'session_id required' });
      const { error } = await supabase.from('session_cases').insert([{ session_id, case_num, case_type, note, started_at: new Date().toISOString(), ended_at: new Date().toISOString() }]);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'save_log') {
      const { session_id, log_data } = req.body;
      if (!session_id) return res.status(400).json({ error: 'session_id required' });
      const { error } = await supabase.from('sessions').update({ session_log: JSON.stringify(log_data || []) }).eq('id', session_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'start_break') {
      const { session_id, break_type } = req.body;
      if (!session_id) return res.status(400).json({ error: 'session_id required' });
      const { data, error } = await supabase.from('session_breaks').insert([{ session_id, break_type, started_at: new Date().toISOString() }]).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ id: data.id });
    }

    if (action === 'end_break') {
      const { break_id } = req.body;
      if (!break_id) return res.status(400).json({ error: 'break_id required' });
      const { error } = await supabase.from('session_breaks').update({ ended_at: new Date().toISOString() }).eq('id', break_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
