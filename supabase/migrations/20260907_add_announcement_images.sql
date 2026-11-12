-- Migration: add image upload support to announcements
-- Run this once in your Supabase project's SQL editor (Dashboard → SQL Editor → New query).
--
-- What this does:
--   1. Adds an `image_url` column to the existing `announcements` table.
--   2. Creates a new public storage bucket `announcement-images`.
--   3. Adds storage policies so the app (using the anon/publishable key, same as
--      it already does for `case-images`) can upload, read, and delete files in
--      that bucket. This mirrors whatever policy shape your `case-images` bucket
--      already has — if your project locks that down differently (e.g. only
--      authenticated users can write), adjust the two "USING"/"WITH CHECK"
--      clauses below to match.
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / ON CONFLICT).

-- 1) New column on announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN announcements.image_url IS
  'Public URL of an optional image attached to the announcement, stored in the announcement-images storage bucket.';

-- 2) Storage bucket (public read, so posted images render without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for that bucket
--    (Supabase enables RLS on storage.objects by default — without these,
--     every upload/read/delete call will fail with a permissions error.)

DROP POLICY IF EXISTS "announcement-images public read" ON storage.objects;
CREATE POLICY "announcement-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-images');

DROP POLICY IF EXISTS "announcement-images public upload" ON storage.objects;
CREATE POLICY "announcement-images public upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'announcement-images');

DROP POLICY IF EXISTS "announcement-images public delete" ON storage.objects;
CREATE POLICY "announcement-images public delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'announcement-images');
