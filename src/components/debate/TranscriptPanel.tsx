import { useRef, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { TranscriptEntry, Persona } from "@/data/debateData";

// Parse educational markers like [Fact: ...], [Question: ...], [Vocabulary: ...]
function renderTextWithMarkers(text: string): ReactNode {
  const markerPattern = /\[(Fact|Question|Vocabulary):\s*([^\]]+)\]/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = markerPattern.exec(text)) !== null) {
    // Add text before the marker
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const type = match[1];
    const content = match[2];

    const styles: Record<string, string> = {
      Fact: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      Question: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      Vocabulary: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    };

    parts.push(
      <span
        key={key++}
        className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-display font-semibold rounded border ${styles[type] || ""}`}
      >
        {type}: {content}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  personasState: Persona[];
}

const humanPersona: Persona = {
  id: "human",
  name: "You",
  role: "The Audience",
  avatar: "",
  color: "#9E9E9E",
  wins: 0,
  quotes: [],
  context: "",
};

export function TranscriptPanel({ entries, personasState }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-display text-xs font-bold text-foreground px-3 py-1.5 border-b border-border uppercase tracking-wider text-muted-foreground">
        Transcript
      </h3>
      <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-1.5" role="log" aria-live="polite" aria-label="Debate transcript">
        {entries.map((entry, i) => {
          const persona = entry.personaId === "human"
            ? humanPersona
            : personasState.find((p) => p.id === entry.personaId);
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
                {renderTextWithMarkers(entry.text)}
              </p>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
