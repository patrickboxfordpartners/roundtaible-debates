import { createClerkClient, verifyToken } from "@clerk/backend";
import { HttpError } from "./http.js";

/** Returns the signed-in Clerk user id, or null when the request has no valid session token. */
export async function getUserId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new HttpError(503, "Auth is not configured (CLERK_SECRET_KEY missing)");
  try {
    const payload = await verifyToken(header.slice(7), { secretKey });
    return payload.sub || null;
  } catch {
    return null;
  }
}

/** Return the verified Clerk user ID, or throw HTTP 401 when no valid session exists. */
export async function requireUserId(req: Request): Promise<string> {
  const id = await getUserId(req);
  if (!id) throw new HttpError(401, "Unauthorized");
  return id;
}

/** Looks up name and email from Clerk itself, so the browser can't claim someone else's email. */
export async function getClerkUser(userId: string): Promise<{ email: string; fullName: string }> {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(userId);
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) || user.emailAddresses[0];
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return { email: primary?.emailAddress || "", fullName };
}
