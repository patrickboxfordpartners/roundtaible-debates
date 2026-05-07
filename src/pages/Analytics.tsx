import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { BarChart2, Trophy, Clock, Users, BookOpen, TrendingUp, ArrowLeft } from "lucide-react";

interface DebateRecord {
  id: string;
  topic_title: string;
  topic_category: string;
  winner_id: string | null;
  duration: number;
  educational_mode: boolean;
  created_at: string;
  personas: Array<{ id: string; name: string; color: string }>;
}

interface ClassMember {
  student_id: string;
  rt_profiles: { full_name: string; email: string } | null;
  debate_count?: number;
}

function StatCard({ label, value, sub, icon: Icon, color = "text-primary" }: {
  label: string; value: string | number; sub?: string; icon: typeof BarChart2; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${color} opacity-60`} />
      </div>
      <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
      {sub && <p className="text-xs font-body text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"personal" | "class">("personal");

  const fetchData = useCallback(async () => {
    if (!supabase || !profile) return;
    setLoading(true);

    try {
      const { data: debateData } = await supabase
        .from("rt_debates")
        .select("id, topic_title, topic_category, winner_id, duration, educational_mode, created_at, personas")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(200);

      setDebates((debateData as DebateRecord[]) || []);

      if (profile.role === "teacher") {
        const { data: classData } = await supabase
          .from("rt_classes")
          .select("id")
          .eq("teacher_id", profile.id);

        if (classData && classData.length > 0) {
          const classIds = classData.map(c => c.id);
          const { data: memberData } = await supabase
            .from("rt_class_members")
            .select("student_id, rt_profiles(full_name, email)")
            .in("class_id", classIds);

          // Count debates per student
          const members = (memberData as ClassMember[]) || [];
          const enriched = await Promise.all(members.map(async m => {
            const { count } = await supabase!
              .from("rt_debates")
              .select("*", { count: "exact", head: true })
              .eq("user_id", m.student_id);
            return { ...m, debate_count: count || 0 };
          }));
          setClassMembers(enriched);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-body">Loading analytics...</div>
      </div>
    );
  }

  // Compute personal stats
  const totalDebates = debates.length;
  const totalDuration = debates.reduce((s, d) => s + (d.duration || 0), 0);
  const avgDuration = totalDebates > 0 ? Math.round(totalDuration / totalDebates) : 0;
  const eduDebates = debates.filter(d => d.educational_mode).length;

  // Estimate AI cost (rough: $0.02 per debate based on avg token usage)
  const estimatedCost = (totalDebates * 0.02).toFixed(2);

  const personaWins: Record<string, { name: string; color: string; wins: number }> = {};
  debates.forEach(d => {
    if (d.winner_id && d.winner_id !== "human") {
      const p = d.personas?.find(p => p.id === d.winner_id);
      if (p) {
        if (!personaWins[p.id]) personaWins[p.id] = { name: p.name, color: p.color, wins: 0 };
        personaWins[p.id].wins++;
      }
    }
  });
  const topPersonas = Object.values(personaWins).sort((a, b) => b.wins - a.wins).slice(0, 5);

  const categoryCounts: Record<string, number> = {};
  debates.forEach(d => {
    if (d.topic_category) {
      categoryCounts[d.topic_category] = (categoryCounts[d.topic_category] || 0) + 1;
    }
  });
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Weekly trend (last 8 weeks)
  const weeklyTrend: Record<string, number> = {};
  debates.forEach(d => {
    const week = new Date(d.created_at);
    const monday = new Date(week);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const key = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeklyTrend[key] = (weeklyTrend[key] || 0) + 1;
  });
  const weekKeys = Object.keys(weeklyTrend).slice(-8);
  const maxWeekCount = Math.max(...Object.values(weeklyTrend), 1);

  const fmt = (secs: number) => `${Math.floor(secs / 60)}m ${secs % 60}s`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-lg font-bold">Analytics</h1>
          </div>
          {profile?.role === "teacher" && (
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(["personal", "class"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs font-display font-semibold rounded-md transition-colors capitalize ${view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {view === "class" && profile?.role === "teacher" ? (
          <>
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Class Participation</h2>
              {classMembers.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground font-body">
                  No students have joined your classes yet.
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                        <th className="text-right px-4 py-3 font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider">Debates</th>
                        <th className="text-right px-4 py-3 font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classMembers.sort((a, b) => (b.debate_count || 0) - (a.debate_count || 0)).map(m => (
                        <tr key={m.student_id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-body">
                            <p className="font-semibold">{m.rt_profiles?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{m.rt_profiles?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">{m.debate_count || 0}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(m.debate_count || 0) > 0 ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                              {(m.debate_count || 0) > 0 ? "Active" : "No debates"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Debates" value={totalDebates} sub="all time" icon={BarChart2} />
              <StatCard label="Avg Duration" value={fmt(avgDuration)} sub="per debate" icon={Clock} color="text-amber-500" />
              <StatCard label="Educational Mode" value={eduDebates} sub={`${totalDebates > 0 ? Math.round(eduDebates / totalDebates * 100) : 0}% of debates`} icon={BookOpen} color="text-blue-500" />
              <StatCard label="Unique Topics" value={new Set(debates.map(d => d.topic_title)).size} sub="debated" icon={TrendingUp} color="text-green-500" />
              <StatCard label="Est. AI Cost" value={`$${estimatedCost}`} sub="~$0.02 per debate" icon={Trophy} color="text-purple-500" />
            </div>

            {/* Weekly trend */}
            {weekKeys.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display text-sm font-bold mb-4 text-muted-foreground uppercase tracking-wider">Weekly Activity</h3>
                <div className="flex items-end gap-2 h-24">
                  {weekKeys.map(week => (
                    <div key={week} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/70 rounded-sm transition-all"
                        style={{ height: `${Math.max(4, (weeklyTrend[week] / maxWeekCount) * 96)}px` }}
                        title={`${weeklyTrend[week]} debate${weeklyTrend[week] !== 1 ? "s" : ""}`}
                      />
                      <span className="text-[9px] font-body text-muted-foreground truncate w-full text-center">{week}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top personas */}
              {topPersonas.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Most Voted Winners
                  </h3>
                  <div className="space-y-2">
                    {topPersonas.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-body flex-1">{p.name}</span>
                        <span className="text-sm font-mono font-bold">{p.wins}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top categories */}
              {topCategories.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Top Topic Categories
                  </h3>
                  <div className="space-y-2">
                    {topCategories.map(([cat, count]) => {
                      const pct = (count / totalDebates) * 100;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-body">
                            <span>{cat}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Recent debates */}
            {debates.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-muted-foreground">No debate data yet. Start your first debate!</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="font-display text-sm font-bold">Recent Debates</h3>
                </div>
                <div className="divide-y divide-border">
                  {debates.slice(0, 10).map(d => (
                    <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-display text-sm font-semibold">{d.topic_title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-body">{d.topic_category}</span>
                          {d.educational_mode && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-semibold">EDU</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-muted-foreground">{fmt(d.duration)}</p>
                        <p className="text-xs text-muted-foreground font-body">{new Date(d.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
