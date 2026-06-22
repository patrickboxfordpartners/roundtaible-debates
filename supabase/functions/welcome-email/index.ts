import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = [
  "https://theroundtaible.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const postmarkKey = Deno.env.get("POSTMARK_API_KEY");
    if (!postmarkKey) {
      console.error("Missing POSTMARK_API_KEY");
      return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
    }

    const { email, name, role } = await req.json() as {
      email: string;
      name?: string;
      role?: "teacher" | "student" | "user";
    };

    if (!email) {
      return new Response("Missing email", { status: 400, headers: corsHeaders });
    }

    const firstName = name ? name.split(" ")[0] : "there";
    const isTeacher = role === "teacher";

    const teacherSection = isTeacher
      ? `<p style="margin:0 0 16px 0;">As a teacher, you also have access to your <a href="https://theroundtaible.com/teacher" style="color:#C49A3C;text-decoration:none;">Educator Dashboard</a> — create classes, share join codes with students, and launch debates live in the classroom.</p>`
      : "";

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#1a1614;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1614;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#231f1c;border:1px solid #3a342e;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #3a342e;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C49A3C;font-family:Arial,sans-serif;">Historical AI Platform</p>
              <h1 style="margin:0;font-size:28px;color:#f5f0e8;font-family:Georgia,serif;">Algonquin Roundt<span style="color:#C49A3C;">AI</span>ble</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px 0;font-size:16px;color:#f5f0e8;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#c8bfb4;line-height:1.7;">Welcome to Roundtaible. You're now at the table with history's greatest minds — Jefferson, Tesla, Machiavelli, Curie, and eleven others — ready to debate any question you bring them.</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#c8bfb4;line-height:1.7;"><strong style="color:#f5f0e8;">Your first 3 debates are free.</strong> No credit card required. After that, a Pro plan gets you 25 debates per month — more than enough to explore every topic that matters to you.</p>
              ${teacherSection}
              <div style="text-align:center;margin:32px 0;">
                <a href="https://theroundtaible.com/app" style="display:inline-block;padding:14px 32px;background-color:#C49A3C;color:#1a1614;font-family:Arial,sans-serif;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">Start Your First Debate →</a>
              </div>
              <p style="margin:0 0 16px 0;font-size:13px;color:#8a7d72;line-height:1.6;">A few things worth trying: pick a topic you're genuinely uncertain about, then ask someone who lived through the consequences. The debates have a way of clarifying things.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #3a342e;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5a5049;">© Roundtaible · <a href="https://theroundtaible.com" style="color:#C49A3C;text-decoration:none;">theroundtaible.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: "Roundtaible <hello@theroundtaible.com>",
        To: email,
        Subject: "Welcome to Roundtaible — your first 3 debates are free",
        HtmlBody: htmlBody,
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Postmark API error:", res.status, errBody);
      return new Response("Email send failed", { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("welcome-email error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
