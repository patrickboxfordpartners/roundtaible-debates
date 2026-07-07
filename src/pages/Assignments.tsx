import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { BookOpen, Plus, X, Clock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

interface Assignment {
  id: string;
  class_id: string;
  topic_title: string;
  topic_category: string | null;
  due_date: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  rt_classes?: { name: string } | null;
  submitted?: boolean; // For students
  submission_count?: number; // For teachers
  total_students?: number; // For teachers
}

interface ClassOption { id: string; name: string }

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export default function Assignments() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ classId: "", topicTitle: "", dueDate: "", instructions: "" });
  const [creating, setCreating] = useState(false);

  const isTeacher = profile?.role === "teacher";

  const fetch = useCallback(async () => {
    if (!supabase || !profile) return;
    setLoading(true);
    try {
      if (isTeacher) {
        const [{ data: asgn }, { data: cls }] = await Promise.all([
          supabase.from("rt_assignments").select("*, rt_classes(name)").eq("teacher_id", profile.id).order("created_at", { ascending: false }),
          supabase.from("rt_classes").select("id, name").eq("teacher_id", profile.id).eq("is_active", true),
        ]);

        // Fetch submission counts for each assignment
        if (asgn && asgn.length > 0) {
          const assignmentIds = asgn.map((a: Assignment) => a.id);
          const [{ data: submissions }, { data: classMembers }] = await Promise.all([
            supabase.from("rt_assignment_submissions").select("assignment_id").in("assignment_id", assignmentIds),
            supabase.from("rt_class_members").select("class_id").in("class_id", asgn.map((a: Assignment) => a.class_id)),
          ]);

          // Count submissions per assignment
          const submissionCounts = new Map<string, number>();
          (submissions || []).forEach((s: { assignment_id: string }) => {
            submissionCounts.set(s.assignment_id, (submissionCounts.get(s.assignment_id) || 0) + 1);
          });

          // Count students per class
          const studentCounts = new Map<string, number>();
          (classMembers || []).forEach((m: { class_id: string }) => {
            studentCounts.set(m.class_id, (studentCounts.get(m.class_id) || 0) + 1);
          });

          // Add counts to assignments
          const enriched = asgn.map((a: Assignment) => ({
            ...a,
            submission_count: submissionCounts.get(a.id) || 0,
            total_students: studentCounts.get(a.class_id) || 0,
          }));
          setAssignments(enriched);
        } else {
          setAssignments([]);
        }

        setClasses((cls as ClassOption[]) || []);
        if (cls?.length) setForm(f => ({ ...f, classId: cls[0].id }));
      } else {
        // Student: see assignments for their classes + check if submitted
        const { data: memberships } = await supabase.from("rt_class_members").select("class_id").eq("student_id", profile.id);
        if (memberships && memberships.length > 0) {
          const classIds = memberships.map(m => m.class_id);
          const { data: asgn } = await supabase.from("rt_assignments").select("*, rt_classes(name)").in("class_id", classIds).eq("is_active", true).order("due_date", { ascending: true });

          if (asgn && asgn.length > 0) {
            const assignmentIds = asgn.map((a: Assignment) => a.id);
            const { data: submissions } = await supabase.from("rt_assignment_submissions").select("assignment_id").eq("student_id", profile.id).in("assignment_id", assignmentIds);

            const submittedIds = new Set((submissions || []).map((s: { assignment_id: string }) => s.assignment_id));
            const enriched = asgn.map((a: Assignment) => ({
              ...a,
              submitted: submittedIds.has(a.id),
            }));
            setAssignments(enriched);
          } else {
            setAssignments([]);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [profile, isTeacher]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile || !form.classId || !form.topicTitle) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("rt_assignments").insert({
        class_id: form.classId,
        teacher_id: profile.id,
        topic_title: form.topicTitle.trim(),
        due_date: form.dueDate || null,
        instructions: form.instructions.trim() || null,
      });
      if (error) throw error;
      setShowCreate(false);
      setForm(f => ({ ...f, topicTitle: "", dueDate: "", instructions: "" }));
      fetch();
      toast.success("Assignment created");
    } catch {
      toast.error("Failed to create assignment");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!supabase) return;
    await supabase.from("rt_assignments").update({ is_active: false }).eq("id", id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast.info("Assignment removed");
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-lg font-bold">Assignments</h1>
          </div>
          {isTeacher && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New</span> Assignment
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {assignments.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 sm:p-10 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display font-semibold text-muted-foreground">No assignments yet</p>
            {isTeacher && (
              <p className="text-sm text-muted-foreground font-body mt-1">Create an assignment to give students a specific debate topic.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => {
              const days = daysUntil(a.due_date);
              const isOverdue = days !== null && days < 0;
              const isDueSoon = days !== null && days >= 0 && days <= 3;
              return (
                <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display font-semibold text-base">{a.topic_title}</h3>
                        {isOverdue && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>}
                        {isDueSoon && !isOverdue && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Due soon</span>}
                        {!isOverdue && !isDueSoon && days !== null && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {days}d left</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                        {a.rt_classes?.name && <span className="font-semibold text-foreground/70">{a.rt_classes.name}</span>}
                        {a.due_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      </div>
                      {a.instructions && <p className="text-sm font-body text-muted-foreground mt-2">{a.instructions}</p>}
                      {isTeacher && a.total_students !== undefined && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-body">
                          <span>
                            <span className="font-semibold text-foreground">{a.submission_count || 0}</span> / {a.total_students} submitted
                          </span>
                          {a.submission_count && a.submission_count > 0 && (
                            <span className="text-primary hover:underline cursor-pointer">View submissions</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isTeacher && !a.submitted && (
                        <button
                          onClick={() => navigate(`/app?topic=${encodeURIComponent(a.topic_title)}&assignment=${a.id}`)}
                          className="px-3 py-1.5 text-xs font-display font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Start Debate
                        </button>
                      )}
                      {!isTeacher && a.submitted && (
                        <span className="px-3 py-1.5 text-xs font-display font-semibold bg-green-500/10 text-green-400 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      )}
                      {isTeacher && (
                        <button onClick={() => handleDeactivate(a.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold">New Assignment</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Class</label>
                <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-body">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Debate Topic <span className="text-destructive">*</span></label>
                <input type="text" value={form.topicTitle} onChange={e => setForm(f => ({ ...f, topicTitle: e.target.value }))} required
                  placeholder="e.g. Was the Industrial Revolution a net positive for humanity?"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-body" />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Due Date</label>
                <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-body" />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Instructions (optional)</label>
                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={3}
                  placeholder="Any specific guidance for students..."
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-body resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm font-display font-semibold border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={creating || !form.classId || !form.topicTitle}
                  className="flex-1 px-4 py-2 text-sm font-display font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {creating ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
