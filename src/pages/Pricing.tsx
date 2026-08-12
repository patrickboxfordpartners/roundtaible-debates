import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Minus, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useBilling } from "@/hooks/useBilling";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";

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
    a: "Annual plans are billed up front. We send a reminder 14 days before renewal.",
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
    <div className="border-b border-border/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-playfair font-semibold text-foreground">{q}</span>
        <ChevronDown
          className={["h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
        />
      </button>
      {open && (
        <p className="font-lora pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
      )}
    </div>
  );
}

export default function Pricing() {
  usePageMeta({
    title: "Pricing - Roundtaible",
    description: "Simple pricing for AI-powered debate. Pro at $9.99/mo for individuals, Edu/Team at $29.99/mo for classrooms and organizations. Cancel anytime.",
  });

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
    <div className="min-h-dvh bg-background text-foreground">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-secondary/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate("/")}>
            <Logo size="md" className="text-secondary-foreground" />
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

      {/* ─── HERO (dark) ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-secondary pt-32 pb-0 text-center text-secondary-foreground">
        {/* Rotating table motif */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.svg
            viewBox="0 0 400 400"
            className="w-[700px] h-[700px] opacity-[0.06]"
            animate={{ rotate: 360 }}
            transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * 2 * Math.PI - Math.PI / 2;
              return <circle key={i} cx={200 + 180 * Math.cos(a)} cy={200 + 180 * Math.sin(a)} r="10" fill="currentColor" />;
            })}
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * 2 * Math.PI - Math.PI / 2;
              return <line key={i} x1={200 + 95 * Math.cos(a)} y1={200 + 95 * Math.sin(a)} x2={200 + 165 * Math.cos(a)} y2={200 + 165 * Math.sin(a)} stroke="currentColor" strokeWidth="0.75" />;
            })}
          </motion.svg>
        </div>

        {/* Amber glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="relative px-6 pb-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h1 className="font-playfair mb-4 text-3xl sm:text-4xl font-bold leading-tight md:text-6xl text-secondary-foreground">
            Pick Your Plan
          </h1>
          <p className="font-lora mx-auto mb-10 max-w-xl text-secondary-foreground/60">
            Unlock custom personas, private rooms, and the full Roundtaible experience. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-sm backdrop-blur-sm">
            <button
              onClick={() => setCycle("monthly")}
              className={[
                "rounded-full px-4 py-1 font-semibold transition-colors",
                cycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-secondary-foreground/60 hover:text-secondary-foreground",
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
                  : "text-secondary-foreground/60 hover:text-secondary-foreground",
              ].join(" ")}
            >
              Annual
            </button>
            {cycle === "annual" && (
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Save up to 31%
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="relative px-4 sm:px-6 pb-16">
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            {plans.map((plan) => {
              const price = cycle === "annual" ? plan.annualMonthly : plan.monthly;
              const isCurrentPlan = profile?.subscription_tier === plan.id;
              return (
                <div
                  key={plan.id}
                  className={[
                    "relative flex flex-col rounded-2xl p-5 sm:p-8 transition-shadow",
                    plan.featured
                      ? "bg-wood-dark border border-amber-glow/30 shadow-2xl shadow-black/40 text-secondary-foreground"
                      : "bg-card border border-border shadow-lg hover:border-primary/40",
                  ].join(" ")}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {cycle === "annual" && (
                    <div className="absolute top-4 right-4">
                      <span className={[
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        plan.featured ? "bg-primary/25 text-primary" : "bg-primary/15 text-primary",
                      ].join(" ")}>
                        Save {plan.annualSavings}%
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={["font-playfair text-xl font-bold", plan.featured ? "text-secondary-foreground" : "text-foreground"].join(" ")}>
                      {plan.name}
                    </h3>
                    <p className={["font-lora mt-1 text-sm", plan.featured ? "text-secondary-foreground/60" : "text-muted-foreground"].join(" ")}>
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-end gap-1">
                      <span className={["font-playfair text-5xl font-bold", plan.featured ? "text-secondary-foreground" : "text-foreground"].join(" ")}>
                        ${price.toFixed(2)}
                      </span>
                      <span className={["font-lora mb-1.5 text-sm", plan.featured ? "text-secondary-foreground/50" : "text-muted-foreground"].join(" ")}>/mo</span>
                    </div>
                    <p className={["font-lora mt-1 text-xs", plan.featured ? "text-secondary-foreground/50" : "text-muted-foreground"].join(" ")}>
                      {cycle === "annual" ? `Billed $${plan.annualTotal}/yr` : "Billed monthly"}
                    </p>
                  </div>

                  <ul className="mb-8 flex flex-col gap-3 flex-grow">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className={[
                          "inline-flex h-4 w-4 mt-0.5 shrink-0 items-center justify-center rounded-full",
                          plan.featured ? "bg-primary/25" : "bg-primary/15",
                        ].join(" ")}>
                          <Check size={10} className="text-primary" />
                        </span>
                        <span className={["font-lora text-sm", plan.featured ? "text-secondary-foreground/80" : "text-foreground"].join(" ")}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={loading || isCurrentPlan}
                    className={[
                      "w-full rounded-xl px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-50",
                      isCurrentPlan
                        ? "cursor-default bg-primary/10 text-primary"
                        : plan.featured
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    ].join(" ")}
                  >
                    {isCurrentPlan ? "Current plan" : loading ? "Redirecting..." : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground py-8">
        Prices in USD. Taxes calculated at checkout. Free tier: 3 debates, no card required.
      </p>

      {/* ─── COMPARISON TABLE ────────────────────────────────────── */}
      <section id="compare" className="border-t border-border bg-card/30 px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
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
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary text-secondary-foreground">
                    <th className="px-6 py-4 text-left text-sm font-medium text-secondary-foreground/50 w-1/2">
                      Features
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p.id}
                        className={[
                          "px-6 py-4 text-left text-sm font-bold w-1/4",
                          p.featured ? "text-primary" : "text-secondary-foreground",
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
                          colSpan={3}
                          className="border-t border-border bg-muted/40 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {group.name}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-lora text-sm text-foreground/70">{row.label}</td>
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

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
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
          <div className="rounded-2xl border border-border bg-card px-4 sm:px-8">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/faq" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              See all frequently asked questions &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA (dark) ───────────────────────────────────── */}
      <section className="bg-secondary px-4 sm:px-6 py-16 sm:py-24 text-center text-secondary-foreground">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-playfair text-3xl font-bold md:text-4xl">
            Ready to enter the debate?
          </h2>
          <p className="font-lora mx-auto mt-3 max-w-xl text-secondary-foreground/60">
            Start with Pro for $9.99/mo. Upgrade to Edu / Team for classrooms and organizations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02]"
            >
              Get started
            </button>
            <a
              href="mailto:hello@theroundtaible.com?subject=Edu%20/%20Team%20Inquiry"
              className="rounded-lg border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-white/10"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>

      <StickyMobileCTA />
      <Footer />
    </div>
  );
}
