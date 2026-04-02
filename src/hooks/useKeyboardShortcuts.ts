import { useEffect } from "react";

interface ShortcutHandlers {
  onStartDebate: () => void;
  onStopDebate: () => void;
  onLightningRound: () => void;
  onSurpriseMe: () => void;
  onToggleMute: () => void;
  onSummarize: () => void;
  onToggleHistory: () => void;
  isDebating: boolean;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ": // Space — start/stop debate
          e.preventDefault();
          if (handlers.isDebating) {
            handlers.onStopDebate();
          } else {
            handlers.onStartDebate();
          }
          break;
        case "l": // L — lightning round
          handlers.onLightningRound();
          break;
        case "s": // S — surprise me
          if (!e.metaKey && !e.ctrlKey) {
            handlers.onSurpriseMe();
          }
          break;
        case "m": // M — toggle mute
          handlers.onToggleMute();
          break;
        case "r": // R — summarize
          if (!e.metaKey && !e.ctrlKey) {
            handlers.onSummarize();
          }
          break;
        case "h": // H — toggle history
          handlers.onToggleHistory();
          break;
        case "escape": // Esc — stop debate
          if (handlers.isDebating) {
            handlers.onStopDebate();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
