// @vitest-environment node
// Unit tests for the internal signup/lead alert helper.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifySignup } from "../api/_lib/notify.js";

describe("notifySignup", () => {
  const envCopy = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.POSTMARK_API_KEY;
    delete process.env.SIGNUP_ALERT_TO;
  });
  afterEach(() => {
    process.env = envCopy;
  });

  it("no-ops without a Postmark token", async () => {
    const f = vi.spyOn(globalThis, "fetch");
    await notifySignup({ kind: "signup", email: "a@b.com" });
    expect(f).not.toHaveBeenCalled();
  });

  it("sends subject and default recipient", async () => {
    process.env.POSTMARK_API_KEY = "tok";
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await notifySignup({ kind: "lead", email: "a@b.com", name: "A", details: { company: "Acme" } });
    const body = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(body.Subject).toBe("[RoundTAIble] New lead: a@b.com");
    expect(body.To).toBe("patrick@boxfordpartners.com");
    expect(body.TextBody).toContain("company: Acme");
  });

  it("respects SIGNUP_ALERT_TO", async () => {
    process.env.POSTMARK_API_KEY = "tok";
    process.env.SIGNUP_ALERT_TO = "ops@example.com";
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await notifySignup({ kind: "signup", email: "a@b.com" });
    const body = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(body.To).toBe("ops@example.com");
  });

  it("never throws on fetch failure", async () => {
    process.env.POSTMARK_API_KEY = "tok";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));
    await expect(notifySignup({ kind: "signup", email: "a@b.com" })).resolves.toBeUndefined();
  });
});
