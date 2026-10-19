-- Run after 001_init.sql, including on existing databases. Safe to re-run.
ALTER TABLE rt_profiles ADD COLUMN IF NOT EXISTS stripe_event_created BIGINT NOT NULL DEFAULT 0;

-- Shared TTS budget, independent of visitor-controlled headers and function instances.
CREATE TABLE IF NOT EXISTS rt_api_quotas (
  name         TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  requests     INTEGER NOT NULL
);
