// Small helpers shared by the Vercel functions in /api.
// Files and folders that start with "_" are not deployed as their own functions.

export class HttpError extends Error {
  status: number;
  code?: string;
  /** Create an HTTP error with a response status and optional application error code. */
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Serialize data as a JSON response with no-store caching unless headers override it. */
export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

/** Convert HTTP errors to JSON responses and log unexpected errors before returning a generic 500. */
export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: err.message, code: err.code, status: err.status }, err.status);
  }
  console.error(err);
  return json({ error: "Internal server error", status: 500 }, 500);
}

const MAX_BODY_BYTES = 256 * 1024;

/** Parse a JSON request body, rejecting oversized or malformed text and treating an empty body as an object. */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = MAX_BODY_BYTES): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Request body too large");
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

// Best-effort in-memory rate limit (per function instance), same as the old edge functions.
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Apply a best-effort per-instance limit by endpoint and forwarded IP, throwing HTTP 429 when exceeded. */
export function rateLimit(req: Request, name: string, limit = 60, windowMs = 60_000): void {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${name}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 1000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return;
  }
  if (entry.count >= limit) throw new HttpError(429, "Rate limit exceeded");
  entry.count++;
}

/** Origin of the site that made the request, used to build redirect URLs server-side. */
export function siteOrigin(req: Request): string {
  return new URL(req.url).origin;
}
