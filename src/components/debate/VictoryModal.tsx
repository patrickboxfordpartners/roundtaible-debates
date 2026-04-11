import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Persona } from "@/data/debateData";

interface VictoryModalProps {
  winner: Persona | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function VictoryModal({ winner, onDismiss, autoDismissMs }: VictoryModalProps) {
  useEffect(() => {
    if (winner && autoDismissMs) {
      const timer = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [winner, autoDismissMs, onDismiss]);

  useEffect(() => {
    if (winner) {
      import("canvas-confetti").then((mod) => {
        mod.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F5A623", "#D4A574", "#FFD700", "#3E2723"],
        });
      });
    }
  }, [winner]);

  return (
    <AnimatePresence>
      {winner && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="bg-card border-2 border-gold rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: "spring", stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Crown */}
            <div className="text-5xl mb-2">👑</div>

            {/* Winner avatar */}
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-display font-bold text-white mb-4 victory-glow"
              style={{ backgroundColor: winner.color }}
            >
              {winner.name.split(" ").map((w) => w[0]).join("")}
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              {winner.name}
            </h2>
            <p className="font-body text-sm italic mb-4" style={{ color: winner.color }}>
              {winner.role}
            </p>

            <blockquote className="font-body text-sm text-muted-foreground italic border-l-2 border-primary pl-3 mb-6 text-left">
              "{winner.quotes[Math.floor(Math.random() * winner.quotes.length)]}"
            </blockquote>

            <p className="font-display text-lg font-bold text-primary mb-4">
              🏆 {winner.wins} Wins
            </p>

            <button
              onClick={onDismiss}
              className="px-6 py-2 font-display text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue Debate
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
