import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, X, FastForward } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { SavedDebate } from "@/services/debateHistory";

interface DebateReplayProps {
  debate: SavedDebate | null;
  onClose: () => void;
}

const SPEEDS = [1, 1.5, 2, 3] as const;
const ENTRY_INTERVAL_MS = 2500; // Base time between entries at 1x

export function DebateReplay({ debate, onClose }: DebateReplayProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const focusRef = useFocusTrap(!!debate, handleClose);

  const total = debate?.transcript.length ?? 0;

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || !debate) return;
    if (currentIndex >= total - 1) {
      setIsPlaying(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, ENTRY_INTERVAL_MS / speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, total, speed, debate]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [currentIndex]);

  // Reset when debate changes
  useEffect(() => {
    setCurrentIndex(-1);
    setIsPlaying(false);
    setSpeed(1);
  }, [debate?.id]);

  const togglePlay = () => {
    if (currentIndex >= total - 1) {
      // Restart from beginning
      setCurrentIndex(0);
      setIsPlaying(true);
    } else if (currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const skipBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const skipForward = () => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const seekTo = (index: number) => {
    setCurrentIndex(index);
  };

  if (!debate) return null;

  const progress = total > 0 ? Math.max(0, (currentIndex + 1) / total) : 0;
  const visibleEntries = debate.transcript.slice(0, currentIndex + 1);
  const currentSpeakerId = currentIndex >= 0 ? debate.transcript[currentIndex]?.personaId : null;

  return (
    <AnimatePresence>
      {debate && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={focusRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Replaying: ${debate.topic.title}`}
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[85vh] flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {debate.topic.title}
                </h2>
                <p className="text-[10px] font-body text-muted-foreground">
                  {debate.transcript.length} exchanges
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close replay"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Persona avatars row */}
            <div className="flex gap-2 mb-3 flex-shrink-0">
              {debate.personas.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${
                    currentSpeakerId === p.id
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-border bg-background"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <span
                    className="text-[10px] font-display font-semibold"
                    style={{ color: currentSpeakerId === p.id ? p.color : undefined }}
                  >
                    {p.name.split(" ")[0]}
                  </span>
                  {currentSpeakerId === p.id && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Transcript replay area */}
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto min-h-0 mb-3 border border-border rounded-lg bg-background p-3 space-y-2"
              role="log"
              aria-live="polite"
            >
              {currentIndex === -1 ? (
                <p className="text-sm font-body text-muted-foreground text-center py-8">
                  Press play to begin the replay
                </p>
              ) : (
                visibleEntries.map((entry, i) => {
                  const persona =
                    entry.personaId === "human"
                      ? { name: "You", color: "#9E9E9E" }
                      : debate.personas.find((p) => p.id === entry.personaId);
                  if (!persona) return null;
                  const isLatest = i === visibleEntries.length - 1;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-1.5 ${isLatest ? "" : "opacity-70"}`}
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
                })
              )}
            </div>

            {/* Timeline scrubber */}
            <div className="mb-3 flex-shrink-0">
              <div
                className="relative w-full h-2 bg-border rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seekTo(Math.round(pct * (total - 1)));
                }}
                role="slider"
                aria-label="Replay timeline"
                aria-valuemin={0}
                aria-valuemax={total - 1}
                aria-valuenow={Math.max(0, currentIndex)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") skipForward();
                  else if (e.key === "ArrowLeft") skipBack();
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
                {/* Entry markers */}
                {debate.transcript.map((entry, i) => {
                  const pct = total > 1 ? (i / (total - 1)) * 100 : 50;
                  const persona = debate.personas.find((p) => p.id === entry.personaId);
                  return (
                    <div
                      key={entry.id}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-card transition-all group-hover:scale-125"
                      style={{
                        left: `${pct}%`,
                        backgroundColor: i <= currentIndex ? (persona?.color || "#888") : "var(--border)",
                        transform: `translate(-50%, -50%) ${i === currentIndex ? "scale(1.8)" : ""}`,
                      }}
                      title={`${persona?.name || "Unknown"}: "${entry.text.slice(0, 40)}..."`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-[10px] font-body text-muted-foreground">
                <span>{Math.max(0, currentIndex + 1)} / {total}</span>
                <span>{speed}x speed</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2 flex-shrink-0">
              <button
                onClick={skipBack}
                disabled={currentIndex <= 0}
                aria-label="Previous entry"
                className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause replay" : "Play replay"}
                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={skipForward}
                disabled={currentIndex >= total - 1}
                aria-label="Next entry"
                className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={cycleSpeed}
                aria-label={`Playback speed: ${speed}x`}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-xs font-display font-semibold flex items-center gap-1"
              >
                <FastForward className="w-3.5 h-3.5" />
                {speed}x
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
