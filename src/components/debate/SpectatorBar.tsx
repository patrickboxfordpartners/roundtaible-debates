import { useState } from "react";
import { motion } from "framer-motion";
import { spectatorEmojis } from "@/data/debateData";
import { Send } from "lucide-react";

interface SpectatorBarProps {
  reactions: Record<string, number>;
  onReaction: (emoji: string) => void;
  onGallerySubmit: (text: string) => void;
}

export function SpectatorBar({ reactions, onReaction, onGallerySubmit }: SpectatorBarProps) {
  const [galleryText, setGalleryText] = useState("");

  const handleSubmit = () => {
    if (galleryText.trim()) {
      onGallerySubmit(galleryText.trim());
      setGalleryText("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-card/60 border-t border-border">
      {/* Reactions */}
      <div className="flex items-center gap-1">
        {spectatorEmojis.map(({ emoji, label }) => (
          <motion.button
            key={emoji}
            onClick={() => onReaction(emoji)}
            className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-background border border-border hover:border-primary/50 transition-colors text-sm"
            whileTap={{ scale: 0.9 }}
            title={label}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-body text-muted-foreground">{reactions[emoji] || 0}</span>
          </motion.button>
        ))}
      </div>

      {/* Gallery input */}
      <div className="flex-1 min-w-[150px] flex gap-1 items-center">
        <span className="text-[10px] font-display text-muted-foreground whitespace-nowrap">From the Gallery:</span>
        <input
          value={galleryText}
          onChange={(e) => setGalleryText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Submit a topic..."
          className="flex-1 px-2 py-1 text-xs font-body rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button onClick={handleSubmit} className="p-1 text-muted-foreground hover:text-primary transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
