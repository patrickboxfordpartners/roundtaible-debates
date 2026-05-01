-- Add assignment submission tracking
-- Students submit debates to assignments, teachers can grade them

CREATE TABLE IF NOT EXISTS rt_assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES rt_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debate_id UUID REFERENCES rt_debates(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  teacher_feedback TEXT,
  grade VARCHAR(10), -- A-F, numeric, or custom grading scale
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- RLS policies for submissions
ALTER TABLE rt_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON rt_assignment_submissions
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own submissions
CREATE POLICY "Students can submit assignments"
  ON rt_assignment_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Teachers can view submissions for their classes
CREATE POLICY "Teachers can view class submissions"
  ON rt_assignment_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rt_assignments a
      INNER JOIN rt_classes c ON a.class_id = c.id
      WHERE a.id = assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can update (grade) submissions for their classes
CREATE POLICY "Teachers can grade submissions"
  ON rt_assignment_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rt_assignments a
      INNER JOIN rt_classes c ON a.class_id = c.id
      WHERE a.id = assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_submissions_assignment ON rt_assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON rt_assignment_submissions(student_id);
CREATE INDEX idx_submissions_submitted_at ON rt_assignment_submissions(submitted_at DESC);

-- Add completion stats to assignments view
CREATE OR REPLACE VIEW rt_assignment_stats AS
SELECT
  a.id AS assignment_id,
  a.topic,
  a.class_id,
  a.due_date,
  COUNT(DISTINCT cm.user_id) AS total_students,
  COUNT(DISTINCT s.student_id) AS submitted_count,
  COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.student_id END) AS graded_count,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT cm.user_id) > 0
      THEN (COUNT(DISTINCT s.student_id)::DECIMAL / COUNT(DISTINCT cm.user_id)::DECIMAL) * 100
      ELSE 0
    END,
    1
  ) AS completion_rate
FROM rt_assignments a
LEFT JOIN rt_class_members cm ON a.class_id = cm.class_id
LEFT JOIN rt_assignment_submissions s ON a.id = s.assignment_id
GROUP BY a.id, a.topic, a.class_id, a.due_date;

-- Grant access to the view
GRANT SELECT ON rt_assignment_stats TO authenticated;
