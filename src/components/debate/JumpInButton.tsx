import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Send, X } from "lucide-react";

interface JumpInButtonProps {
  isDebating: boolean;
  onJumpIn: (message: string) => void;
}

export function JumpInButton({ isDebating, onJumpIn }: JumpInButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [queued, setQueued] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    onJumpIn(message.trim());
    setMessage("");
    setExpanded(false);
    setQueued(true);
    setTimeout(() => setQueued(false), 3000);
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="bg-card border border-border rounded-xl p-3 shadow-2xl w-72"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-xs font-semibold text-foreground">Your turn to speak</p>
              <button onClick={() => setExpanded(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] font-body text-muted-foreground mb-2">
              Your message will be added after the current speaker finishes.
            </p>
            <div className="flex gap-1">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Make your argument..."
                className="flex-1 px-2 py-1.5 text-xs font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!message.trim()}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display text-xs font-semibold border transition-all shadow-lg ${
          queued
            ? "bg-accent text-accent-foreground border-accent"
            : expanded
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/10"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Hand className="w-3.5 h-3.5" />
        {queued ? "Queued!" : "Jump In"}
      </motion.button>
    </div>
  );
}
