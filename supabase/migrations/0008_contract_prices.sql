-- ============================================================
-- 0008 — Client contract prices (Team F)
-- Farshid prices a quote for a client; the agreed unit prices are saved here as
-- that client's contract prices and apply to their future online orders
-- (price = LOWER of contract price and normal tier price, approved accounts only).
--
-- Security model
--   • service_role (admin pages / server actions): full access, bypasses RLS.
--   • authenticated contractor: SELECT only their own rows (contractor_id = auth.uid())
--     and only the columns the storefront needs. `note` and `created_by` are internal.
--   • No INSERT / UPDATE / DELETE for anon or authenticated: no policies + no grants.
--   • anon: nothing.
-- Idempotent: safe to run more than once. Runs before 0099 (which stays last).
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  valid_until DATE,
  source_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columns added defensively in case an older draft of the table exists
ALTER TABLE contract_prices ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE contract_prices ADD COLUMN IF NOT EXISTS source_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE contract_prices ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE contract_prices ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Constraints (drop + add so re-runs stay clean)
ALTER TABLE contract_prices DROP CONSTRAINT IF EXISTS contract_prices_unit_price_positive;
ALTER TABLE contract_prices ADD CONSTRAINT contract_prices_unit_price_positive CHECK (unit_price_cents > 0);

ALTER TABLE contract_prices DROP CONSTRAINT IF EXISTS contract_prices_min_quantity_positive;
ALTER TABLE contract_prices ADD CONSTRAINT contract_prices_min_quantity_positive CHECK (min_quantity >= 1);

ALTER TABLE contract_prices DROP CONSTRAINT IF EXISTS contract_prices_contractor_product_min_key;
ALTER TABLE contract_prices ADD CONSTRAINT contract_prices_contractor_product_min_key
  UNIQUE (contractor_id, product_id, min_quantity);

CREATE INDEX IF NOT EXISTS idx_contract_prices_contractor ON contract_prices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contract_prices_product ON contract_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_contract_prices_source_quote ON contract_prices(source_quote_id);

-- updated_at maintenance (update_updated_at() comes from schema.sql)
DROP TRIGGER IF EXISTS update_contract_prices_updated_at ON contract_prices;
CREATE TRIGGER update_contract_prices_updated_at
  BEFORE UPDATE ON contract_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- RLS: contractors read their own rows only. No write policies at all.
-- ------------------------------------------------------------
ALTER TABLE contract_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors read own contract prices" ON contract_prices;
CREATE POLICY "Contractors read own contract prices" ON contract_prices
  FOR SELECT TO authenticated
  USING (contractor_id = auth.uid());

-- ------------------------------------------------------------
-- Column privileges. Supabase grants ALL on new public tables to anon/authenticated
-- by default; take that back and grant SELECT on the storefront columns only.
-- (New columns stay private until added here.)
-- ------------------------------------------------------------
REVOKE ALL ON contract_prices FROM anon, authenticated;
GRANT SELECT (id, contractor_id, product_id, sku, unit_price_cents, min_quantity, valid_until,
              source_quote_id, created_at, updated_at)
  ON contract_prices TO authenticated;
GRANT ALL ON contract_prices TO service_role;
