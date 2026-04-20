import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { plans, type PlanTier } from "@/lib/plans";
import { useBilling } from "@/hooks/useBilling";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

const paidPlans = plans;

function PlanCard({
  plan,
  annual,
  onSelect,
  loading,
  isCurrentPlan,
  highlighted,
}: {
  plan: PlanTier;
  annual: boolean;
  onSelect: () => void;
  loading: boolean;
  isCurrentPlan: boolean;
  highlighted: boolean;
}) {
  const price = annual ? plan.yearlyPrice / 12 : plan.monthlyPrice;
  const billedAs = annual
    ? `Billed $${plan.yearlyPrice}/yr`
    : "Billed monthly";

  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border bg-card p-8 transition-shadow",
        highlighted
          ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30"
          : "border-border hover:border-primary/40",
      ].join(" ")}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}

      {annual && plan.monthlySavingsPercent > 0 && (
        <div className="absolute top-4 right-4">
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Save {plan.monthlySavingsPercent}%
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-playfair text-xl font-bold text-foreground">
          {plan.name}
        </h3>
        <p className="font-lora mt-1 text-sm text-muted-foreground">
          {plan.description}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="font-playfair text-4xl font-bold text-foreground">
            ${price.toFixed(2)}
          </span>
          <span className="font-lora mb-1 text-sm text-muted-foreground">/mo</span>
        </div>
        <p className="font-lora mt-1 text-xs text-muted-foreground">{billedAs}</p>
      </div>

      <ul className="mb-8 flex flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            <Check
              size={15}
              className={[
                "mt-0.5 shrink-0",
                f.included ? "text-primary" : "text-muted-foreground/30",
              ].join(" ")}
            />
            <span
              className={[
                "font-lora text-sm",
                f.included ? "text-foreground" : "text-muted-foreground/40 line-through",
              ].join(" ")}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <button
          onClick={onSelect}
          disabled={loading || isCurrentPlan}
          className={[
            "w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all",
            isCurrentPlan
              ? "cursor-default bg-primary/10 text-primary"
              : highlighted
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
              : "border-2 border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/10 disabled:opacity-50",
          ].join(" ")}
        >
          {isCurrentPlan
            ? "Current plan"
            : loading
            ? "Redirecting..."
            : `Get ${plan.name}`}
        </button>
      </div>
    </div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { startCheckout, loading } = useBilling();

  function handleSelect(plan: PlanTier) {
    if (!isAuthenticated) {
      navigate("/auth?next=/pricing");
      return;
    }
    const priceId = annual ? plan.priceIds.yearly : plan.priceIds.monthly;
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
              onClick={() => navigate("/pricing")}
              className="hidden text-sm font-semibold text-primary sm:block"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/app")}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Enter the Debate
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 pb-16 pt-32 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
          Pricing
        </p>
        <h1 className="font-playfair mb-4 text-4xl font-bold leading-tight md:text-5xl">
          Pick Your Plan
        </h1>
        <p className="font-lora mx-auto mb-10 max-w-xl text-muted-foreground">
          Unlock custom personas, private rooms, and the full Roundtaible experience.
        </p>

        {/* Annual / monthly toggle */}
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-2 py-1.5 text-sm">
          <button
            onClick={() => setAnnual(false)}
            className={[
              "rounded-full px-4 py-1 font-semibold transition-colors",
              !annual
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={[
              "rounded-full px-4 py-1 font-semibold transition-colors",
              annual
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Annual
          </button>
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {paidPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              highlighted={plan.id === "pro"}
              isCurrentPlan={profile?.subscription_tier === plan.id}
              loading={loading}
              onSelect={() => handleSelect(plan)}
            />
          ))}
        </div>
      </section>

      {/* FAQ strip */}
      <section className="border-t border-border bg-card/30 px-6 py-16 text-center">
        <p className="font-lora text-sm text-muted-foreground">
          Questions?{" "}
          <a
            href="mailto:hello@boxfordpartners.com"
            className="text-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
          >
            hello@boxfordpartners.com
          </a>
        </p>
      </section>

      <Footer />
    </div>
  );
}
