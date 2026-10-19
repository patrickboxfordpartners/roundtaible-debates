import { useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

const BILLING_URL = "/api/billing";

/** Expose authenticated Stripe checkout and portal redirects with loading state and failure notifications. */
export function useBilling() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useClerkAuth();

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /** Request checkout for a plan price and redirect to Stripe, showing a toast if the request fails. */
  async function startCheckout(priceId: string): Promise<void> {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      // Success and cancel URLs are built on the server from this site's address.
      const res = await fetch(BILLING_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "checkout", priceId }),
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

  /** Request the signed-in customer’s billing portal and redirect, showing a toast on failure. */
  async function openBillingPortal(): Promise<void> {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(BILLING_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "portal" }),
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
