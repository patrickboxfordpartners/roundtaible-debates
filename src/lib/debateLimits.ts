import { supabase } from "@/services/supabaseClient";

const LIMITS: Record<string, number> = {
  pro: 25,
  edu: 100,
};

export function getMonthlyLimit(tier: string): number {
  return LIMITS[tier] ?? 0;
}

export async function getMonthlyDebateCount(userId: string): Promise<number> {
  if (!supabase) return 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("rt_debates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth);

  if (error) {
    return 0;
  }

  return count ?? 0;
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
