import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { HttpError } from "./http.js";

let client: NeonQueryFunction<false, false> | null = null;

/** Neon HTTP client. Reads DATABASE_URL at request time so builds never need it. */
export function db(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new HttpError(503, "Database is not configured (DATABASE_URL missing)");
  if (!client) client = neon(url);
  return client;
}
