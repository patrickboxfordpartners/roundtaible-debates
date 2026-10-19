// Browser client for the app's own /api functions (Neon database, AI, voice, billing).
// Sends the Clerk session token when someone is signed in.

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter | null = null;

/** Called once by AuthProvider so API calls can attach the Clerk session token. */
export function setTokenGetter(fn: TokenGetter | null): void {
  getToken = fn;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Create an API failure with its HTTP status and optional application error code. */
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Build JSON request headers with a Clerk token when available, tolerating signed-out or unready sessions. */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (getToken) {
    try {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // signed out or Clerk not ready; continue without a token
    }
  }
  return headers;
}

/** POST JSON to /api/<path> and return the raw Response. */
export async function apiFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`/api/${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body ?? {}),
  });
}

/** POST JSON to /api/<path>, parse JSON, throw ApiError on non-2xx. */
export async function apiJson<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, body);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error || `Request failed (${res.status})`, (data as { code?: string }).code);
  }
  return data as T;
}

/** Run a database operation on /api/data. */
export function dataCall<T = unknown>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  return apiJson<T>("data", { op, args });
}
