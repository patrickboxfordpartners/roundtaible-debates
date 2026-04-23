import { useRef, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { TranscriptEntry, Persona } from "@/data/debateData";

const MARKER_CONFIG: Record<string, { icon: string; label: string; classes: string; titlePrefix: string }> = {
  Fact: {
    icon: "📋",
    label: "Fact",
    classes: "bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25",
    titlePrefix: "Historical fact",
  },
  Question: {
    icon: "💭",
    label: "Discuss",
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25",
    titlePrefix: "Discussion question",
  },
  Vocabulary: {
    icon: "📖",
    label: "Vocab",
    classes: "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25",
    titlePrefix: "Vocabulary term",
  },
};

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

    const cfg = MARKER_CONFIG[type];
    parts.push(
      <span
        key={key++}
        title={cfg ? `${cfg.titlePrefix}: ${content}` : content}
        className={`inline-flex items-center gap-1 mt-1 ml-0.5 px-2 py-0.5 text-[10px] font-display font-semibold rounded-full border cursor-help transition-colors ${cfg?.classes || "bg-muted text-muted-foreground border-border"}`}
      >
        <span aria-hidden="true">{cfg?.icon}</span>
        <span>{cfg?.label ?? type}: {content}</span>
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
