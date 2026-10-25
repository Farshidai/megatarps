-- ============================================================
-- 0002_catalog — Team A (Catalog & Pricing UI)
-- Fits the 232-SKU Xpose supplier catalog into the existing products table
-- (accessories become products with tarp_type = 'accessory' instead of a
-- separate table), adds pack info, and makes volume tiers publicly readable.
-- Idempotent: safe to run more than once.
-- ============================================================

-- Pack / accessory info
ALTER TABLE products ADD COLUMN IF NOT EXISTS units_per_case INTEGER;   -- units in a master case/carton
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_quantity INTEGER;    -- pieces per sellable unit (e.g. 25-pack of bungees)
ALTER TABLE products ADD COLUMN IF NOT EXISTS accessory_type TEXT;      -- 'bungee' | 'tie-down' | 'clip' | 'cable-tie' | 'ratchet-strap'
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_label TEXT;          -- free-text size for non-tarp items, e.g. '2" x 27ft'
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;            -- item material when it differs from the product line

DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_units_per_case_positive CHECK (units_per_case IS NULL OR units_per_case > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_prices_nonnegative CHECK (retail_price_cents >= 0 AND COALESCE(cost_price_cents, 0) >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catalog browsing indexes (~250 products, filtered by color / priced vs quote)
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_retail ON products(retail_price_cents) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_accessory_type ON products(accessory_type) WHERE active = true;

-- Volume tiers are shown on every product page, so the storefront (anon key)
-- must be able to read ACTIVE rules. schema.sql's "FOR ALL USING (false)" policy
-- blocked this, which left tier tables empty in production. Writes stay
-- service-role only (admin server actions).
DROP POLICY IF EXISTS "Public can read active pricing rules" ON pricing_rules;
CREATE POLICY "Public can read active pricing rules" ON pricing_rules
  FOR SELECT USING (active = true);

-- Market reference prices (public retail seen at TractorSupply / Walmart / eBay /
-- WebstaurantStore). Reference for pricing decisions only; never used as the sell price.
ALTER TABLE products ADD COLUMN IF NOT EXISTS market_price_cents INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS market_price_source TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS market_price_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS market_price_checked_at DATE;
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_market_price_nonnegative CHECK (market_price_cents IS NULL OR market_price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pallet-first pricing (Farshid's pallet plan).
-- unit = 'each'  : min/max_quantity are pieces, discount_from_retail_percent applies (unchanged).
-- unit = 'pallet': min/max_quantity are FULL pallets of the product (qty >= N x units_per_full_pallet);
--                  unit price = retail x price_multiplier. requires_account = approved accounts only.
ALTER TABLE pricing_rules ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'each';
ALTER TABLE pricing_rules ADD COLUMN IF NOT EXISTS price_multiplier NUMERIC;
ALTER TABLE pricing_rules ADD COLUMN IF NOT EXISTS requires_account BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pricing_rules ADD COLUMN IF NOT EXISTS label TEXT;
DO $$ BEGIN
  ALTER TABLE pricing_rules ADD CONSTRAINT pricing_rules_unit_check CHECK (unit IN ('each', 'pallet'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE pricing_rules ADD CONSTRAINT pricing_rules_multiplier_range CHECK (price_multiplier IS NULL OR (price_multiplier > 0 AND price_multiplier <= 1));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Per-unit price floor (cost x 1.15) enforced by the pricing engine on every tier.
-- It is public on purpose: the engine needs it client-side, and it equals the lowest
-- price already shown on the product page.
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_unit_price_cents INTEGER;
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_min_unit_price_nonnegative CHECK (min_unit_price_cents IS NULL OR min_unit_price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
