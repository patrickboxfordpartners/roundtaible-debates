// Contact form -> Boxford CRM intake. Moved from the old Supabase "crm-intake" edge function.

import { HttpError, errorResponse, json, rateLimit, readJson } from "./_lib/http.js";

/** Rate-limit contact submissions and forward JSON to the configured CRM, preserving its response status. */
export async function POST(req: Request): Promise<Response> {
  try {
    rateLimit(req, "contact", 5);
    const intakeUrl = process.env.CRM_INTAKE_URL;
    const intakeKey = process.env.CRM_INTAKE_KEY;
    if (!intakeUrl || !intakeKey) throw new HttpError(503, "CRM not configured");
    const body = await readJson(req, 32 * 1024);
    const res = await fetch(`${intakeUrl.replace(/\/$/, "")}/api/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-integration-key": intakeKey },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return json(data, res.status);
  } catch (err) {
    return errorResponse(err);
  }
}
