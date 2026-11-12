import supabase from '@server/db/supabase'

export const DB_NOT_READY_MESSAGE =
  'Supabase client is not initialized — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the dev server.'

// Sends a 503 and returns true when the DB client could not be created
// (missing env vars). Usage: `if (rejectIfNoDb(res)) return`
export function rejectIfNoDb(res) {
  if (supabase) return false
  res.status(503).json({ error: DB_NOT_READY_MESSAGE })
  return true
}
