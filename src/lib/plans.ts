export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanTier {
  id: "pro" | "edu";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlySavingsPercent: number;
  features: PlanFeature[];
  priceIds: {
    monthly: string;
    yearly: string;
  };
}

export const plans: PlanTier[] = [
  {
    id: "pro",
    name: "Pro",
    description: "Unlock the full Roundtaible experience",
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    monthlySavingsPercent: 17,
    features: [
      { text: "25 debates per month", included: true },
      { text: "Custom personas", included: true },
      { text: "Private rooms", included: true },
      { text: "Debate history", included: true },
      { text: "Transcript export", included: true },
      { text: "Priority support", included: true },
    ],
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY ?? "",
      yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY ?? "",
    },
  },
  {
    id: "edu",
    name: "Edu / Team",
    description: "Built for classrooms and organizations",
    monthlyPrice: 29.99,
    yearlyPrice: 249,
    monthlySavingsPercent: 31,
    features: [
      { text: "100 debates per month", included: true },
      { text: "Classroom management", included: true },
      { text: "Student analytics dashboard", included: true },
      { text: "Custom & bulk persona library", included: true },
      { text: "Transcript export & API access", included: true },
      { text: "Dedicated support", included: true },
    ],
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_EDU_MONTHLY ?? "",
      yearly: import.meta.env.VITE_STRIPE_PRICE_EDU_YEARLY ?? "",
    },
  },
];

export function getPlanById(id: string): PlanTier | undefined {
  return plans.find((p) => p.id === id);
}

export function formatPrice(amount: number): string {
  if (amount === 0) return "Free";
  return `$${amount.toFixed(2)}`;
}
