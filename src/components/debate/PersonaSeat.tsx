import { useState, useEffect } from "react";
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

function TypewriterText({ text, delay, className, style }: { text: string; delay: number; className?: string; style?: React.CSSProperties }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, 45);
    return () => clearTimeout(timer);
  }, [started, displayed, text]);

  return (
    <span className={className} style={style}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse text-primary">▌</span>
      )}
    </span>
  );
}

export function PersonaSeat({ persona, isSpeaking, index, total, onVote, isWinner }: PersonaSeatProps) {
  const angle = (index / total) * 360 - 90;
  const radius = 42;
  const baseDelay = index * 0.25;

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: `${50 + radius * Math.cos((angle * Math.PI) / 180)}%`,
        top: `${50 + radius * Math.sin((angle * Math.PI) / 180)}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: baseDelay, type: "spring", stiffness: 160, damping: 14 }}
    >
      {/* Avatar with fade-in + ring animation */}
      <motion.button
        onClick={() => onVote(persona.id)}
        className={`
          relative w-16 h-16 md:w-20 md:h-20 rounded-full cursor-pointer
          border-2 transition-all duration-500 overflow-hidden
          ${isWinner ? "victory-glow border-gold" : isSpeaking ? "animate-pulse-glow border-primary" : "border-border hover:border-primary/50"}
        `}
        style={{ borderColor: isSpeaking ? persona.color : undefined }}
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: baseDelay + 0.15, duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={`Vote for ${persona.name}`}
      >
        {persona.avatar ? (
          <motion.img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: baseDelay + 0.25, duration: 0.6, ease: "easeOut" }}
          />
        ) : (
          <span className="font-display text-lg md:text-xl font-bold" style={{ color: persona.color }}>
            {persona.name.split(" ").map((w) => w[0]).join("")}
          </span>
        )}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 20px ${persona.color}66, 0 0 40px ${persona.color}33` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Typewriter nameplate */}
      <div className="text-center min-h-[28px] md:min-h-[32px]">
        <p className="font-display text-xs md:text-sm font-semibold text-foreground leading-tight">
          <TypewriterText text={persona.name} delay={baseDelay + 0.5} />
        </p>
        <p className="text-[10px] md:text-xs font-body italic">
          <TypewriterText
            text={persona.role}
            delay={baseDelay + 0.5 + persona.name.length * 0.045 + 0.2}
            style={{ color: persona.color }}
          />
        </p>
      </div>
    </motion.div>
  );
}
