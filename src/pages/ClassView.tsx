import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";

interface ClassDetail {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  grade_level: string | null;
  teacher_id: string;
  is_active: boolean;
}

interface DebateRecord {
  id: string;
  topic_title: string;
  topic_category: string | null;
  winner_id: string | null;
  duration: number;
  educational_mode: boolean;
  created_at: string;
  user_id: string;
}

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
}

export default function ClassView() {
  const { classId } = useParams();
  const { profile, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) fetchClassData();
  }, [classId]);

  async function fetchClassData() {
    if (!supabase || !classId) return;

    try {
      // Fetch class info
      const { data: cls, error: clsErr } = await supabase
        .from("rt_classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (clsErr) throw clsErr;
      setClassData(cls as ClassDetail);

      // Fetch debates for this class
      const { data: debateData } = await supabase
        .from("rt_debates")
        .select("id, topic_title, topic_category, winner_id, duration, educational_mode, created_at, user_id")
        .eq("class_id", classId)
        .order("created_at", { ascending: false })
        .limit(50);

      setDebates((debateData as DebateRecord[]) || []);

      // If teacher, fetch student list
      if (isTeacher) {
        const { data: memberData } = await supabase
          .from("rt_class_members")
          .select("student_id, rt_profiles(id, full_name, email)")
          .eq("class_id", classId);

        if (memberData) {
          const studentProfiles = memberData
            .map((m: unknown) => {
              const member = m as { rt_profiles: StudentProfile | null };
              return member.rt_profiles;
            })
            .filter(Boolean) as StudentProfile[];
          setStudents(studentProfiles);
        }
      }
    } catch (err) {
      console.error("Error fetching class:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-body">Loading class...</div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold mb-2">Class not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:underline font-body"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(isTeacher ? "/teacher" : "/student")}
            className="text-sm text-muted-foreground hover:text-foreground font-body"
          >
            &larr; Dashboard
          </button>
          <button
            onClick={() => navigate("/app")}
            className="text-sm text-primary hover:underline font-body"
          >
            Debate Room
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Class Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">{classData.name}</h1>
          {classData.description && (
            <p className="text-muted-foreground font-body mt-2">{classData.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            {classData.grade_level && (
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                {classData.grade_level}
              </span>
            )}
            {isTeacher && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-body">Join Code:</span>
                <code className="font-mono font-bold text-primary tracking-wider">
                  {classData.join_code}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Teacher: Student List */}
        {isTeacher && (
          <section>
            <h2 className="font-display text-xl font-bold mb-4">
              Students ({students.length})
            </h2>
            {students.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground font-body">
                  No students have joined yet. Share the join code: <strong>{classData.join_code}</strong>
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {students.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-display font-semibold">{s.full_name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground font-body">{s.email}</div>
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      {debates.filter((d) => d.user_id === s.id).length} debates
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Debate History */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">
            {isTeacher ? "All Debates" : "My Debates"} ({debates.length})
          </h2>
          {debates.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground font-body">No debates in this class yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {debates.map((debate) => (
                <div key={debate.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold">{debate.topic_title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {debate.topic_category && (
                          <span className="text-xs px-2 py-0.5 bg-accent rounded font-body">
                            {debate.topic_category}
                          </span>
                        )}
                        {debate.educational_mode && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-body">
                            Educational
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-body">
                          {Math.floor(debate.duration / 60)}m {debate.duration % 60}s
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      {new Date(debate.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
