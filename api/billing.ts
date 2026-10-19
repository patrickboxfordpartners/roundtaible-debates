// Stripe checkout and billing portal for signed-in users.
// Moved from the old Supabase "stripe-checkout" and "stripe-portal" edge functions.
// POST { action: "checkout", priceId } or { action: "portal" }.

import Stripe from "stripe";
import { db } from "./_lib/db.js";
import { getClerkUser, requireUserId } from "./_lib/auth.js";
import { HttpError, errorResponse, json, rateLimit, readJson, siteOrigin } from "./_lib/http.js";

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, "STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/** Only allow the plan prices the site actually offers. */
function allowedPrices(): string[] {
  return [
    process.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    process.env.VITE_STRIPE_PRICE_PRO_YEARLY,
    process.env.VITE_STRIPE_PRICE_EDU_MONTHLY,
    process.env.VITE_STRIPE_PRICE_EDU_YEARLY,
  ].filter((p): p is string => !!p);
}

export async function POST(req: Request): Promise<Response> {
  try {
    rateLimit(req, "billing", 20);
    const userId = await requireUserId(req);
    const body = await readJson<{ action?: string; priceId?: string }>(req, 8 * 1024);
    const origin = siteOrigin(req);
    const stripe = stripeClient();
    const sql = db();
    const profile = (await sql`SELECT stripe_customer_id, email FROM rt_profiles WHERE id = ${userId}`)[0];
    if (!profile) throw new HttpError(404, "Profile not found. Sign in again and retry.");

    if (body.action === "checkout") {
      const priceId = typeof body.priceId === "string" ? body.priceId : "";
      const allowed = allowedPrices();
      if (allowed.length === 0) throw new HttpError(503, "Stripe prices are not configured");
      if (!priceId || !allowed.includes(priceId)) throw new HttpError(400, "Unknown plan");

      let customerId: string | null = profile.stripe_customer_id;
      if (!customerId) {
        const email = profile.email || (await getClerkUser(userId)).email;
        const customer = await stripe.customers.create({ email: email || undefined, metadata: { clerk_user_id: userId } });
        customerId = customer.id;
        await sql`UPDATE rt_profiles SET stripe_customer_id = ${customerId}, updated_at = NOW() WHERE id = ${userId}`;
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/app?subscribed=true`,
        cancel_url: `${origin}/pricing`,
        client_reference_id: userId,
        metadata: { clerk_user_id: userId },
        subscription_data: { metadata: { clerk_user_id: userId } },
      });
      return json({ url: session.url });
    }

    if (body.action === "portal") {
      if (!profile.stripe_customer_id) throw new HttpError(404, "No billing account found. Subscribe to a plan first.");
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${origin}/app`,
      });
      return json({ url: portal.url });
    }

    throw new HttpError(400, "Unknown action");
  } catch (err) {
    return errorResponse(err);
  }
}
