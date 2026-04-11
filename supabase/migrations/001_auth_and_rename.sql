-- Roundtaible Debates: Auth system + table rename migration
-- Prefix all roundtaible tables with rt_ to avoid collisions with market-signals

-- 1. Rename existing tables
ALTER TABLE IF EXISTS debates RENAME TO rt_debates;
ALTER TABLE IF EXISTS waitlist RENAME TO rt_waitlist;
ALTER TABLE IF EXISTS contact_submissions RENAME TO rt_contact_submissions;

-- 2. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS rt_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rt_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON rt_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON rt_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_rt_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rt_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present (idempotent)
DROP TRIGGER IF EXISTS on_rt_auth_user_created ON auth.users;

CREATE TRIGGER on_rt_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_rt_new_user();

-- 4. Add user/class linkage columns to debates table
ALTER TABLE rt_debates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE rt_debates ADD COLUMN IF NOT EXISTS class_id UUID;
ALTER TABLE rt_debates ADD COLUMN IF NOT EXISTS educational_mode BOOLEAN DEFAULT false;

-- 5. Enable RLS on debates
ALTER TABLE rt_debates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own debates" ON rt_debates
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Auth users insert debates" ON rt_debates
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 6. Index for performance
CREATE INDEX IF NOT EXISTS idx_rt_debates_user ON rt_debates(user_id);
