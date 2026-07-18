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
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "#fff", borderTop: "1px solid #e5e5e5",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
      padding: "12px 16px",
      paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "12px",
      fontFamily: "Inter, -apple-system, sans-serif",
    }}>
      <p style={{ fontSize: "12px", color: "#555", margin: 0, flex: 1, lineHeight: 1.4 }}>
        We use cookies.{" "}
        <Link to={privacyPath} style={{ color: "#2563eb", textDecoration: "underline" }}>
          Privacy Policy
        </Link>
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button onClick={decline} style={{
          padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e5e5",
          background: "#fff", color: "#555", fontSize: "12px",
          cursor: "pointer", minHeight: "36px", whiteSpace: "nowrap",
        }}>
          Decline
        </button>
        <button onClick={accept} style={{
          padding: "8px 14px", borderRadius: "8px", border: "none",
          background: "#2563eb", color: "#fff", fontSize: "12px",
          fontWeight: 600, cursor: "pointer", minHeight: "36px",
        }}>
          Accept
        </button>
      </div>
    </div>
  );
}
