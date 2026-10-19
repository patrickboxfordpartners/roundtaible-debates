// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const h = vi.hoisted(() => ({
  sql: null as unknown,
  customerCreate: vi.fn(),
  checkoutCreate: vi.fn(),
  subscriptionRetrieve: vi.fn(),
  priceRetrieve: vi.fn(),
  productCreate: vi.fn(),
  priceCreate: vi.fn(),
}));
const pg = new PGlite();
h.sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = strings.reduce((text, part, i) => text + (i ? `$${i}` : "") + part, "");
  return (await pg.query(query, values)).rows;
};
vi.mock("../api/_lib/db.ts", () => ({ db: () => h.sql }));
vi.mock("../api/_lib/auth.ts", () => ({
  requireUserId: async () => "user_billing",
  getClerkUser: vi.fn(),
}));
vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return {
      customers: { create: h.customerCreate },
      checkout: { sessions: { create: h.checkoutCreate } },
      subscriptions: { retrieve: h.subscriptionRetrieve },
      prices: { retrieve: h.priceRetrieve, create: h.priceCreate },
      products: { create: h.productCreate },
      webhooks: { constructEventAsync: async (body: string) => JSON.parse(body) },
    };
  }),
}));

import { POST as billing } from "../api/billing.ts";
import { POST as webhook } from "../api/stripe-webhook.ts";
import { POST as tts } from "../api/tts.ts";

let requestNumber = 0;
function request(path: string, body: unknown) {
  return new Request(`https://example.test/api/${path}`, {
    method: "POST", body: JSON.stringify(body),
    headers: { "stripe-signature": "synthetic", "x-forwarded-for": `synthetic-${++requestNumber}` },
  });
}
function subscription(tier: string | null = "pro", priceId = "price_pro") {
  return {
    id: "sub_test", customer: "cus_test", status: "active", metadata: { clerk_user_id: "user_billing" },
    items: { data: [{ price: { id: priceId, metadata: tier === null ? {} : { tier } } }] },
  };
}
function event(type: string, created: number, sub = subscription(), id = `evt_${type}_${created}`) {
  const object = type === "checkout.session.completed"
    ? { mode: "subscription", subscription: sub.id, customer: sub.customer, client_reference_id: "user_billing" }
    : sub;
  return { id, type, created, data: { object } };
}
async function profile() {
  return (await pg.query("SELECT * FROM rt_profiles WHERE id = 'user_billing'")).rows[0];
}

beforeAll(async () => {
  await pg.exec(readFileSync(new URL("../db/migrations/001_init.sql", import.meta.url), "utf8"));
  const migration = readFileSync(new URL("../db/migrations/002_api_guards.sql", import.meta.url), "utf8");
  await pg.exec(migration);
  await pg.exec(migration); // Existing databases and repeated migration runs.
});
afterAll(async () => { await pg.close(); });
beforeEach(async () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "synthetic-stripe-key");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "synthetic-webhook-secret");
  vi.stubEnv("ELEVENLABS_API_KEY", "synthetic-elevenlabs-key");
  for (const name of ["PRO_MONTHLY", "PRO_YEARLY", "EDU_MONTHLY", "EDU_YEARLY"]) {
    vi.stubEnv(`VITE_STRIPE_PRICE_${name}`, "");
  }
  h.customerCreate.mockReset().mockResolvedValue({ id: "cus_test" });
  h.checkoutCreate.mockReset().mockResolvedValue({ url: "https://checkout.example.test/session" });
  h.subscriptionRetrieve.mockReset().mockResolvedValue(subscription());
  h.priceRetrieve.mockReset().mockResolvedValue({ metadata: {} });
  await pg.exec("TRUNCATE rt_profiles CASCADE; TRUNCATE rt_api_quotas;");
  await pg.query("INSERT INTO rt_profiles (id, email) VALUES ('user_billing', 'billing@example.test')");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("billing", () => {
  it("rejects an empty allowlist before calling Stripe", async () => {
    const response = await billing(request("billing", { action: "checkout", priceId: "price_pro" }));
    expect(response.status).toBe(503);
    expect(h.customerCreate).not.toHaveBeenCalled();
    expect(h.checkoutCreate).not.toHaveBeenCalled();
  });
  it.each(["price_unknown", "", null])("rejects unknown plan %s", async (priceId) => {
    vi.stubEnv("VITE_STRIPE_PRICE_PRO_MONTHLY", "price_pro");
    const response = await billing(request("billing", { action: "checkout", priceId }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Unknown plan");
    expect(h.customerCreate).not.toHaveBeenCalled();
    expect(h.checkoutCreate).not.toHaveBeenCalled();
  });
  it("uses the same customer idempotency key for overlapping checkouts", async () => {
    vi.stubEnv("VITE_STRIPE_PRICE_PRO_MONTHLY", "price_pro");
    let release!: () => void;
    const bothCreating = new Promise<void>(resolve => { release = resolve; });
    h.customerCreate.mockImplementation(async () => {
      if (h.customerCreate.mock.calls.length === 2) release();
      await bothCreating;
      return { id: "cus_test" };
    });
    const responses = await Promise.all([1, 2].map(() => billing(request("billing", { action: "checkout", priceId: "price_pro" }))));
    expect(responses.map(res => res.status)).toEqual([200, 200]);
    expect(h.customerCreate).toHaveBeenCalledTimes(2);
    for (const [, options] of h.customerCreate.mock.calls) expect(options).toEqual({ idempotencyKey: "customer:user_billing" });
    expect((await profile()).stripe_customer_id).toBe("cus_test");
    for (const [params] of h.checkoutCreate.mock.calls) expect(params.customer).toBe("cus_test");
  });
});

describe("webhook tier resolution and ordering", () => {
  it.each(["edu", "pro"])("preserves recognized %s metadata", async tier => {
    const response = await webhook(request("stripe-webhook", event("customer.subscription.updated", 100, subscription(tier))));
    expect(response.status).toBe(200);
    expect((await profile()).subscription_tier).toBe(tier);
  });
  it("resolves an edu price without metadata from its configured id", async () => {
    vi.stubEnv("VITE_STRIPE_PRICE_EDU_YEARLY", "price_edu");
    const response = await webhook(request("stripe-webhook", event("customer.subscription.updated", 100, subscription(null, "price_edu"))));
    expect(response.status).toBe(200);
    expect((await profile()).subscription_tier).toBe("edu");
  });
  it.each([null, "unrecognized"])("rejects unknown tier %s without granting pro", async tier => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await webhook(request("stripe-webhook", event("customer.subscription.updated", 100, subscription(tier))));
    expect(response.status).toBe(500);
    expect((await profile()).subscription_tier).toBe("free");
    expect(Number((await profile()).stripe_event_created)).toBe(0);
  });
  it("rejects subscriptions with no price", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sub = subscription();
    sub.items.data = [];
    expect((await webhook(request("stripe-webhook", event("customer.subscription.updated", 100, sub)))).status).toBe(500);
    expect((await profile()).subscription_tier).toBe("free");
  });
  it.each(["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted"])(
    "ignores older and duplicate %s events", async type => {
      const newer = event("customer.subscription.updated", 200, subscription("edu"));
      expect((await webhook(request("stripe-webhook", newer))).status).toBe(200);
      const original = await profile();
      expect((await webhook(request("stripe-webhook", event(type, 100)))).status).toBe(200);
      expect(await profile()).toEqual(original);
      expect((await webhook(request("stripe-webhook", newer))).status).toBe(200);
      expect(await profile()).toEqual(original);
    }
  );
  it("keeps a newer deletion when older checkout and update events arrive", async () => {
    await webhook(request("stripe-webhook", event("checkout.session.completed", 100)));
    await webhook(request("stripe-webhook", event("customer.subscription.deleted", 300)));
    await webhook(request("stripe-webhook", event("checkout.session.completed", 200)));
    await webhook(request("stripe-webhook", event("customer.subscription.updated", 250)));
    expect(await profile()).toMatchObject({ subscription_tier: "free", subscription_status: "canceled", stripe_subscription_id: null });
  });
});

describe("guest TTS", () => {
  it("enforces a shared quota despite rotating forwarded IPs and resets the window", async () => {
    const fetchMock = vi.fn(async () => new Response("synthetic audio"));
    vi.stubGlobal("fetch", fetchMock);
    // Keep NOW() fixed so this check cannot cross a minute boundary.
    await pg.exec("BEGIN");
    try {
      for (let i = 0; i < 60; i++) expect((await tts(request("tts", { text: "Hello" }))).status).toBe(200);
      expect((await tts(request("tts", { text: "Hello" }))).status).toBe(429);
      expect(fetchMock).toHaveBeenCalledTimes(60);
      await pg.exec("UPDATE rt_api_quotas SET window_start = window_start - INTERVAL '1 minute'");
      expect((await tts(request("tts", { text: "Hello" }))).status).toBe(200);
      expect((await pg.query("SELECT requests FROM rt_api_quotas")).rows[0]).toEqual({ requests: 1 });
    } finally { await pg.exec("ROLLBACK"); }
  });
  it("retains the per-IP rate limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("synthetic audio")));
    for (let i = 0; i < 60; i++) {
      const req = request("tts", {});
      req.headers.set("x-forwarded-for", "same-synthetic-ip");
      expect((await tts(req)).status).toBe(400);
    }
    const req = request("tts", { text: "Hello" });
    req.headers.set("x-forwarded-for", "same-synthetic-ip");
    expect((await tts(req)).status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("supplies the 15-second timeout signal to ElevenLabs", async () => {
    const signal = new AbortController().signal;
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("synthetic audio")));
    const response = await tts(request("tts", { text: "Hello", personaId: "edison" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(timeout).toHaveBeenCalledWith(15_000);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("api.elevenlabs.io"), expect.objectContaining({ signal }));
  });
});

it("outputs all four frontend Stripe price variable names", async () => {
  h.productCreate.mockResolvedValue({ id: "prod_synthetic" });
  h.priceCreate.mockResolvedValue({ id: "price_synthetic" });
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await import("../scripts/stripe-setup.ts");
  await vi.waitFor(() => expect(log).toHaveBeenCalledWith("VITE_STRIPE_PRICE_EDU_YEARLY=price_synthetic"));
  for (const plan of ["PRO_MONTHLY", "PRO_YEARLY", "EDU_MONTHLY", "EDU_YEARLY"]) {
    expect(log).toHaveBeenCalledWith(`VITE_STRIPE_PRICE_${plan}=price_synthetic`);
  }
});
