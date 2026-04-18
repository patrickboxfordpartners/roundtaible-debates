import { useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function useBilling() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function getAuthHeaders(): Promise<Record<string, string>> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function startCheckout(priceId: string): Promise<void> {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${FUNCTIONS_BASE}/stripe-checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/app?subscribed=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Checkout failed");
      }

      const { url } = await res.json();
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal(): Promise<void> {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${FUNCTIONS_BASE}/stripe-portal`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Portal failed");
      }

      const { url } = await res.json();
      if (!url) throw new Error("No portal URL returned");
      window.location.href = url;
    } catch (err) {
      toast({
        title: "Billing portal unavailable",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, openBillingPortal, loading };
}
