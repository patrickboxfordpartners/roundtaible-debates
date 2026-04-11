-- Roundtaible Debates: Class management tables
-- Tables created first, then policies (to avoid forward references)

-- 1. Create tables
CREATE TABLE IF NOT EXISTS rt_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  description TEXT,
  grade_level TEXT,
  subject TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rt_class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES rt_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES rt_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_rt_classes_teacher ON rt_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_rt_classes_join_code ON rt_classes(join_code);
CREATE INDEX IF NOT EXISTS idx_rt_class_members_class ON rt_class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_rt_class_members_student ON rt_class_members(student_id);

-- 3. Enable RLS
ALTER TABLE rt_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rt_class_members ENABLE ROW LEVEL SECURITY;

-- 4. Policies (both tables exist now)
CREATE POLICY "Teachers manage own classes" ON rt_classes
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students read joined classes" ON rt_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rt_class_members
      WHERE class_id = rt_classes.id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers read class members" ON rt_class_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rt_classes WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students read own memberships" ON rt_class_members
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students join classes" ON rt_class_members
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers read class students" ON rt_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rt_class_members cm
      JOIN rt_classes c ON c.id = cm.class_id
      WHERE cm.student_id = rt_profiles.id
      AND c.teacher_id = auth.uid()
    )
  );

-- 5. Link debates to classes
DO $$ BEGIN
  ALTER TABLE rt_debates ADD CONSTRAINT fk_rt_debates_class FOREIGN KEY (class_id) REFERENCES rt_classes(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_rt_debates_class ON rt_debates(class_id);

CREATE POLICY "Teachers read class debates" ON rt_debates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rt_classes WHERE id = rt_debates.class_id AND teacher_id = auth.uid()
    )
  );
