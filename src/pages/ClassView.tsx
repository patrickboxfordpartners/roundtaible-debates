import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { Trophy, Plus, Play } from "lucide-react";

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

interface TournamentItem {
  id: string;
  name: string;
  description: string | null;
  status: "setup" | "active" | "completed";
  current_round: number;
  total_rounds: number;
  created_at: string;
}

export default function ClassView() {
  const { classId } = useParams();
  const { profile, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTournamentCreate, setShowTournamentCreate] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentDesc, setTournamentDesc] = useState("");
  const [totalRounds, setTotalRounds] = useState(3);
  const [creating, setCreating] = useState(false);

  const fetchClassData = useCallback(async () => {
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

      // Fetch tournaments
      const { data: tournamentData } = await supabase
        .from("rt_tournaments")
        .select("id, name, description, status, current_round, total_rounds, created_at")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      setTournaments((tournamentData as TournamentItem[]) || []);

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
      toast.error("Failed to load class details");
    } finally {
      setLoading(false);
    }
  }, [classId, isTeacher]);

  useEffect(() => {
    if (classId) fetchClassData();
  }, [classId, fetchClassData]);

  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile || !classId) return;
    setCreating(true);

    try {
      const { data: tournament, error } = await supabase
        .from("rt_tournaments")
        .insert({
          class_id: classId,
          created_by: profile.id,
          name: tournamentName.trim(),
          description: tournamentDesc.trim() || null,
          total_rounds: totalRounds,
          status: "setup",
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial rounds (for now, all pending)
      const rounds = [];
      for (let i = 1; i <= totalRounds; i++) {
        rounds.push({
          tournament_id: tournament.id,
          round_number: i,
          topic_title: `Round ${i}`,
          persona_a: `Debater A${i}`,
          persona_b: `Debater B${i}`,
          status: i === 1 ? "active" : "pending",
        });
      }

      await supabase.from("rt_tournament_rounds").insert(rounds);

      toast.success("Tournament created!");
      setTournamentName("");
      setTournamentDesc("");
      setTotalRounds(3);
      setShowTournamentCreate(false);
      fetchClassData();
    } catch (err) {
      toast.error("Failed to create tournament");
    } finally {
      setCreating(false);
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

        {/* Tournaments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Tournaments ({tournaments.length})
            </h2>
            {isTeacher && (
              <button
                onClick={() => setShowTournamentCreate(!showTournamentCreate)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Tournament
              </button>
            )}
          </div>

          {showTournamentCreate && (
            <form onSubmit={handleCreateTournament} className="bg-card border border-border rounded-lg p-6 mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Tournament Name</label>
                <input
                  required
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body"
                  placeholder="e.g., Spring Debate Championship"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Description (optional)</label>
                <textarea
                  value={tournamentDesc}
                  onChange={(e) => setTournamentDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body h-20 resize-none"
                  placeholder="Brief description of the tournament format and goals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Number of Rounds</label>
                <select
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body"
                >
                  <option value={3}>3 rounds</option>
                  <option value={4}>4 rounds (quarterfinals)</option>
                  <option value={5}>5 rounds</option>
                  <option value={7}>7 rounds</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating..." : "Create Tournament"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTournamentCreate(false)}
                  className="px-4 py-2 border border-border rounded-lg font-display text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {tournaments.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground font-body">No tournaments yet. {isTeacher && "Create one to get started!"}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/tournament/${t.id}`)}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold flex items-center gap-2">
                        {t.name}
                        {t.status === "active" && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full font-semibold">
                            <Play className="w-3 h-3 fill-current" /> Live
                          </span>
                        )}
                      </h3>
                      {t.description && (
                        <p className="text-sm text-muted-foreground font-body mt-1">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-body">
                        <span>Round {t.current_round} of {t.total_rounds}</span>
                        <span className={`px-2 py-0.5 rounded capitalize ${t.status === "active" ? "bg-green-500/10 text-green-400" : t.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <Trophy className="w-5 h-5 text-amber-500 shrink-0 ml-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
