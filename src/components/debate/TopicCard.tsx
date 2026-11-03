import { motion } from "framer-motion";
import { Play, Pause, Users, MessageCircle } from "lucide-react";
import type { DebateTopic } from "@/data/debateData";
import { Button } from "@/components/ui/button";

interface TopicCardProps {
  activeTopic: DebateTopic;
  timeRemaining: number;
  heatLevel: number;
  isDebating: boolean;
  isPaused?: boolean;
  onStartDebate: () => void;
  onStopDebate: () => void;
  onPauseDebate?: () => void;
  onResumeDebate?: () => void;
  reactionTotal: number;
  personaCount: number;
}

export function TopicCard({
  activeTopic,
  timeRemaining,
  heatLevel,
  isDebating,
  isPaused = false,
  onStartDebate,
  onStopDebate,
  onPauseDebate,
  onResumeDebate,
  reactionTotal,
  personaCount,
}: TopicCardProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
            Topic
          </p>
          <p className="mt-0.5 text-sm font-display font-bold text-foreground leading-snug">
            {activeTopic.title}
          </p>
        </div>
        {isDebating && (
          <span className="shrink-0 text-[10px] font-body text-primary animate-heat-pulse">
            LIVE
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="font-display text-3xl font-bold text-primary tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-0.5">
            <span>Heat</span>
            <span>🔥 {Math.round(heatLevel)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(36 91% 55%), hsl(0 84% 60%))" }}
              animate={{ width: `${heatLevel}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          onClick={isDebating && onPauseDebate && onResumeDebate
            ? (isPaused ? onResumeDebate : onPauseDebate)
            : (isDebating ? onStopDebate : onStartDebate)}
          variant={isDebating ? "outline" : "default"}
          size="sm"
          className="flex-1 font-display font-semibold"
          aria-label={isDebating ? (isPaused ? "Resume debate" : "Pause debate") : "Start debate"}
        >
          {isDebating
            ? (isPaused
              ? <><Play className="w-3.5 h-3.5" /> Resume</>
              : <><Pause className="w-3.5 h-3.5" /> Pause</>)
            : <><Play className="w-3.5 h-3.5" /> Start Debate</>}
        </Button>
      </div>

      {/* Small labeled stats (absorbed from SpectatorBar) */}
      <div className="mt-3 flex items-center gap-3 text-[10px] font-body text-muted-foreground">
        <span className="inline-flex items-center gap-1" title="Personas at the table">
          <Users className="w-3 h-3" /> {personaCount}
        </span>
        <span className="inline-flex items-center gap-1" title="Spectator reactions">
          <MessageCircle className="w-3 h-3" /> {reactionTotal}
        </span>
      </div>
    </div>
  );
}
