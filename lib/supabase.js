import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// Support both old anon key format and new publishable key format
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
         || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!url || !key) {
  console.error('❌ Missing Supabase URL or API key in environment variables')
}

// Guard: only create the client when both values are present to prevent
// a client-side exception when env vars are not yet available.
const supabase = (url && key)
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

export default supabase