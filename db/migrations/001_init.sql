-- Roundtaible: initial Neon (Postgres) schema.
-- Rebuilt from the old supabase/migrations files after the Supabase project was deleted.
--
-- Differences from the Supabase version:
--   * User ids are TEXT, because Clerk ids look like "user_2abc...", not UUIDs.
--   * No auth.users table and no row-level security. The /api functions check the
--     signed-in Clerk user on every request instead.
--   * Unused tables (waitlist, contact_submissions, analytics, assignment stats view)
--     are not recreated.
--
-- Safe to run more than once. Run it in the Neon SQL Editor.

CREATE TABLE IF NOT EXISTS rt_profiles (
  id                     TEXT PRIMARY KEY,               -- Clerk user id
  email                  TEXT NOT NULL DEFAULT '',
  full_name              TEXT,
  role                   TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student', 'admin')),
  avatar_url             TEXT,
  subscription_tier      TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'edu')),
  subscription_status    TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_profiles_stripe_customer ON rt_profiles(stripe_customer_id);

CREATE TABLE IF NOT EXISTS rt_classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  join_code   TEXT NOT NULL UNIQUE,
  description TEXT,
  grade_level TEXT,
  subject     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_classes_teacher ON rt_classes(teacher_id);

CREATE TABLE IF NOT EXISTS rt_class_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES rt_classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_rt_class_members_student ON rt_class_members(student_id);

-- Finished debates. user_id is null for signed-out (demo) debates.
CREATE TABLE IF NOT EXISTS rt_debates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id         TEXT NOT NULL,
  topic_title      TEXT NOT NULL,
  topic_category   TEXT,
  transcript       JSONB NOT NULL DEFAULT '[]',
  personas         JSONB NOT NULL DEFAULT '[]',
  winner_id        TEXT,
  duration         INTEGER NOT NULL DEFAULT 0,
  user_id          TEXT,
  class_id         UUID REFERENCES rt_classes(id) ON DELETE SET NULL,
  educational_mode BOOLEAN NOT NULL DEFAULT false,
  ai_cost_estimate NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_debates_user_created ON rt_debates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rt_debates_class ON rt_debates(class_id);
CREATE INDEX IF NOT EXISTS idx_rt_debates_created ON rt_debates(created_at DESC);

CREATE TABLE IF NOT EXISTS rt_leaderboards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  persona_id   TEXT NOT NULL,
  persona_name TEXT NOT NULL,
  wins         INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, persona_id)
);

CREATE TABLE IF NOT EXISTS rt_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id       UUID NOT NULL REFERENCES rt_classes(id) ON DELETE CASCADE,
  teacher_id     TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  topic_title    TEXT NOT NULL,
  topic_category TEXT,
  due_date       TIMESTAMPTZ,
  instructions   TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_assignments_class ON rt_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_rt_assignments_teacher ON rt_assignments(teacher_id);

CREATE TABLE IF NOT EXISTS rt_assignment_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id    UUID NOT NULL REFERENCES rt_assignments(id) ON DELETE CASCADE,
  student_id       TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  debate_id        UUID REFERENCES rt_debates(id) ON DELETE SET NULL,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  teacher_feedback TEXT,
  grade            VARCHAR(10),
  graded_at        TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON rt_assignment_submissions(student_id);

CREATE TABLE IF NOT EXISTS rt_tournaments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID REFERENCES rt_classes(id) ON DELETE CASCADE,
  created_by    TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  topics        JSONB NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  current_round INTEGER NOT NULL DEFAULT 1,
  total_rounds  INTEGER NOT NULL DEFAULT 3,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_tournaments_class ON rt_tournaments(class_id);

CREATE TABLE IF NOT EXISTS rt_tournament_rounds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  UUID NOT NULL REFERENCES rt_tournaments(id) ON DELETE CASCADE,
  round_number   INTEGER NOT NULL,
  match_number   INTEGER,
  topic_title    TEXT NOT NULL,
  persona_a      TEXT,                            -- null until the earlier match is decided
  persona_b      TEXT,
  winner_id      TEXT,
  debate_id      UUID REFERENCES rt_debates(id) ON DELETE SET NULL,
  votes_a        INTEGER NOT NULL DEFAULT 0,
  votes_b        INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  parent_match_a UUID REFERENCES rt_tournament_rounds(id) ON DELETE SET NULL,
  parent_match_b UUID REFERENCES rt_tournament_rounds(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_rounds_tournament ON rt_tournament_rounds(tournament_id);

CREATE TABLE IF NOT EXISTS rt_tournament_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id   UUID NOT NULL REFERENCES rt_tournament_rounds(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  voted_for  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, user_id)
);
