import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Minus, ChevronDown } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";

type BillingCycle = "monthly" | "annual";

const plans = [
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlock the full Roundtaible experience.",
    monthly: 9.99,
    annualTotal: 99,
    annualMonthly: +(99 / 12).toFixed(2),
    annualSavings: Math.round((1 - 99 / (9.99 * 12)) * 100),
    cta: "Get Pro",
    featured: true,
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY ?? "",
      annual: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY ?? "",
    },
    features: [
      "25 debates per month",
      "Custom personas",
      "Private rooms",
      "Full debate history",
      "Transcript export",
      "Priority support",
    ],
  },
  {
    id: "edu",
    name: "Edu / Team",
    tagline: "Built for classrooms and organizations.",
    monthly: 29.99,
    annualTotal: 249,
    annualMonthly: +(249 / 12).toFixed(2),
    annualSavings: Math.round((1 - 249 / (29.99 * 12)) * 100),
    cta: "Get Edu / Team",
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_EDU_MONTHLY ?? "",
      annual: import.meta.env.VITE_STRIPE_PRICE_EDU_YEARLY ?? "",
    },
    features: [
      "Everything in Pro",
      "100 debates per month",
      "Classroom management",
      "Student analytics dashboard",
      "Custom & bulk persona library",
      "Dedicated support",
      "API access",
    ],
  },
];

type Cell = boolean | string;
type ComparisonGroup = { name: string; rows: { label: string; values: [Cell, Cell] }[] };

const comparison: ComparisonGroup[] = [
  {
    name: "Core",
    rows: [
      { label: "Debates per month", values: ["25", "100"] },
      { label: "Debate rooms", values: ["Public + Private", "Public + Private"] },
      { label: "Personas", values: ["Custom", "Custom + Bulk"] },
      { label: "Debate history", values: ["Unlimited", "Unlimited"] },
    ],
  },
  {
    name: "Features",
    rows: [
      { label: "Transcript export", values: [true, true] },
      { label: "Personality quiz", values: [true, true] },
      { label: "Voice synthesis", values: [true, true] },
      { label: "API access", values: [false, true] },
    ],
  },
  {
    name: "Collaboration",
    rows: [
      { label: "Classroom management", values: [false, true] },
      { label: "Student analytics", values: [false, true] },
      { label: "Team workspaces", values: [false, true] },
      { label: "Bulk persona upload", values: [false, true] },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Community support", values: [true, true] },
      { label: "Priority support", values: [true, true] },
      { label: "Dedicated account manager", values: [false, true] },
      { label: "Custom onboarding", values: [false, true] },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, cancel anytime from your account settings. Your access continues until the end of your billing period.",
  },
  {
    q: "What happens when I use all my debates?",
    a: "You'll be notified when approaching your limit. Unused debates don't roll over, but you can upgrade mid-cycle to get more immediately.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual plans are billed up front and save you up to 20% compared to paying monthly. We send a reminder 14 days before renewal.",
  },
  {
    q: "What are custom personas?",
    a: "Pro users can create AI personas with custom names, backgrounds, expertise, and debate styles. Edu/Team users can upload personas in bulk for an entire class or organization.",
  },
  {
    q: "Is Roundtaible suitable for classrooms?",
    a: "Absolutely. The Edu/Team plan includes classroom management, student analytics, and the ability to assign debates as coursework.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards through Stripe. Edu/Team customers can also pay via invoice.",
  },
];

function CellValue({ value, featured }: { value: Cell; featured?: boolean }) {
  if (value === true)
    return (
      <span className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-full",
        featured ? "bg-primary/20" : "bg-muted",
      ].join(" ")}>
        <Check className="h-3.5 w-3.5 text-primary" />
      </span>
    );
  if (value === false)
    return <Minus className="h-4 w-4 text-muted-foreground/40" />;
  return <span className="font-lora text-sm text-foreground">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-playfair font-semibold text-foreground">{q}</span>
        <ChevronDown
          className={["h-4 w-4 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : ""].join(" ")}
        />
      </button>
      {open && (
        <p className="font-lora pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
      )}
    </div>
  );
}

export default function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { startCheckout, loading } = useBilling();

  function handleSelect(plan: typeof plans[0]) {
    if (!isAuthenticated) {
      navigate("/auth?next=/pricing");
      return;
    }
    const priceId = cycle === "annual" ? plan.priceIds.annual : plan.priceIds.monthly;
    if (!priceId) return;
    startCheckout(priceId);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button onClick={() => navigate("/")}>
            <Logo size="md" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app")}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Enter the Debate
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-32 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
          Pricing
        </p>
        <h1 className="font-playfair mb-4 text-4xl font-bold leading-tight md:text-5xl">
          Pick Your Plan
        </h1>
        <p className="font-lora mx-auto mb-10 max-w-xl text-muted-foreground">
          Unlock custom personas, private rooms, and the full Roundtaible experience. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-2 py-1.5 text-sm">
          <button
            onClick={() => setCycle("monthly")}
            className={[
              "rounded-full px-4 py-1 font-semibold transition-colors",
              cycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle("annual")}
            className={[
              "rounded-full px-4 py-1 font-semibold transition-colors",
              cycle === "annual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Annual
          </button>
          {cycle === "annual" && (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Save up to 31%
            </span>
          )}
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const price = cycle === "annual" ? plan.annualMonthly : plan.monthly;
            const isCurrentPlan = profile?.subscription_tier === plan.id;
            return (
              <div
                key={plan.id}
                className={[
                  "relative flex flex-col rounded-2xl border bg-card p-8 transition-shadow",
                  plan.featured
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40",
                ].join(" ")}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                {cycle === "annual" && (
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      Save {plan.annualSavings}%
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-playfair text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="font-lora mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="font-playfair text-4xl font-bold text-foreground">
                      ${price.toFixed(2)}
                    </span>
                    <span className="font-lora mb-1 text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="font-lora mt-1 text-xs text-muted-foreground">
                    {cycle === "annual" ? `Billed $${plan.annualTotal}/yr` : "Billed monthly"}
                  </p>
                </div>

                <ul className="mb-8 flex flex-col gap-3 flex-grow">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                      <span className="font-lora text-sm text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan)}
                  disabled={loading || isCurrentPlan}
                  className={[
                    "w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all",
                    isCurrentPlan
                      ? "cursor-default bg-primary/10 text-primary"
                      : plan.featured
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
                      : "border-2 border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/10 disabled:opacity-50",
                  ].join(" ")}
                >
                  {isCurrentPlan ? "Current plan" : loading ? "Redirecting..." : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices in USD. Taxes calculated at checkout.
        </p>
      </section>

      {/* Comparison table */}
      <section id="compare" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-playfair text-3xl font-bold text-foreground md:text-4xl">
              Compare every detail
            </h2>
            <p className="font-lora mt-3 text-muted-foreground">
              A side-by-side look at what's included on each plan.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Features
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p.id}
                        className={[
                          "px-6 py-4 text-left text-sm font-semibold",
                          p.featured ? "text-primary" : "text-foreground",
                        ].join(" ")}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((group) => (
                    <>
                      <tr key={group.name}>
                        <td
                          colSpan={4}
                          className="border-t border-border bg-muted/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {group.name}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-t border-border">
                          <td className="px-6 py-4 font-lora text-sm text-foreground/80">{row.label}</td>
                          {row.values.map((v, i) => (
                            <td
                              key={i}
                              className={["px-6 py-4", plans[i]?.featured ? "bg-primary/5" : ""].join(" ")}
                            >
                              <CellValue value={v} featured={plans[i]?.featured} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="font-playfair text-3xl font-bold text-foreground md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="font-lora mt-3 text-muted-foreground">
              Can't find what you're looking for?{" "}
              <a href="mailto:hello@theroundtaible.com" className="text-primary hover:underline">
                Get in touch
              </a>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-6">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 px-8 py-16 text-center md:px-16 md:py-20">
          <h2 className="font-playfair text-3xl font-bold text-foreground md:text-4xl">
            Ready to enter the debate?
          </h2>
          <p className="font-lora mx-auto mt-3 max-w-xl text-muted-foreground">
            Start with Pro for $9.99/mo. Upgrade to Edu / Team for classrooms and organizations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Get started
            </button>
            <a
              href="mailto:hello@theroundtaible.com?subject=Edu%20/%20Team%20Inquiry"
              className="rounded-lg border-2 border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
