-- Add Stripe subscription fields to rt_profiles
ALTER TABLE rt_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'edu')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS idx_rt_profiles_stripe_customer
  ON rt_profiles(stripe_customer_id);
