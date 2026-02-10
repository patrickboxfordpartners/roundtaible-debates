import { motion } from "framer-motion";
import type { Persona } from "@/data/debateData";

interface LeaderboardProps {
  leaderboard: Persona[];
}

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  return (
    <div className="flex flex-col">
      <div className="px-3 py-1.5 flex items-center gap-2 flex-wrap">
        {leaderboard.map((persona, i) => (
          <div key={persona.id} className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: persona.color }}
            >
              {persona.name[0]}
            </div>
            <span className="text-[10px] font-body text-muted-foreground">
              {persona.wins}
            </span>
            {i < leaderboard.length - 1 && (
              <span className="text-[8px] text-muted-foreground/40 mx-0.5">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
