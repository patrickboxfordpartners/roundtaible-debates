import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Users } from "lucide-react";
import { allPersonas } from "@/data/debateData";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { Persona } from "@/data/debateData";

interface AddPersonaDialogProps {
  open: boolean;
  existingIds: string[];
  onClose: () => void;
  onAdd: (persona: { name: string; role: string; color: string; context: string }) => void;
  onAddFromRoster: (persona: Persona) => void;
}

const PRESET_COLORS = [
  "#D84315", "#6A1B9A", "#00838F", "#2E7D32", "#C62828", "#4527A0",
  "#00695C", "#E65100", "#1565C0", "#9E9D24",
];

export function AddPersonaDialog({ open, existingIds, onClose, onAdd, onAddFromRoster }: AddPersonaDialogProps) {
  const [tab, setTab] = useState<"roster" | "custom">("roster");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [context, setContext] = useState("");
  const handleClose = useCallback(() => onClose(), [onClose]);
  const focusRef = useFocusTrap(open, handleClose);

  const availableRoster = allPersonas.filter(p => !existingIds.includes(p.id));

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      role: role.trim() || "Guest Debater",
      color,
      context: context.trim(),
    });
    setName("");
    setRole("");
    setColor(PRESET_COLORS[0]);
    setContext("");
    onClose();
  };

  const handleRosterPick = (persona: Persona) => {
    onAddFromRoster(persona);
    onClose();
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
            ref={focusRef}
            role="dialog"
            aria-modal="true"
            aria-label="Add persona to the table"
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">Add to the Table</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 p-1 bg-background rounded-lg border border-border">
              <button
                onClick={() => setTab("roster")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-md transition-colors ${
                  tab === "roster" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Historical Roster
              </button>
              <button
                onClick={() => setTab("custom")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-md transition-colors ${
                  tab === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Custom
              </button>
            </div>

            {tab === "roster" ? (
              /* Roster picker */
              <div className="space-y-2">
                {availableRoster.length === 0 ? (
                  <p className="text-sm font-body text-muted-foreground text-center py-4">
                    All roster personas are already at the table.
                  </p>
                ) : (
                  availableRoster.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => handleRosterPick(persona)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-white text-sm"
                        style={{ backgroundColor: persona.color }}
                      >
                        {persona.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-semibold text-foreground">{persona.name}</p>
                        <p className="font-body text-xs italic truncate" style={{ color: persona.color }}>{persona.role}</p>
                      </div>
                      <p className="text-[10px] font-body text-muted-foreground max-w-[120px] line-clamp-2">
                        {persona.quotes[0]}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* Custom persona form */
              <>
                {/* Name */}
                <div className="mb-3">
                  <label className="block text-xs font-display font-semibold text-foreground mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Socrates"
                    className="w-full px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Role */}
                <div className="mb-3">
                  <label className="block text-xs font-display font-semibold text-foreground mb-1">Role / Title</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. The Gadfly"
                    className="w-full px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Color */}
                <div className="mb-3">
                  <label className="block text-xs font-display font-semibold text-foreground mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        aria-label={`Select color ${c}`}
                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Context */}
                <div className="mb-4">
                  <label className="block text-xs font-display font-semibold text-foreground mb-1">Character Context (optional)</label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Personality, speaking style, debate positions..."
                    className="w-full h-20 px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Preview + Actions */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: color, borderColor: color }}
                  >
                    {name ? name.split(" ").map(w => w[0]).join("").slice(0, 2) : "?"}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{name || "New Persona"}</p>
                    <p className="font-body text-xs italic" style={{ color }}>{role || "Guest Debater"}</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-display font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="px-4 py-2 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add to Table
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
