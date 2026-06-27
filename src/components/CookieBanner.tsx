import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "cookie_consent";

export function CookieBanner({ privacyPath = "/privacy" }: { privacyPath?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-card/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
        <p className="font-lora text-sm text-muted-foreground flex-1 min-w-[200px] leading-relaxed">
          We use cookies to improve your experience and analyze site usage.
          California residents: we do not sell your personal information.{" "}
          <Link to={privacyPath} className="text-primary underline hover:text-primary/80 transition-colors">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg border border-border bg-background text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
