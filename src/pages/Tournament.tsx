import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { Trophy, Play, ChevronRight, ArrowLeft, Users, ThumbsUp, Zap } from "lucide-react";

interface Round {
  id: string;
  round_number: number;
  topic_title: string;
  persona_a: string;
  persona_b: string;
  winner_id: string | null;
  votes_a: number;
  votes_b: number;
  status: "pending" | "active" | "completed";
}

interface TournamentData {
  id: string;
  name: string;
  description: string | null;
  status: "setup" | "active" | "completed";
  current_round: number;
  total_rounds: number;
  topics: string[];
  created_by: string;
}

interface BracketNode {
  round: Round;
  left?: BracketNode;
  right?: BracketNode;
}

function BracketMatch({ round }: { round: Round }) {
  const totalVotes = round.votes_a + round.votes_b;
  const pctA = totalVotes > 0 ? Math.round((round.votes_a / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((round.votes_b / totalVotes) * 100) : 50;

  return (
    <div className={`bg-card border rounded-lg p-3 min-w-[200px] ${round.status === "active" ? "border-primary shadow-lg shadow-primary/20" : "border-border"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">
          {round.status === "active" ? "🔴 Live" : round.status === "completed" ? `R${round.round_number}` : "Pending"}
        </span>
        {round.status === "completed" && round.winner_id && (
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>

      <div className="space-y-2">
        {[
          { id: round.persona_a, votes: round.votes_a, pct: pctA },
          { id: round.persona_b, votes: round.votes_b, pct: pctB },
        ].map(side => {
          const isWinner = round.winner_id === side.id;
          return (
            <div
              key={side.id}
              className={`text-xs font-body p-2 rounded transition-all ${
                isWinner
                  ? "bg-primary/10 border border-primary/30 font-bold"
                  : round.status === "completed"
                  ? "bg-muted/30 text-muted-foreground"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="truncate">{side.id}</span>
                {round.status !== "pending" && (
                  <span className="font-mono text-[10px] ml-1">{side.votes}</span>
                )}
              </div>
              {round.status !== "pending" && (
                <div className="h-1 bg-background rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isWinner ? "bg-primary" : "bg-muted-foreground/40"}`} style={{ width: `${side.pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketView({ tree }: { tree: BracketNode }) {
  const { round, left, right } = tree;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-center justify-center gap-8 min-w-max">
        {/* Left subtree */}
        {left && (
          <div className="flex flex-col items-end gap-8">
            {left.left && (
              <div className="flex items-center gap-4">
                <BracketMatch round={left.left.round} />
                <div className="w-8 h-px bg-border relative">
                  <div className="absolute right-0 w-px h-16 bg-border -translate-y-8" />
                </div>
              </div>
            )}
            {left.right && (
              <div className="flex items-center gap-4">
                <BracketMatch round={left.right.round} />
                <div className="w-8 h-px bg-border relative">
                  <div className="absolute right-0 w-px h-16 bg-border translate-y-8" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Semi-final left */}
        {left && (
          <div className="flex items-center gap-4">
            <BracketMatch round={left.round} />
            <div className="w-8 h-px bg-border" />
          </div>
        )}

        {/* Finals */}
        <BracketMatch round={round} />

        {/* Semi-final right */}
        {right && (
          <div className="flex items-center gap-4">
            <div className="w-8 h-px bg-border" />
            <BracketMatch round={right.round} />
          </div>
        )}

        {/* Right subtree */}
        {right && (
          <div className="flex flex-col items-start gap-8">
            {right.left && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-px bg-border relative">
                  <div className="absolute left-0 w-px h-16 bg-border -translate-y-8" />
                </div>
                <BracketMatch round={right.left.round} />
              </div>
            )}
            {right.right && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-px bg-border relative">
                  <div className="absolute left-0 w-px h-16 bg-border translate-y-8" />
                </div>
                <BracketMatch round={right.right.round} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tournament() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!supabase || !tournamentId) return;
    try {
      const [{ data: t }, { data: r }] = await Promise.all([
        supabase.from("rt_tournaments").select("*").eq("id", tournamentId).single(),
        supabase.from("rt_tournament_rounds").select("*").eq("tournament_id", tournamentId).order("round_number"),
      ]);
      setTournament(t as TournamentData);
      setRounds((r as Round[]) || []);

      if (profile) {
        const { data: votes } = await supabase
          .from("rt_tournament_votes")
          .select("round_id, voted_for")
          .eq("user_id", profile.id)
          .in("round_id", (r || []).map((round: Round) => round.id));
        const voteMap: Record<string, string> = {};
        (votes || []).forEach((v: any) => { voteMap[v.round_id] = v.voted_for; });
        setUserVotes(voteMap);
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId, profile]);

  useEffect(() => { fetch(); }, [fetch]);

  async function vote(roundId: string, personaId: string, field: "votes_a" | "votes_b") {
    if (!supabase || !profile) return;
    setVoting(roundId);
    try {
      await supabase.from("rt_tournament_votes").upsert({ round_id: roundId, user_id: profile.id, voted_for: personaId }, { onConflict: "round_id,user_id" });
      await supabase.rpc("increment_tournament_votes", { p_round_id: roundId, p_field: field }).catch(async () => {
        // fallback
        const { data } = await supabase!.from("rt_tournament_rounds").select(field).eq("id", roundId).single();
        await supabase!.from("rt_tournament_rounds").update({ [field]: ((data as any)?.[field] || 0) + 1 }).eq("id", roundId);
      });
      setUserVotes(v => ({ ...v, [roundId]: personaId }));
      fetch();
      toast.success("Vote cast!");
    } catch {
      toast.error("Failed to vote");
    } finally {
      setVoting(null);
    }
  }

  async function advanceRound(round: Round) {
    if (!supabase || !tournament) return;
    const winnerId = round.votes_a >= round.votes_b ? round.persona_a : round.persona_b;
    await supabase.from("rt_tournament_rounds").update({ winner_id: winnerId, status: "completed" }).eq("id", round.id);
    // Check if there's a next round
    const nextRound = rounds.find(r => r.round_number === round.round_number + 1);
    if (nextRound) {
      await supabase.from("rt_tournament_rounds").update({ status: "active" }).eq("id", nextRound.id);
      await supabase.from("rt_tournaments").update({ current_round: nextRound.round_number }).eq("id", tournament.id);
    } else {
      await supabase.from("rt_tournaments").update({ status: "completed" }).eq("id", tournament.id);
    }
    fetch();
    toast.success("Round advanced!");
  }

  if (loading || !tournament) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground font-body">Loading tournament...</div></div>;
  }

  const isOwner = profile?.id === tournament.created_by;
  const activeRound = rounds.find(r => r.status === "active");
  const completedRounds = rounds.filter(r => r.status === "completed");
  const winner = completedRounds.length === rounds.length && rounds.length > 0
    ? rounds[rounds.length - 1]?.winner_id
    : null;

  // Build bracket tree structure
  const buildBracket = (): BracketNode[] => {
    const roundsByNum: Record<number, Round[]> = {};
    rounds.forEach(r => {
      if (!roundsByNum[r.round_number]) roundsByNum[r.round_number] = [];
      roundsByNum[r.round_number].push(r);
    });

    const maxRound = Math.max(...Object.keys(roundsByNum).map(Number));
    const bracket: BracketNode[] = [];

    // Finals (last round)
    const finals = roundsByNum[maxRound]?.[0];
    if (finals) {
      const node: BracketNode = { round: finals };
      bracket.push(node);

      // Build semis (second-to-last round)
      if (maxRound > 1) {
        const semis = roundsByNum[maxRound - 1] || [];
        if (semis.length >= 2) {
          node.left = { round: semis[0] };
          node.right = { round: semis[1] };

          // Build quarters (third-to-last round)
          if (maxRound > 2) {
            const quarters = roundsByNum[maxRound - 2] || [];
            if (quarters.length >= 4) {
              node.left.left = { round: quarters[0] };
              node.left.right = { round: quarters[1] };
              node.right.left = { round: quarters[2] };
              node.right.right = { round: quarters[3] };
            }
          }
        }
      }
    }

    return bracket;
  };

  const bracketTree = buildBracket();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-display text-base font-bold">{tournament.name}</h1>
              <p className="text-xs text-muted-foreground font-body capitalize">{tournament.status} · Round {tournament.current_round} of {tournament.total_rounds}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${tournament.status === "active" ? "bg-green-500/10 text-green-400" : tournament.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {tournament.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Winner announcement */}
        {winner && (
          <div className="bg-gradient-to-br from-amber-500/10 to-primary/10 border border-amber-500/30 rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold mb-1">Tournament Champion</h2>
            <p className="text-3xl font-display font-black text-primary">{winner}</p>
          </div>
        )}

        {/* Active round */}
        {activeRound && (
          <div className="bg-card border border-primary/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">Round {activeRound.round_number} — Live</span>
                <h2 className="font-display text-lg font-bold mt-0.5">{activeRound.topic_title}</h2>
              </div>
              <button
                onClick={() => navigate(`/app?topic=${encodeURIComponent(activeRound.topic_title)}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" /> Start Debate
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: activeRound.persona_a, votes: activeRound.votes_a, field: "votes_a" as const },
                { id: activeRound.persona_b, votes: activeRound.votes_b, field: "votes_b" as const },
              ].map(side => {
                const hasVoted = !!userVotes[activeRound.id];
                const isMyVote = userVotes[activeRound.id] === side.id;
                const totalVotes = activeRound.votes_a + activeRound.votes_b;
                const pct = totalVotes > 0 ? Math.round((side.votes / totalVotes) * 100) : 50;
                return (
                  <div key={side.id} className={`rounded-xl border p-4 transition-all ${isMyVote ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                    <p className="font-display font-bold text-base mb-3">{side.id}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-display font-black">{pct}%</span>
                      <span className="text-xs text-muted-foreground font-body">{side.votes} votes</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {!hasVoted && profile && (
                      <button
                        onClick={() => vote(activeRound.id, side.id, side.field)}
                        disabled={voting === activeRound.id}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-display font-semibold border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Vote
                      </button>
                    )}
                    {isMyVote && (
                      <div className="flex items-center justify-center gap-1 text-xs text-primary font-semibold">
                        <ThumbsUp className="w-3 h-3 fill-current" /> Your vote
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isOwner && activeRound.votes_a + activeRound.votes_b > 0 && (
              <button
                onClick={() => advanceRound(activeRound)}
                className="mt-4 w-full py-2.5 text-sm font-display font-semibold border border-border rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" /> Advance to Next Round
              </button>
            )}
          </div>
        )}

        {/* Bracket visualization */}
        {bracketTree.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Tournament Bracket
            </h2>
            <BracketView tree={bracketTree[0]} />
          </div>
        )}

        {/* Linear history fallback */}
        {completedRounds.length > 0 && bracketTree.length === 0 && (
          <div>
            <h2 className="font-display text-lg font-bold mb-4">Results</h2>
            <div className="space-y-3">
              {completedRounds.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-1">Round {r.round_number}</p>
                    <p className="font-body text-sm text-muted-foreground truncate">{r.topic_title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm font-body">
                      <span className={r.winner_id === r.persona_a ? "font-bold text-primary" : "text-muted-foreground"}>{r.persona_a} ({r.votes_a})</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className={r.winner_id === r.persona_b ? "font-bold text-primary" : "text-muted-foreground"}>{r.persona_b} ({r.votes_b})</span>
                    </div>
                  </div>
                  {r.winner_id && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-display font-bold">{r.winner_id}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {rounds.length === 0 && tournament.status === "setup" && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display font-semibold text-muted-foreground">Tournament is being set up</p>
            <p className="text-sm text-muted-foreground font-body mt-1">Rounds will appear here once the tournament begins.</p>
          </div>
        )}
      </main>
    </div>
  );
}
