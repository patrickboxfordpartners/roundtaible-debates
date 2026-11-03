import { useRef } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { type DebateTopic } from "@/data/debateData";
import { PersonaSeat } from "./PersonaSeat";
import type { Persona } from "@/data/debateData";

interface RoundTableProps {
  activeTopic: DebateTopic;
  speakingId: string | null;
  thinkingId: string | null;
  winner: Persona | null;
  personasState: Persona[];
  onClickPersona: (persona: Persona) => void;
  onAddPersona: () => void;
}

export function RoundTable({ activeTopic, speakingId, thinkingId, winner, personasState, onClickPersona, onAddPersona }: RoundTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full max-w-none lg:max-w-[640px] mx-auto aspect-square">
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

        {/* Center shows only the topic now; timer and heat moved to TopicCard */}
        <div className="absolute inset-0 flex items-center justify-center p-6 md:p-10 text-center">
          <motion.p
            className="font-display text-sm md:text-lg font-bold text-secondary-foreground leading-snug max-w-[80%]"
            key={activeTopic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeTopic.title}
          </motion.p>
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

      {/* Persona seats */}
      {personasState.map((persona, i) => (
        <PersonaSeat
          key={persona.id}
          persona={persona}
          isSpeaking={speakingId === persona.id}
          isThinking={thinkingId === persona.id}
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
