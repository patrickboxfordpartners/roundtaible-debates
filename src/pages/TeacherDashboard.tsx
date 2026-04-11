import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";

interface ClassItem {
  id: string;
  name: string;
  join_code: string;
  description: string | null;
  grade_level: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [newGradeLevel, setNewGradeLevel] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("rt_classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClasses((data as ClassItem[]) || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  }

  function generateJoinCode(): string {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile) return;
    setCreating(true);

    try {
      const { error } = await supabase.from("rt_classes").insert({
        teacher_id: profile.id,
        name: newClassName.trim(),
        description: newClassDesc.trim() || null,
        grade_level: newGradeLevel || null,
        join_code: generateJoinCode(),
      });

      if (error) throw error;

      setNewClassName("");
      setNewClassDesc("");
      setNewGradeLevel("");
      setShowCreate(false);
      fetchClasses();
    } catch (err) {
      console.error("Error creating class:", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-body">
              {profile?.full_name || profile?.email}
            </span>
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

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">My Classes</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {showCreate ? "Cancel" : "Create Class"}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreateClass} className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Class Name</label>
              <input
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body"
                placeholder="e.g., AP US History Period 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Description (optional)</label>
              <input
                value={newClassDesc}
                onChange={(e) => setNewClassDesc(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Grade Level</label>
              <select
                value={newGradeLevel}
                onChange={(e) => setNewGradeLevel(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body"
              >
                <option value="">Select grade level</option>
                <option value="6-8">6-8 (Middle School)</option>
                <option value="9-10">9-10 (High School)</option>
                <option value="11-12">11-12 (High School)</option>
                <option value="college">College</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Class"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center text-muted-foreground font-body py-12">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground font-body">No classes yet. Create your first class to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => navigate(`/class/${cls.id}`)}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold">{cls.name}</h3>
                    {cls.description && (
                      <p className="text-sm text-muted-foreground font-body mt-1">{cls.description}</p>
                    )}
                    {cls.grade_level && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                        {cls.grade_level}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground font-body mb-1">Join Code</div>
                    <code className="text-lg font-mono font-bold text-primary tracking-wider">
                      {cls.join_code}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
