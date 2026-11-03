// Contact form -> Boxford CRM intake. Moved from the old Supabase "crm-intake" edge function.

import { HttpError, errorResponse, json, rateLimit, readJson } from "./_lib/http.js";
import { notifySignup } from "./_lib/notify.js";

/** Rate-limit contact submissions and forward JSON to the configured CRM, preserving its response status. */
export async function POST(req: Request): Promise<Response> {
  try {
    rateLimit(req, "contact", 5);
    const intakeUrl = process.env.CRM_INTAKE_URL;
    const intakeKey = process.env.CRM_INTAKE_KEY;
    if (!intakeUrl || !intakeKey) throw new HttpError(503, "CRM not configured");
    const body = await readJson<Record<string, unknown>>(req, 32 * 1024);
    const res = await fetch(`${intakeUrl.replace(/\/$/, "")}/api/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-integration-key": intakeKey },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    // Alert on successful, non-duplicate submissions only
    const d = data as { duplicate?: boolean; deduped?: boolean; existing?: boolean; created?: boolean };
    const isDuplicate = Boolean(d && (d.duplicate || d.deduped || d.existing || d.created === false));
    if (res.ok && !isDuplicate && typeof body.email === "string") {
      await notifySignup({
        kind: "lead",
        email: body.email,
        name: typeof body.name === "string" ? body.name : undefined,
        details: {
          company: typeof body.company === "string" ? body.company : undefined,
          source: typeof body.source === "string" ? body.source : undefined,
        },
      });
    }

    return json(data, res.status);
  } catch (err) {
    return errorResponse(err);
  }
}
