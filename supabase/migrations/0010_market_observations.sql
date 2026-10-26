-- ============================================================
-- 0010: market_observations — dated competitor / reference prices per SKU from any
-- source (Amazon, The Tarps Wholesaler, Tractor Supply...). Admin-only reference data
-- used when quoting; never shown to customers. Idempotent.
-- ============================================================
CREATE TABLE IF NOT EXISTS market_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,                 -- our products.xpose_sku
  source TEXT NOT NULL,              -- 'Amazon (Xpose Safety)', 'The Tarps Wholesaler', ...
  kind TEXT NOT NULL DEFAULT 'single' CHECK (kind IN ('single','case','half_pallet','full_pallet','pack')),
  units INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  per_unit_cents INTEGER GENERATED ALWAYS AS (price_cents / units) STORED,
  url TEXT,
  note TEXT,
  checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sku, source, kind, units, checked_at)
);
CREATE INDEX IF NOT EXISTS idx_market_obs_sku ON market_observations(sku, checked_at DESC);
ALTER TABLE market_observations ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (admin pages) can read or write.
REVOKE ALL ON market_observations FROM anon, authenticated;
