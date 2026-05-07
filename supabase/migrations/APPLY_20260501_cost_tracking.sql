-- AI Cost Tracking for Analytics Dashboard
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ezunrnagkdafwuesumqy/sql

-- Add cost estimate column to debates
ALTER TABLE rt_debates
ADD COLUMN IF NOT EXISTS ai_cost_estimate DECIMAL(10,4) DEFAULT 0;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_debates_cost ON rt_debates(ai_cost_estimate) WHERE ai_cost_estimate > 0;

-- Migration complete
SELECT 'AI cost tracking migration complete' AS status;
