import { motion } from "framer-motion";
import type { Persona } from "@/data/debateData";

interface LeaderboardProps {
  leaderboard: Persona[];
}

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  return (
    <div className="flex flex-col">
      <h3 className="font-display text-base font-bold text-foreground px-3 py-2 border-b border-border">
        🏆 Leaderboard
      </h3>
      <div className="p-3 space-y-2">
        {leaderboard.map((persona, i) => (
          <motion.div
            key={persona.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-card/50"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="font-display text-sm font-bold text-muted-foreground w-5">
              {i + 1}.
            </span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: persona.color }}
            >
              {persona.name[0]}
            </div>
            <span className="font-body text-sm text-foreground flex-1 truncate">
              {persona.name}
            </span>
            <span className="font-display text-sm font-bold text-primary">
              {persona.wins}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
