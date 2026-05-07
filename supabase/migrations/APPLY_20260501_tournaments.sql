-- Tournament bracket system - Add parent match relationships for tree structure
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ezunrnagkdafwuesumqy/sql

-- Add match tree columns to existing rt_tournament_rounds
ALTER TABLE rt_tournament_rounds
ADD COLUMN IF NOT EXISTS parent_match_a UUID REFERENCES rt_tournament_rounds(id) ON DELETE SET NULL;

ALTER TABLE rt_tournament_rounds
ADD COLUMN IF NOT EXISTS parent_match_b UUID REFERENCES rt_tournament_rounds(id) ON DELETE SET NULL;

ALTER TABLE rt_tournament_rounds
ADD COLUMN IF NOT EXISTS match_number INTEGER;

-- Indexes for bracket traversal
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_parent_a ON rt_tournament_rounds(parent_match_a);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_parent_b ON rt_tournament_rounds(parent_match_b);

-- Migration complete
SELECT 'Tournament bracket system migration complete' AS status;
