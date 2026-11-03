// Internal signup/lead alert via Postmark. Ported from the old Supabase "_shared/notify-signup".
// Never throws, never blocks the caller.

const APP_NAME = "RoundTAIble";
const FROM = "Roundtaible <hello@theroundtaible.com>";
const DEFAULT_TO = "patrick@boxfordpartners.com";

export interface SignupAlert {
  kind: string;
  email: string;
  name?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
}

/** Send a short internal alert email; skip silently when unconfigured and log delivery failures. */
export async function notifySignup(alert: SignupAlert): Promise<void> {
  try {
    const token = process.env.POSTMARK_API_KEY;
    if (!token) return;

    const to = process.env.SIGNUP_ALERT_TO ?? DEFAULT_TO;
    const lines = [
      `App: ${APP_NAME}`,
      `Kind: ${alert.kind}`,
      `Email: ${alert.email}`,
      `Name: ${alert.name || "-"}`,
      `Time: ${new Date().toISOString()}`,
    ];
    for (const [k, v] of Object.entries(alert.details ?? {})) {
      if (v !== undefined && v !== null && v !== "") lines.push(`${k}: ${v}`);
    }

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: FROM,
        To: to,
        Subject: `[${APP_NAME}] New ${alert.kind}: ${alert.email}`,
        TextBody: lines.join("\n"),
        MessageStream: "outbound",
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("notifySignup Postmark error:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("notifySignup failed:", err);
  }
}
