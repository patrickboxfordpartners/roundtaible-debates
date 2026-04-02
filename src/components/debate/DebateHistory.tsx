import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, X, Copy, Trash2, Clock, Trophy } from "lucide-react";
import { getSavedDebates, deleteDebate, clearHistory, formatTranscriptForExport, type SavedDebate } from "@/services/debateHistory";
import { toast } from "sonner";

interface DebateHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function DebateHistory({ open, onClose }: DebateHistoryProps) {
  const [debates, setDebates] = useState<SavedDebate[]>([]);
  const [selectedDebate, setSelectedDebate] = useState<SavedDebate | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (open) {
      setDebates(getSavedDebates());
      setSelectedDebate(null);
      setConfirmClear(false);
    }
  }, [open]);

  const handleCopy = (debate: SavedDebate) => {
    const text = formatTranscriptForExport(debate);
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Transcript copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  const handleDelete = (id: string) => {
    deleteDebate(id);
    setDebates(prev => prev.filter(d => d.id !== id));
    if (selectedDebate?.id === id) setSelectedDebate(null);
    toast.info("Debate deleted");
  };

  const handleClearAll = () => {
    clearHistory();
    setDebates([]);
    setSelectedDebate(null);
    setConfirmClear(false);
    toast.info("History cleared");
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">Debate History</h2>
                <span className="text-xs font-body text-muted-foreground">({debates.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {debates.length > 0 && (
                  confirmClear ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-body text-destructive">Clear all?</span>
                      <button onClick={handleClearAll} className="px-2 py-1 text-xs font-display font-semibold rounded bg-destructive text-destructive-foreground">Yes</button>
                      <button onClick={() => setConfirmClear(false)} className="px-2 py-1 text-xs font-display font-semibold rounded border border-border">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="text-xs font-display text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear All
                    </button>
                  )
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {debates.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">No debates saved yet.</p>
                  <p className="font-body text-xs text-muted-foreground/60 mt-1">Debates are saved when you vote for a winner or end a round.</p>
                </div>
              ) : selectedDebate ? (
                /* Debate detail / transcript view */
                <div>
                  <button
                    onClick={() => setSelectedDebate(null)}
                    className="text-xs font-display text-primary hover:underline mb-3 inline-block"
                  >
                    &larr; Back to list
                  </button>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">{selectedDebate.topic.title}</h3>
                      <div className="flex items-center gap-3 text-xs font-body text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(selectedDebate.duration)}</span>
                        {selectedDebate.winnerId && (
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {selectedDebate.personas.find(p => p.id === selectedDebate.winnerId)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedDebate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Transcript
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedDebate.transcript.map((entry) => {
                      const persona = entry.personaId === "human"
                        ? { name: "You", color: "#9E9E9E" }
                        : selectedDebate.personas.find(p => p.id === entry.personaId);
                      if (!persona) return null;
                      return (
                        <div key={entry.id} className="flex gap-1.5">
                          <div className="w-0.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: persona.color }} />
                          <p className="text-xs font-body text-foreground/90 leading-snug">
                            <span className="font-display font-semibold mr-1" style={{ color: persona.color }}>{persona.name}:</span>
                            {entry.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Debate list */
                <div className="space-y-2">
                  {debates.map((debate) => {
                    const winner = debate.winnerId
                      ? debate.personas.find(p => p.id === debate.winnerId)
                      : null;
                    return (
                      <div
                        key={debate.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-all cursor-pointer group"
                        onClick={() => setSelectedDebate(debate)}
                      >
                        {/* Persona color dots */}
                        <div className="flex -space-x-1 flex-shrink-0">
                          {debate.personas.slice(0, 4).map((p) => (
                            <div
                              key={p.id}
                              className="w-5 h-5 rounded-full border border-card text-[7px] font-bold text-white flex items-center justify-center"
                              style={{ backgroundColor: p.color }}
                            >
                              {p.name[0]}
                            </div>
                          ))}
                          {debate.personas.length > 4 && (
                            <div className="w-5 h-5 rounded-full border border-card bg-muted text-[7px] font-bold text-muted-foreground flex items-center justify-center">
                              +{debate.personas.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm font-semibold text-foreground truncate">{debate.topic.title}</p>
                          <div className="flex items-center gap-2 text-[10px] font-body text-muted-foreground">
                            <span>{formatDate(debate.savedAt)}</span>
                            <span>{formatDuration(debate.duration)}</span>
                            <span>{debate.transcript.length} exchanges</span>
                            {winner && (
                              <span style={{ color: winner.color }}>Won by {winner.name}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(debate); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Copy transcript"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(debate.id); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
