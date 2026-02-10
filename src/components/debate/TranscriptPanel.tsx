import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { personas, type TranscriptEntry } from "@/data/debateData";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-display text-xs font-bold text-foreground px-3 py-1.5 border-b border-border uppercase tracking-wider text-muted-foreground">
        Transcript
      </h3>
      <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-1.5">
        {entries.map((entry, i) => {
          const persona = personas.find((p) => p.id === entry.personaId);
          if (!persona) return null;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="flex gap-1.5"
            >
              <div
                className="w-0.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: persona.color }}
              />
              <p className="text-xs font-body text-foreground/90 leading-snug">
                <span
                  className="font-display font-semibold mr-1"
                  style={{ color: persona.color }}
                >
                  {persona.name}:
                </span>
                {entry.text}
              </p>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
