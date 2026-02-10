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
      <h3 className="font-display text-base font-bold text-foreground px-3 py-2 border-b border-border">
        📜 Transcript
      </h3>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {entries.map((entry, i) => {
          const persona = personas.find((p) => p.id === entry.personaId);
          if (!persona) return null;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-2"
            >
              <div
                className="w-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: persona.color }}
              />
              <div>
                <span
                  className="font-display text-xs font-semibold"
                  style={{ color: persona.color }}
                >
                  {persona.name}
                </span>
                <p className="text-sm font-body text-foreground/90 leading-relaxed">
                  {entry.text}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
