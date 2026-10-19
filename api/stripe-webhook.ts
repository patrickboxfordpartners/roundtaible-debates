// Stripe webhook: keeps rt_profiles.subscription_tier in sync with Stripe.
// Moved from the old Supabase "stripe-webhook" edge function.
// Stripe endpoint URL: https://theroundtaible.com/api/stripe-webhook

import Stripe from "stripe";
import { db } from "./_lib/db.js";

function mapStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "inactive";
  }
}

export async function POST(req: Request): Promise<Response> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature header", { status: 400 });

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  const sql = db();

  async function resolveTier(subscription: Stripe.Subscription): Promise<string> {
    const price = subscription.items.data[0]?.price;
    const tier = price?.metadata?.tier || (price?.id ? (await stripe.prices.retrieve(price.id)).metadata?.tier : undefined);
    return tier === "pro" || tier === "edu" ? tier : "pro";
  }

  async function profileIdFor(customerId: string, metaUserId?: string | null): Promise<string | null> {
    if (metaUserId) {
      const byId = await sql`SELECT id FROM rt_profiles WHERE id = ${metaUserId}`;
      if (byId[0]) return byId[0].id;
    }
    const byCustomer = await sql`SELECT id FROM rt_profiles WHERE stripe_customer_id = ${customerId}`;
    return byCustomer[0]?.id ?? null;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerId = session.customer as string;
        const userId = await profileIdFor(
          customerId,
          subscription.metadata?.clerk_user_id || session.metadata?.clerk_user_id || session.client_reference_id
        );
        if (!userId) {
          console.error("No profile for customer:", customerId);
          break;
        }
        const tier = await resolveTier(subscription);
        await sql`
          UPDATE rt_profiles SET subscription_tier = ${tier}, subscription_status = ${mapStatus(subscription.status)},
            stripe_customer_id = ${customerId}, stripe_subscription_id = ${subscription.id}, updated_at = NOW()
          WHERE id = ${userId}`;
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await profileIdFor(subscription.customer as string, subscription.metadata?.clerk_user_id);
        if (!userId) break;
        const tier = await resolveTier(subscription);
        await sql`
          UPDATE rt_profiles SET subscription_tier = ${tier}, subscription_status = ${mapStatus(subscription.status)},
            stripe_subscription_id = ${subscription.id}, updated_at = NOW()
          WHERE id = ${userId}`;
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await profileIdFor(subscription.customer as string, subscription.metadata?.clerk_user_id);
        if (!userId) break;
        await sql`
          UPDATE rt_profiles SET subscription_tier = 'free', subscription_status = 'canceled',
            stripe_subscription_id = NULL, updated_at = NOW()
          WHERE id = ${userId}`;
        break;
      }
      default:
        break;
    }
    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
