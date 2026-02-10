import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Persona } from "@/data/debateData";

interface PersonaSeatProps {
  persona: Persona;
  isSpeaking: boolean;
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

export function PersonaSeat({ persona, isSpeaking, index, total, isWinner, onClickPersona, containerRef }: PersonaSeatProps) {
  const angle = (index / total) * 360 - 90;
  // Table inset is 20%, so edge is at 30% from center. Place avatar centers right on that edge.
  const radius = 30;
  const baseDelay = index * 0.25;
  const [isDragging, setIsDragging] = useState(false);
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only open dialog if this wasn't a drag
    if (clickStartRef.current) {
      const dx = Math.abs(e.clientX - clickStartRef.current.x);
      const dy = Math.abs(e.clientY - clickStartRef.current.y);
      if (dx < 5 && dy < 5) {
        onClickPersona(persona);
      }
    }
    clickStartRef.current = null;
  };

  const initialX = 50 + radius * Math.cos((angle * Math.PI) / 180);
  const initialY = 50 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1 z-20 cursor-grab active:cursor-grabbing"
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
        x: "-50%",
        y: "-50%",
      }}
      drag
      dragMomentum={false}
      dragConstraints={containerRef}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setTimeout(() => setIsDragging(false), 50);
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: baseDelay, type: "spring", stiffness: 160, damping: 14 }}
      whileDrag={{ scale: 1.1, zIndex: 50 }}
    >
      {/* Avatar */}
      <motion.div
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`
          relative w-16 h-16 md:w-20 md:h-20 rounded-full
          border-2 transition-all duration-500 overflow-hidden select-none
          ${isWinner ? "victory-glow border-gold" : isSpeaking ? "animate-pulse-glow border-primary" : "border-border hover:border-primary/50"}
        `}
        style={{ borderColor: isSpeaking ? persona.color : undefined }}
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: baseDelay + 0.15, duration: 0.5, ease: "easeOut" }}
        title={`Click to edit ${persona.name}'s character • Drag to reposition`}
      >
        {persona.avatar ? (
          <motion.img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover pointer-events-none"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: baseDelay + 0.25, duration: 0.6, ease: "easeOut" }}
            draggable={false}
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
        {/* Context indicator dot */}
        {persona.context && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border border-card" title="Custom context active" />
        )}
      </motion.div>

      {/* Typewriter nameplate */}
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
