import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_TOPICS } from "@/data/debateData";
import { Maximize2, Minimize2 } from "lucide-react";

export default function Kiosk() {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn("Fullscreen request failed:", err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.warn("Exit fullscreen failed:", err);
      }
    }
  }, []);

  const handleTopicSelect = (topicId: string) => {
    navigate(`/app?demo=true&topic=${topicId}`);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden parchment-texture vignette-overlay">
      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 z-50 p-3 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      {/* Header */}
      <div className="text-center mb-12 px-6">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
          Live Demo
        </p>
        <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4">
          Algonquin Roundt<span className="text-primary">AI</span>ble
        </h1>
        <p className="font-lora text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Watch history's greatest minds debate any topic.
        </p>
      </div>

      {/* Topic picker grid */}
      <div className="w-full max-w-5xl px-6">
        <p className="text-center text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-8">
          Pick a topic to start the debate
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DEMO_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicSelect(topic.id)}
              className="group relative bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/60 hover:bg-primary/5 transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <span className="block text-xs uppercase tracking-widest text-primary font-semibold mb-3 opacity-80">
                {topic.category}
              </span>
              <span className="block font-playfair text-xl md:text-2xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                {topic.title}
              </span>
              <span className="absolute bottom-4 right-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors text-2xl font-bold">
                →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-12 text-sm text-muted-foreground font-lora">
        theroundtaible.com
      </p>
    </div>
  );
}
