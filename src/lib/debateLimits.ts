import { dataCall } from "@/services/api";

const LIMITS: Record<string, number> = {
  free: 3,
  pro: 25,
  edu: 100,
};

export function getMonthlyLimit(tier: string): number {
  return LIMITS[tier] ?? 0;
}

/** Fetch the session user’s calendar-month debate count, returning zero on failure; the userId argument is unused. */
export async function getMonthlyDebateCount(_userId: string): Promise<number> {
  // The server counts debates for the signed-in user this calendar month.
  try {
    const { count } = await dataCall<{ count: number }>("debates.monthlyCount");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function canStartDebate(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getMonthlyLimit(tier);
  if (limit === 0) return { allowed: false, used: 0, limit: 0 };

  const used = await getMonthlyDebateCount(userId);
  return { allowed: used < limit, used, limit };
}
