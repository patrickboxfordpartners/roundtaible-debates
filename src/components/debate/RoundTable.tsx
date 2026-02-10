import { useRef } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { type DebateTopic } from "@/data/debateData";
import { PersonaSeat } from "./PersonaSeat";
import { JumpInButton } from "./JumpInButton";
import type { Persona } from "@/data/debateData";

interface RoundTableProps {
  activeTopic: DebateTopic;
  speakingId: string | null;
  heatLevel: number;
  timeRemaining: number;
  isDebating: boolean;
  winner: Persona | null;
  personasState: Persona[];
  onClickPersona: (persona: Persona) => void;
  onAddPersona: () => void;
  onJumpIn: (message: string) => void;
}

export function RoundTable({ activeTopic, speakingId, heatLevel, timeRemaining, isDebating, winner, personasState, onClickPersona, onAddPersona, onJumpIn }: RoundTableProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full max-w-[500px] mx-auto aspect-square">
      {/* Table surface */}
      <motion.div
        className="absolute inset-[20%] rounded-full wood-gradient table-rim"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
      >
        {/* Outer decorative ring */}
        <div className="absolute inset-1 rounded-full border border-amber-glow/20" />
        {/* Inner felt/leather inlay */}
        <div className="absolute inset-4 rounded-full border border-amber-glow/15 bg-wood-dark/30" />

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

          <div className="mt-2 font-display text-2xl md:text-3xl font-bold text-primary">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>

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

      {/* Add persona button */}
      <motion.button
        onClick={onAddPersona}
        className="absolute z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-full font-display text-[10px] font-semibold border border-dashed border-border bg-card/80 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all shadow-md"
        style={{ top: "6px", right: "6px" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        title="Add a new persona to the table"
      >
        <UserPlus className="w-3.5 h-3.5" /> Add
      </motion.button>

      {/* Jump In button */}
      <JumpInButton isDebating={isDebating} onJumpIn={onJumpIn} />

      {/* Persona seats */}
      {personasState.map((persona, i) => (
        <PersonaSeat
          key={persona.id}
          persona={persona}
          isSpeaking={speakingId === persona.id}
          index={i}
          total={personasState.length}
          isWinner={winner?.id === persona.id}
          onClickPersona={onClickPersona}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      ))}
    </div>
  );
}
