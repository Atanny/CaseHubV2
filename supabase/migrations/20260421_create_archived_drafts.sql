-- Migration: create archived_drafts table
-- Suspended cases that are "deleted" are moved here instead of being permanently removed.

CREATE TABLE IF NOT EXISTS archived_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  mode        TEXT NOT NULL,
  draft_data  JSONB NOT NULL DEFAULT '{}',
  bundled_with JSONB DEFAULT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  saved_at    TIMESTAMPTZ
);

COMMENT ON TABLE archived_drafts IS 'Suspended cases that were archived instead of permanently deleted.';
COMMENT ON COLUMN archived_drafts.draft_data IS 'Full form state, same shape as drafts.draft_data.';
COMMENT ON COLUMN archived_drafts.bundled_with IS 'Array of case numbers this case was bundled with.';
COMMENT ON COLUMN archived_drafts.archived_at IS 'When the user archived this suspended case.';
COMMENT ON COLUMN archived_drafts.saved_at IS 'Original suspended_at timestamp copied from drafts.';
