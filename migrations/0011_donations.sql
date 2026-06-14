-- Campaign donations (Stripe Checkout) and webhook idempotency
-- Run with: wrangler d1 migrations apply pta-reimbursement-db

CREATE TABLE donations (
  id TEXT PRIMARY KEY,
  campaign_slug TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_checkout_id TEXT UNIQUE,
  provider_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  donor_name TEXT,
  donor_email TEXT NOT NULL,
  donor_fields TEXT,
  preset_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE payment_webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_donations_campaign ON donations(campaign_slug, status);
CREATE INDEX idx_donations_completed ON donations(completed_at DESC);
