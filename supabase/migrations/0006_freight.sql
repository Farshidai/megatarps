-- 0006_freight.sql — weight-based freight (Team B). Idempotent.
--   * products.shipping_weight_lb : optional manual override of the computed ship weight
--   * freight_rates               : parcel / LTL brackets (base + per-lb)
--   * freight_settings            : single-row settings
-- Public can READ active rates + settings (needed for cart display);
-- writes only via the service role (admin server actions use SUPABASE_SERVICE_ROLE_KEY).

ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_weight_lb NUMERIC
  CHECK (shipping_weight_lb IS NULL OR shipping_weight_lb > 0);

CREATE TABLE IF NOT EXISTS freight_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT NOT NULL CHECK (method IN ('parcel', 'ltl')),
  min_lb NUMERIC NOT NULL DEFAULT 0 CHECK (min_lb >= 0),
  max_lb NUMERIC CHECK (max_lb IS NULL OR max_lb > min_lb),
  base_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_cents >= 0),
  per_lb_cents INTEGER NOT NULL DEFAULT 0 CHECK (per_lb_cents >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_freight_rates_method ON freight_rates(method, min_lb);

CREATE TABLE IF NOT EXISTS freight_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),           -- single row
  parcel_max_order_lb NUMERIC NOT NULL DEFAULT 150 CHECK (parcel_max_order_lb > 0),
  free_freight_threshold_cents INTEGER DEFAULT NULL           -- NULL = no free freight
    CHECK (free_freight_threshold_cents IS NULL OR free_freight_threshold_cents > 0),
  ltl_checkout_enabled BOOLEAN NOT NULL DEFAULT false,
  handling_cents INTEGER NOT NULL DEFAULT 0 CHECK (handling_cents >= 0),
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO freight_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active freight rates" ON freight_rates;
CREATE POLICY "Public can read active freight rates" ON freight_rates
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Public can read freight settings" ON freight_settings;
CREATE POLICY "Public can read freight settings" ON freight_settings
  FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies: only the service role (which bypasses RLS) can write.

-- PLACEHOLDER: Farshid must set real carrier rates
-- Seeded only when the table is empty, so re-running never overwrites edited rates.
INSERT INTO freight_rates (method, min_lb, max_lb, base_cents, per_lb_cents, active, sort)
SELECT * FROM (VALUES
  ('parcel', 0::numeric,    20::numeric,   1200, 40, true, 10),   -- PLACEHOLDER $12 + $0.40/lb
  ('parcel', 20::numeric,   70::numeric,   1500, 45, true, 20),   -- PLACEHOLDER $15 + $0.45/lb
  ('parcel', 70::numeric,   150::numeric,  2500, 50, true, 30),   -- PLACEHOLDER $25 + $0.50/lb
  ('ltl',    150::numeric,  1000::numeric, 17500, 20, true, 40),  -- PLACEHOLDER LTL (checkout disabled by default)
  ('ltl',    1000::numeric, NULL::numeric, 25000, 15, true, 50)   -- PLACEHOLDER LTL (checkout disabled by default)
) AS v(method, min_lb, max_lb, base_cents, per_lb_cents, active, sort)
WHERE NOT EXISTS (SELECT 1 FROM freight_rates);
