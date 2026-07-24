import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  posthog.init(import.meta.env.VITE_POSTHOG_KEY ?? "", {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export { posthog };
