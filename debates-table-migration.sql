-- Debates table: persists completed debates for content generation pipeline
CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  topic_category TEXT,
  transcript JSONB NOT NULL DEFAULT '[]',
  personas JSONB NOT NULL DEFAULT '[]',
  winner_id TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_debates_created_at ON debates(created_at DESC);

ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (client-side persist after debate ends)
CREATE POLICY "Allow anonymous inserts" ON debates
  FOR INSERT WITH CHECK (true);

-- Allow service_role full access (for Inngest content pipeline)
CREATE POLICY "Service role full access" ON debates
  FOR ALL USING (auth.role() = 'service_role');

-- Allow public reads (for content pipeline and debug)
CREATE POLICY "Allow public reads" ON debates
  FOR SELECT USING (true);
