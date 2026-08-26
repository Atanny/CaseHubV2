import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error('Missing Supabase URL or anon key in environment variables.');
}

// Only construct the client when both values are present, so a missing env
// var surfaces as a clear 503 from the API route instead of a crash here.
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

export default supabase;

/** Creates a client authenticated as a specific user, for update/password routes. */
export function createAuthedClient(accessToken) {
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
