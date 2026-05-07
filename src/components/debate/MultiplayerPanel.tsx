import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Copy, Link, LogOut, Crown } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { MultiplayerRole } from "@/hooks/useMultiplayer";

interface MultiplayerPanelProps {
  open: boolean;
  onClose: () => void;
  role: MultiplayerRole;
  roomId: string | null;
  guests: string[];
  pendingRoomId: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onLeaveRoom: () => void;
  onCopyLink: () => void;
}

export function MultiplayerPanel({
  open,
  onClose,
  role,
  roomId,
  guests,
  pendingRoomId,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onCopyLink,
}: MultiplayerPanelProps) {
  const [joinName, setJoinName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState(pendingRoomId || "");
  const handleClose = useCallback(() => onClose(), [onClose]);
  const focusRef = useFocusTrap(open, handleClose);

  const handleJoin = () => {
    const rid = joinRoomId.trim();
    const name = joinName.trim();
    if (!rid || !name) return;
    onJoinRoom(rid, name);
    onClose();
  };

  const handleCreate = () => {
    onCreateRoom();
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
            aria-label="Multiplayer room"
            className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">Multiplayer</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {role === "solo" ? (
              /* Not in a room, show create/join options */
              <div className="space-y-4">
                <p className="text-xs font-body text-muted-foreground">
                  Create a room to host a debate, or join an existing room to watch and participate.
                </p>

                {/* Create room */}
                <button
                  onClick={handleCreate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 font-display text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Crown className="w-4 h-4" /> Create Room (Host)
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-display text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Join room */}
                <div className="space-y-2">
                  <input
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Room code (e.g. abc123)"
                    className="w-full px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!joinName.trim() || !joinRoomId.trim()}
                    className="w-full px-4 py-2.5 font-display text-sm font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Link className="w-4 h-4" /> Join Room
                  </button>
                </div>

                <p className="text-[10px] font-body text-muted-foreground text-center">
                  Works across browser tabs on the same device. Supabase upgrade coming for cross-device play.
                </p>
              </div>
            ) : (
              /* In a room, show room info */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-display font-semibold rounded-full ${
                    role === "host"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  }`}>
                    {role === "host" ? "HOST" : "GUEST"}
                  </span>
                  <span className="font-mono text-sm text-foreground">{roomId}</span>
                </div>

                {/* Connected users */}
                <div>
                  <p className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Connected ({1 + guests.length})
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-body text-foreground">
                      <Crown className="w-3 h-3 text-primary" />
                      <span>You {role === "host" ? "(Host)" : ""}</span>
                    </div>
                    {guests.map((name) => (
                      <div key={name} className="flex items-center gap-2 text-xs font-body text-foreground">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{name}</span>
                      </div>
                    ))}
                    {guests.length === 0 && role === "host" && (
                      <p className="text-[10px] font-body text-muted-foreground italic">
                        No guests yet, share the link below
                      </p>
                    )}
                  </div>
                </div>

                {/* Share link (host only) */}
                {role === "host" && (
                  <button
                    onClick={onCopyLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-display text-sm font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
                  >
                    <Copy className="w-4 h-4" /> Copy Room Link
                  </button>
                )}

                {/* Leave room */}
                <button
                  onClick={() => { onLeaveRoom(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-display font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Leave Room
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
