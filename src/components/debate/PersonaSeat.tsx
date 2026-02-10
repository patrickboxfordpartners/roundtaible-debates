import { motion } from "framer-motion";
import type { Persona } from "@/data/debateData";

interface PersonaSeatProps {
  persona: Persona;
  isSpeaking: boolean;
  index: number;
  total: number;
  onVote: (id: string) => void;
  isWinner: boolean;
}

const initialsFrom = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2);

export function PersonaSeat({ persona, isSpeaking, index, total, onVote, isWinner }: PersonaSeatProps) {
  const angle = (index / total) * 360 - 90;
  const radius = 42; // % from center

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: `${50 + radius * Math.cos((angle * Math.PI) / 180)}%`,
        top: `${50 + radius * Math.sin((angle * Math.PI) / 180)}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
    >
      {/* Avatar */}
      <motion.button
        onClick={() => onVote(persona.id)}
        className={`
          relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
          font-display text-lg md:text-xl font-bold cursor-pointer
          border-2 transition-all duration-500
          ${isWinner ? "victory-glow border-gold" : isSpeaking ? "animate-pulse-glow border-primary" : "border-border hover:border-primary/50"}
        `}
        style={{ backgroundColor: persona.color + "22", color: persona.color, borderColor: isSpeaking ? persona.color : undefined }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={`Vote for ${persona.name}`}
      >
        {initialsFrom(persona.name)}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 20px ${persona.color}66, 0 0 40px ${persona.color}33` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Nameplate */}
      <div className="text-center">
        <p className="font-display text-xs md:text-sm font-semibold text-foreground leading-tight">
          {persona.name}
        </p>
        <p
          className="text-[10px] md:text-xs font-body italic"
          style={{ color: persona.color }}
        >
          {persona.role}
        </p>
      </div>
    </motion.div>
  );
}
