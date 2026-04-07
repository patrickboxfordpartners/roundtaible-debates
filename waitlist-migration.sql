-- Roundtaible waitlist table
-- Run in Supabase SQL editor (same instance as debates table)

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  use_case text, -- 'business', 'education', 'curiosity', etc.
  created_at timestamptz DEFAULT now()
);

-- Prevent duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (lower(email));

-- RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist
CREATE POLICY "anon_insert_waitlist"
  ON waitlist FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role can read
CREATE POLICY "service_read_waitlist"
  ON waitlist FOR SELECT
  TO service_role
  USING (true);
