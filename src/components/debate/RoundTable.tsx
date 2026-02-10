import { motion } from "framer-motion";
import { personas, type DebateTopic } from "@/data/debateData";
import { PersonaSeat } from "./PersonaSeat";
import type { Persona } from "@/data/debateData";

interface RoundTableProps {
  activeTopic: DebateTopic;
  speakingId: string | null;
  heatLevel: number;
  timeRemaining: number;
  isDebating: boolean;
  onVote: (id: string) => void;
  winner: Persona | null;
}

export function RoundTable({ activeTopic, speakingId, heatLevel, timeRemaining, isDebating, onVote, winner }: RoundTableProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="relative w-full max-w-[520px] mx-auto aspect-square">
      {/* Table surface */}
      <motion.div
        className="absolute inset-[18%] rounded-full wood-gradient border-4 border-wood-medium shadow-2xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
      >
        {/* Inner ring */}
        <div className="absolute inset-3 rounded-full border border-amber-glow/30" />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 text-center">
          <motion.p
            className="font-display text-sm md:text-lg font-bold text-secondary-foreground leading-snug max-w-[80%]"
            key={activeTopic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeTopic.title}
          </motion.p>

          {/* Timer */}
          <div className="mt-2 font-display text-2xl md:text-3xl font-bold text-primary">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>

          {/* Heat meter */}
          <div className="mt-2 w-3/4 max-w-[120px]">
            <div className="flex justify-between text-[9px] font-body text-secondary-foreground/70 mb-0.5">
              <span>Cool</span>
              <span>🔥</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, hsl(36 91% 55%), hsl(0 84% 60%))`,
                }}
                animate={{ width: `${heatLevel}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
          </div>

          {isDebating && (
            <motion.div
              className="mt-1 text-[10px] font-body text-primary animate-heat-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              LIVE DEBATE
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Persona seats */}
      {personas.map((persona, i) => (
        <PersonaSeat
          key={persona.id}
          persona={persona}
          isSpeaking={speakingId === persona.id}
          index={i}
          total={personas.length}
          onVote={onVote}
          isWinner={winner?.id === persona.id}
        />
      ))}
    </div>
  );
}
