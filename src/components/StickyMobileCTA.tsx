import { useNavigate } from "react-router-dom";

export function StickyMobileCTA() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border bg-background/95 backdrop-blur-sm px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/auth")}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        Try 3 debates free
      </button>
    </div>
  );
}
