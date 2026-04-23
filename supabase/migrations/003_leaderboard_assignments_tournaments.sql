-- Leaderboard persistence
CREATE TABLE IF NOT EXISTS rt_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL,
  persona_name TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);
CREATE INDEX IF NOT EXISTS idx_rt_leaderboards_user ON rt_leaderboards(user_id);
ALTER TABLE rt_leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leaderboard" ON rt_leaderboards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Debate assignments (teacher → class)
CREATE TABLE IF NOT EXISTS rt_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES rt_classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  topic_category TEXT,
  due_date TIMESTAMPTZ,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_assignments_class ON rt_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_rt_assignments_teacher ON rt_assignments(teacher_id);
ALTER TABLE rt_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage assignments" ON rt_assignments
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Students read class assignments" ON rt_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rt_class_members WHERE class_id = rt_assignments.class_id AND student_id = auth.uid()
    )
  );

-- Tournament support
CREATE TABLE IF NOT EXISTS rt_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES rt_classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  topics JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup','active','completed')),
  current_round INTEGER NOT NULL DEFAULT 1,
  total_rounds INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_tournaments_class ON rt_tournaments(class_id);
CREATE INDEX IF NOT EXISTS idx_rt_tournaments_creator ON rt_tournaments(created_by);
ALTER TABLE rt_tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage tournaments" ON rt_tournaments
  FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Class members read tournaments" ON rt_tournaments
  FOR SELECT USING (
    class_id IS NULL OR EXISTS (
      SELECT 1 FROM rt_class_members WHERE class_id = rt_tournaments.class_id AND student_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS rt_tournament_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES rt_tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  topic_title TEXT NOT NULL,
  persona_a TEXT NOT NULL,
  persona_b TEXT NOT NULL,
  winner_id TEXT,
  debate_id UUID REFERENCES rt_debates(id) ON DELETE SET NULL,
  votes_a INTEGER NOT NULL DEFAULT 0,
  votes_b INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_rounds_tournament ON rt_tournament_rounds(tournament_id);
ALTER TABLE rt_tournament_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament creators manage rounds" ON rt_tournament_rounds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM rt_tournaments WHERE id = tournament_id AND created_by = auth.uid())
  );
CREATE POLICY "Class members read rounds" ON rt_tournament_rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rt_tournaments t
      LEFT JOIN rt_class_members cm ON cm.class_id = t.class_id
      WHERE t.id = tournament_id AND (t.class_id IS NULL OR cm.student_id = auth.uid())
    )
  );

-- tournament votes
CREATE TABLE IF NOT EXISTS rt_tournament_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rt_tournament_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  voted_for TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);
ALTER TABLE rt_tournament_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users vote once per round" ON rt_tournament_votes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
