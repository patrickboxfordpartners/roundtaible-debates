import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

// Price ID -> tier mapping is resolved from subscription metadata or price lookup.
// We determine the tier from the price metadata set during stripe-setup.

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  async function resolveTier(subscription: Stripe.Subscription): Promise<string> {
    // Check price metadata for tier
    const priceId = subscription.items.data[0]?.price?.id;
    if (priceId) {
      const price = await stripe.prices.retrieve(priceId);
      const tier = (price.metadata as Record<string, string>).tier;
      if (tier) return tier;
    }
    return "pro"; // fallback
  }

  function mapStatus(status: string): string {
    switch (status) {
      case "active":
      case "trialing":
        return "active";
      case "canceled":
        return "canceled";
      case "past_due":
        return "past_due";
      case "unpaid":
        return "past_due";
      default:
        return "inactive";
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const userId =
          subscription.metadata.supabase_user_id ||
          session.metadata?.supabase_user_id;

        if (!userId) {
          // Fallback: look up by stripe_customer_id
          const { data: profile } = await supabaseAdmin
            .from("rt_profiles")
            .select("id")
            .eq("stripe_customer_id", session.customer as string)
            .single();

          if (!profile) {
            console.error("No user found for customer:", session.customer);
            break;
          }

          const tier = await resolveTier(subscription);
          await supabaseAdmin
            .from("rt_profiles")
            .update({
              subscription_tier: tier,
              subscription_status: mapStatus(subscription.status),
              stripe_subscription_id: subscription.id,
            })
            .eq("id", profile.id);
          break;
        }

        const tier = await resolveTier(subscription);
        await supabaseAdmin
          .from("rt_profiles")
          .update({
            subscription_tier: tier,
            subscription_status: mapStatus(subscription.status),
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabaseAdmin
          .from("rt_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.error("No profile for customer:", customerId);
          break;
        }

        const tier = await resolveTier(subscription);
        await supabaseAdmin
          .from("rt_profiles")
          .update({
            subscription_tier: tier,
            subscription_status: mapStatus(subscription.status),
            stripe_subscription_id: subscription.id,
          })
          .eq("id", profile.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabaseAdmin
          .from("rt_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.error("No profile for customer:", customerId);
          break;
        }

        await supabaseAdmin
          .from("rt_profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", profile.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
