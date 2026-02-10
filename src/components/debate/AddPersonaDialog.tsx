import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react";

interface AddPersonaDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (persona: { name: string; role: string; color: string; context: string }) => void;
}

const PRESET_COLORS = [
  "#D84315", "#6A1B9A", "#00838F", "#2E7D32", "#C62828", "#4527A0",
  "#00695C", "#E65100", "#1565C0", "#9E9D24",
];

export function AddPersonaDialog({ open, onClose, onAdd }: AddPersonaDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [context, setContext] = useState("");

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
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
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
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="block text-xs font-display font-semibold text-foreground mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oscar Wilde"
                className="w-full px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Role */}
            <div className="mb-3">
              <label className="block text-xs font-display font-semibold text-foreground mb-1">Role / Title</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. The Wit"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
