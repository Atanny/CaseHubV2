-- Migration: add bundled_with to drafts table
-- The drafts table stores suspended cases. Bundle info needs to survive suspension.
-- 
-- NOTE: draft_data (JSONB blob) already carries _bundledWith inside it — this column
-- is added as a top-level field so it can be queried/indexed independently if needed,
-- and mirrors how cases.bundled_with works.
--
-- SAFE: ADD COLUMN IF NOT EXISTS never touches existing rows or data.

ALTER TABLE drafts
  ADD COLUMN IF NOT EXISTS bundled_with JSONB DEFAULT NULL;

COMMENT ON COLUMN drafts.bundled_with IS
  'Array of case numbers this suspended case is bundled with, e.g. ["12345"]. Mirrors draft_data._bundledWith for top-level access.';
