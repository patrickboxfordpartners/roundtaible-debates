import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Zap, Shuffle, FileText, Send } from "lucide-react";
import { debateTopics, personas } from "@/data/debateData";

interface ControlBarProps {
  isDebating: boolean;
  onStartDebate: () => void;
  onStopDebate: () => void;
  onSelectTopic: (id: string) => void;
  onSurpriseMe: () => void;
  onPitchIdea: (text: string) => void;
  onVote: (personaId: string) => void;
  onSummarize: () => void;
}

export function ControlBar({
  isDebating,
  onStartDebate,
  onStopDebate,
  onSelectTopic,
  onSurpriseMe,
  onPitchIdea,
  onVote,
  onSummarize,
}: ControlBarProps) {
  const [micOn, setMicOn] = useState(false);
  const [pitchText, setPitchText] = useState("");

  const handlePitch = () => {
    if (pitchText.trim()) {
      onPitchIdea(pitchText.trim());
      setPitchText("");
    }
  };

  return (
    <motion.div
      className="w-full bg-card border-t border-border"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Topics row */}
      <div className="px-4 py-2 border-b border-border overflow-x-auto">
        <div className="flex gap-2 items-center min-w-max">
          <span className="font-display text-xs font-semibold text-muted-foreground mr-1">Topics:</span>
          {debateTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => { onSelectTopic(topic.id); if (!isDebating) onStartDebate(); }}
              className="px-3 py-1 text-xs font-body rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
            >
              {topic.title}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
        {/* Mic */}
        <button
          onClick={() => setMicOn(!micOn)}
          className={`p-2 rounded-lg border transition-colors ${micOn ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}
          title="Toggle microphone"
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Pitch input */}
        <div className="flex-1 min-w-[180px] flex gap-1">
          <input
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePitch()}
            placeholder="Pitch an idea..."
            className="flex-1 px-3 py-1.5 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handlePitch}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <button
          onClick={onSurpriseMe}
          className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
        >
          <Shuffle className="w-3.5 h-3.5" /> Surprise Me
        </button>

        <button
          onClick={isDebating ? onStopDebate : onStartDebate}
          className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
        >
          <Zap className="w-3.5 h-3.5" /> {isDebating ? "End Round" : "Lightning Round"}
        </button>

        <button
          onClick={onSummarize}
          className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" /> Summarize
        </button>

        {/* Vote avatars */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] font-display text-muted-foreground mr-1">Vote:</span>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => onVote(p.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-transparent hover:border-primary transition-all hover:scale-110"
              style={{ backgroundColor: p.color }}
              title={`Vote for ${p.name}`}
            >
              {p.name[0]}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
