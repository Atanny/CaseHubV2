-- Migration: add bundled_with column to cases
-- This stores the array of case numbers that a case is bundled with.
-- Using JSONB so it can hold a variable-length array of strings.

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS bundled_with JSONB DEFAULT NULL;

COMMENT ON COLUMN cases.bundled_with IS
  'Array of case numbers (strings) that this case is bundled with, e.g. ["12345", "67890"]';
