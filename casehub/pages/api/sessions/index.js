import { createClient } from '@supabase/supabase-js';
const _url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Guard creation — createClient throws immediately if the URL is missing/invalid,
// which would otherwise crash this entire module at import time.
const sb = (_url && _key) ? createClient(_url, _key) : null;

export default async function handler(req, res) {
  if (!sb) {
    return res.status(503).json({ error: 'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.' });
  }
  const { method } = req;
  if (method === 'GET') {
    const { email, date, action, session_id } = req.query;
    // get_log: restore session log for an active session
    if (action === 'get_log' && session_id) {
      const { data, error } = await sb.from('sessions').select('session_log').eq('id', session_id).single();
      if (error || !data) return res.status(200).json({ log: [] });
      try { return res.status(200).json({ log: JSON.parse(data.session_log||'[]') }); }
      catch { return res.status(200).json({ log: [] }); }
    }
    let q = sb.from('sessions').select('*, session_cases(*), session_breaks(*)').order('time_in', { ascending: false });
    if (email) q = q.eq('email', email);
    if (date) q = q.gte('time_in', date + 'T00:00:00').lte('time_in', date + 'T23:59:59');
    const { data, error } = await q.limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (method === 'POST') {
    const { action, email, session_id, case_id, break_id, case_num, case_type, note, break_type } = req.body;
    if (action === 'time_in') {
      const { data, error } = await sb.from('sessions').insert([{ email, time_in: new Date().toISOString(), status: 'active' }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (action === 'time_out') {
      const { data, error } = await sb.from('sessions').update({ time_out: new Date().toISOString(), status: 'completed' }).eq('id', session_id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (action === 'log_case') {
      const { data, error } = await sb.from('session_cases').insert([{ session_id, email, case_num, case_type, note, started_at: new Date().toISOString() }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (action === 'close_case') {
      const { data, error } = await sb.from('session_cases').update({ ended_at: new Date().toISOString() }).eq('id', case_id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (action === 'save_log') {
      const { log_data } = req.body;
      if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
      const { error } = await sb.from('sessions').update({ session_log: JSON.stringify(log_data) }).eq('id', session_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    if (action === 'start_break') {
      const { data, error } = await sb.from('session_breaks').insert([{ session_id, email, break_type, started_at: new Date().toISOString() }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (action === 'end_break') {
      const { data, error } = await sb.from('session_breaks').update({ ended_at: new Date().toISOString() }).eq('id', break_id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
  }
  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    // Delete child records first
    await sb.from('session_cases').delete().eq('session_id', id);
    await sb.from('session_breaks').delete().eq('session_id', id);
    const { error } = await sb.from('sessions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

}
