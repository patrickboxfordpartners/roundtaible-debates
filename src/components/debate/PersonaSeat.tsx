import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Persona } from "@/data/debateData";

interface PersonaSeatProps {
  persona: Persona;
  isSpeaking: boolean;
  isThinking: boolean;
  index: number;
  total: number;
  isWinner: boolean;
  onClickPersona: (persona: Persona) => void;
  containerRef: React.RefObject<HTMLDivElement>;
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

// Orbit radius as % of container, tuned per count so avatars
// never overlap each other or clip outside.
function orbitRadius(total: number): number {
  if (total <= 2) return 38;
  if (total <= 4) return 40;
  if (total <= 6) return 42;
  return 44;
}

export function PersonaSeat({ persona, isSpeaking, isThinking, index, total, isWinner, onClickPersona }: PersonaSeatProps) {
  const angle = (index / total) * 360 - 90;
  const radius = orbitRadius(total);
  const baseDelay = index * 0.25;

  const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
  const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1 z-20"
      style={{ left: `${x}%`, top: `${y}%`, x: "-50%", y: "-50%" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: baseDelay, type: "spring", stiffness: 160, damping: 14 }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`${persona.name}, ${persona.role}${isSpeaking ? " (speaking)" : isThinking ? " (thinking)" : ""}. Click to edit character.`}
        onClick={() => onClickPersona(persona)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClickPersona(persona); } }}
        className={`
          relative w-16 h-16 md:w-20 md:h-20 rounded-full cursor-pointer
          border-2 transition-all duration-500 overflow-hidden select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${isWinner ? "victory-glow border-gold" : isSpeaking ? "animate-pulse-glow border-primary" : "border-border hover:border-primary/50"}
        `}
        style={{ borderColor: isSpeaking ? persona.color : undefined }}
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        whileHover={{ scale: 1.08 }}
        transition={{ delay: baseDelay + 0.15, duration: 0.5, ease: "easeOut" }}
        title={`Click to edit ${persona.name}'s character`}
      >
        {persona.avatar ? (
          <motion.img
            src={persona.avatar}
            alt={`${persona.name}, ${persona.role}`}
            className="w-full h-full object-cover pointer-events-none"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: baseDelay + 0.25, duration: 0.6, ease: "easeOut" }}
            draggable={false}
            onError={(e) => {
              const t = e.currentTarget;
              t.style.display = "none";
              const parent = t.parentElement;
              if (parent) {
                parent.style.backgroundColor = persona.color;
                parent.innerHTML = `<span style="color:white;font-weight:700;font-size:1.2rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${persona.name.split(" ").map((w: string) => w[0]).join("")}</span>`;
              }
            }}
          />
        ) : (
          <span className="font-display text-lg md:text-xl font-bold" style={{ color: persona.color }}>
            {persona.name.split(" ").map((w) => w[0]).join("")}
          </span>
        )}

        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: `0 0 20px ${persona.color}66, 0 0 40px ${persona.color}33` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {isThinking && !isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="text-white text-xs font-body tracking-widest"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ...
            </motion.span>
          </motion.div>
        )}

        {persona.context && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border border-card" title="Custom context active" />
        )}
      </motion.div>

      <div className="text-center min-h-[28px] md:min-h-[32px] pointer-events-none">
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
