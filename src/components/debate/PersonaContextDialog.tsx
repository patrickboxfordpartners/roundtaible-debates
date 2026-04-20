import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Trash2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { Persona } from "@/data/debateData";

interface PersonaContextDialogProps {
  persona: Persona | null;
  onClose: () => void;
  onSave: (personaId: string, context: string) => void;
  onRemove: (personaId: string) => void;
}

export function PersonaContextDialog({ persona, onClose, onSave, onRemove }: PersonaContextDialogProps) {
  const [contextText, setContextText] = useState(persona?.context || "");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const focusRef = useFocusTrap(!!persona, handleClose);

  // Sync when persona changes
  useEffect(() => {
    if (persona) {
      setContextText(persona.context || "");
      setConfirmRemove(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when persona identity changes, not on every re-render
  }, [persona?.id]);

  const handleSave = () => {
    if (persona) {
      onSave(persona.id, contextText);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {persona && (
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
            aria-label={persona ? `Edit ${persona.name}` : "Edit persona"}
            className="bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border-2"
                style={{ borderColor: persona.color }}
              >
                {persona.avatar ? (
                  <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-display font-bold text-white"
                    style={{ backgroundColor: persona.color }}
                  >
                    {persona.name.split(" ").map(w => w[0]).join("")}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold text-foreground">{persona.name}</h2>
                <p className="font-body text-sm italic" style={{ color: persona.color }}>{persona.role}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Character quotes */}
            <div className="mb-4 p-3 rounded-lg bg-background/60 border border-border">
              <p className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1">Famous Quotes</p>
              {persona.quotes.map((q, i) => (
                <p key={i} className="font-body text-xs text-muted-foreground italic leading-relaxed">
                  "{q}"
                </p>
              ))}
            </div>

            {/* Context textarea */}
            <div className="mb-4">
              <label className="block text-xs font-display font-semibold text-foreground mb-1.5">
                Character Context & Instructions
              </label>
              <p className="text-[10px] font-body text-muted-foreground mb-2">
                Add personality traits, speaking style, debate positions, or any additional context for this persona's responses.
              </p>
              <textarea
                value={contextText}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) setContextText(e.target.value);
                }}
                maxLength={2000}
                placeholder={`e.g. "${persona.name} is particularly passionate about technology and always argues from an innovation-first perspective. Speaks in short, punchy sentences..."`}
                className="w-full h-32 px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className={`text-[10px] font-body mt-1 text-right ${contextText.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>
                {contextText.length}/2000
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-xs font-body text-muted-foreground">
              <span>🏆 {persona.wins} wins</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{contextText.length > 0 ? "Custom context active" : "No custom context"}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              {/* Remove */}
              <div>
                {!confirmRemove ? (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="px-3 py-2 text-sm font-display font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-body text-destructive">Remove from table?</span>
                    <button
                      onClick={() => {
                        if (persona) {
                          onRemove(persona.id);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs font-display font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmRemove(false)}
                      className="px-2.5 py-1.5 text-xs font-display font-semibold rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-display font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Context
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
