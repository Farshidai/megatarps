-- ============================================================
-- 0004 — Quote / RFQ lifecycle (Team D)
-- request → admin prices it → customer gets a link → accepts → pays → order
-- Idempotent: safe to run more than once.
-- ============================================================

-- ---------- quotes: new columns ----------
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS public_token TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS freight_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_message TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS declined_reason TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
-- the original /api/rfq route already inserted shipping_address, but schema.sql never had it
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS delivery_type TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS delivery_zip TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS needed_by DATE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- admin_notes is PRIVATE. The existing "Contractors read own quotes" RLS policy lets a
-- customer SELECT every column of their own quote rows, so private notes cannot live on
-- `quotes` without leaking. They live in quote_admin_notes (service-role only) instead.
CREATE TABLE IF NOT EXISTS quote_admin_notes (
  quote_id UUID PRIMARY KEY REFERENCES quotes(id) ON DELETE CASCADE,
  admin_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quote_admin_notes ENABLE ROW LEVEL SECURITY;
-- no policies on purpose: only the service role (server routes) can read/write

-- Unguessable token for the emailed quote link (~244 bits from two v4 UUIDs).
ALTER TABLE quotes
  ALTER COLUMN public_token SET DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
UPDATE quotes
  SET public_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  WHERE public_token IS NULL;
ALTER TABLE quotes ALTER COLUMN public_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_public_token ON quotes(public_token);

-- Status: add 'declined'
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('pending','quoted','accepted','ordered','shipped','delivered','expired','declined'));

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_delivery_type_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_delivery_type_check
  CHECK (delivery_type IS NULL OR delivery_type IN ('dock','liftgate','residential'));

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_money_nonnegative_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_money_nonnegative_check
  CHECK (freight_cents >= 0 AND tax_cents >= 0 AND discount_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until) WHERE status = 'quoted';

-- ---------- quote_events ----------
CREATE TABLE IF NOT EXISTS quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('created','sent','viewed','accepted','declined','paid')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote ON quote_events(quote_id, created_at);

ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own quote events" ON quote_events;
CREATE POLICY "Customers read own quote events" ON quote_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_events.quote_id AND q.contractor_id = auth.uid())
  );
-- Writes (and token-based reads) go through server routes using the service role.

-- ---------- quotes RLS ----------
-- Customers see only their own quotes (policy from schema.sql, re-stated idempotently).
DROP POLICY IF EXISTS "Contractors read own quotes" ON quotes;
CREATE POLICY "Contractors read own quotes" ON quotes
  FOR SELECT USING (contractor_id = auth.uid());

-- schema.sql allowed ANYONE to insert quotes with the anon key — including status,
-- prices and public_token — which would let someone mint a $1 "quoted" quote and pay it.
-- All quote creation now goes through /api/rfq (service role), so drop that policy.
DROP POLICY IF EXISTS "Anyone can insert quotes" ON quotes;
