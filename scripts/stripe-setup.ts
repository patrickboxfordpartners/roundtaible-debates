/**
 * Stripe Setup Script
 * Creates products and prices for Roundtaible Debates.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *
 * Outputs the env vars you need to add to .env and Supabase secrets.
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY env var before running this script.");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" });

async function main() {
  // --- Pro plan ---
  const proProd = await stripe.products.create({
    name: "Roundtaible Pro",
    description:
      "Custom personas, private rooms, unlimited history, transcript export, priority support.",
    metadata: { tier: "pro" },
  });

  const proMonthly = await stripe.prices.create({
    product: proProd.id,
    unit_amount: 999,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "pro", cadence: "monthly" },
  });

  const proYearly = await stripe.prices.create({
    product: proProd.id,
    unit_amount: 9900,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { tier: "pro", cadence: "yearly" },
  });

  // --- Edu/Team plan ---
  const eduProd = await stripe.products.create({
    name: "Roundtaible Edu/Team",
    description:
      "Everything in Pro plus classroom management, student analytics, bulk persona library, API access.",
    metadata: { tier: "edu" },
  });

  const eduMonthly = await stripe.prices.create({
    product: eduProd.id,
    unit_amount: 2999,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "edu", cadence: "monthly" },
  });

  const eduYearly = await stripe.prices.create({
    product: eduProd.id,
    unit_amount: 24900,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { tier: "edu", cadence: "yearly" },
  });

  console.log("\n--- Add these to your .env and Supabase secrets ---\n");
  console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
  console.log(`STRIPE_PRICE_PRO_YEARLY=${proYearly.id}`);
  console.log(`STRIPE_PRICE_EDU_MONTHLY=${eduMonthly.id}`);
  console.log(`STRIPE_PRICE_EDU_YEARLY=${eduYearly.id}`);
  console.log("");
  console.log("Products created:");
  console.log(`  Pro  -> ${proProd.id}`);
  console.log(`  Edu  -> ${eduProd.id}`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
