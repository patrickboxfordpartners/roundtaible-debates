import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { getSavedDebates, type SavedDebate } from "@/services/debateHistory";
import { toast } from "sonner";

interface ClassMembership {
  class_id: string;
  joined_at: string;
  rt_classes: {
    id: string;
    name: string;
    description: string | null;
    grade_level: string | null;
    join_code: string;
  };
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<ClassMembership[]>([]);
  const [localDebates, setLocalDebates] = useState<SavedDebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const fetchMemberships = useCallback(async () => {
    if (!supabase || !profile) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("rt_class_members")
        .select("class_id, joined_at, rt_classes(id, name, description, grade_level, join_code)")
        .eq("student_id", profile.id);

      if (error) throw error;
      setMemberships((data as unknown as ClassMembership[]) || []);
    } catch (err) {
      toast.error("Failed to load your classes");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchMemberships();
    setLocalDebates(getSavedDebates());
  }, [fetchMemberships]);

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile) return;
    setJoining(true);
    setJoinError("");

    try {
      // Find the class by join code
      const { data: classData, error: findError } = await supabase
        .from("rt_classes")
        .select("id")
        .eq("join_code", joinCode.trim().toLowerCase())
        .eq("is_active", true)
        .single();

      if (findError || !classData) {
        setJoinError("Invalid join code. Check with your teacher.");
        return;
      }

      // Join the class
      const { error: joinErr } = await supabase.from("rt_class_members").insert({
        class_id: classData.id,
        student_id: profile.id,
      });

      if (joinErr) {
        if (joinErr.code === "23505") {
          setJoinError("You're already in this class.");
        } else {
          throw joinErr;
        }
        return;
      }

      setJoinCode("");
      fetchMemberships();
    } catch (err) {
      console.error("Error joining class:", err);
      setJoinError("Failed to join class. Try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">My Debates</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-body">
              {profile?.full_name || profile?.email}
            </span>
            <button onClick={() => navigate("/assignments")} className="text-sm text-muted-foreground hover:text-foreground font-body">Assignments</button>
            <button onClick={() => navigate("/analytics")} className="text-sm text-muted-foreground hover:text-foreground font-body">Analytics</button>
            <button
              onClick={() => navigate("/app")}
              className="text-sm text-primary hover:underline font-body"
            >
              Debate Room
            </button>
            <button
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-foreground font-body"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Join a Class */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Join a Class</h2>
          <form onSubmit={handleJoinClass} className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 6-character join code"
                maxLength={6}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg font-mono text-lg tracking-wider uppercase"
              />
              {joinError && (
                <p className="text-sm text-destructive mt-1 font-body">{joinError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={joining || joinCode.trim().length < 6}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </form>
        </section>

        {/* My Classes */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">My Classes</h2>
          {loading ? (
            <div className="text-muted-foreground font-body">Loading...</div>
          ) : memberships.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground font-body">
                You haven't joined any classes yet. Ask your teacher for the join code.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {memberships.map((m) => (
                <div
                  key={m.class_id}
                  onClick={() => navigate(`/class/${m.class_id}`)}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <h3 className="font-display text-lg font-bold">{m.rt_classes.name}</h3>
                  {m.rt_classes.description && (
                    <p className="text-sm text-muted-foreground font-body mt-1">
                      {m.rt_classes.description}
                    </p>
                  )}
                  {m.rt_classes.grade_level && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                      {m.rt_classes.grade_level}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Debates (local) */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Recent Debates</h2>
          {localDebates.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground font-body">
                No debates yet. Head to the debate room to start one!
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {localDebates.slice(0, 10).map((debate) => (
                <div key={debate.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold">{debate.topic.title}</h3>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {debate.personas.map((p) => p.name).join(", ")} &middot;{" "}
                        {Math.floor(debate.duration / 60)}m {debate.duration % 60}s
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      {new Date(debate.savedAt).toLocaleDateString()}
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
