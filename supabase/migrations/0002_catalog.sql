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
