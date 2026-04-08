-- ============================================================
-- MegaTarps Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PRODUCT LINES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_lines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  thickness_mil INTEGER,
  material TEXT NOT NULL,
  weave_count TEXT,
  weight_oz_per_sqyd NUMERIC,
  grommet_type TEXT NOT NULL,
  grommet_spacing_inches INTEGER NOT NULL,
  uv_resistant BOOLEAN DEFAULT true,
  waterproof BOOLEAN DEFAULT true,
  mildew_resistant BOOLEAN DEFAULT true,
  fire_retardant BOOLEAN DEFAULT false,
  reinforced_corners BOOLEAN DEFAULT false,
  sewn_in_rope BOOLEAN DEFAULT false,
  description TEXT
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xpose_sku TEXT UNIQUE NOT NULL,
  mega_sku TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_line_id TEXT REFERENCES product_lines(id),

  -- Classification
  categories TEXT[] NOT NULL DEFAULT '{}',
  tarp_type TEXT NOT NULL,
  thickness_mil INTEGER,

  -- Dimensions
  width_ft INTEGER NOT NULL,
  length_ft INTEGER NOT NULL,
  coverage_sqft INTEGER GENERATED ALWAYS AS (width_ft * length_ft) STORED,

  -- Color
  color TEXT NOT NULL,
  color_hex TEXT,

  -- Pricing
  retail_price_cents INTEGER NOT NULL DEFAULT 0,
  cost_price_cents INTEGER DEFAULT 0,

  -- Pallet
  units_per_half_pallet INTEGER,
  units_per_full_pallet INTEGER,

  -- Content
  image_urls JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN(categories) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_type ON products(tarp_type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness_mil) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_dimensions ON products(width_ft, length_ft) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_line ON products(product_line_id);

-- ============================================================
-- PRICING RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarp_type TEXT,
  thickness_mil INTEGER,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  margin_percent NUMERIC,
  discount_from_retail_percent NUMERIC,
  flat_markup_cents INTEGER,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTRACTOR PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT,
  service_area TEXT,
  tax_exempt BOOLEAN DEFAULT false,
  tax_id TEXT,
  default_shipping_address JSONB,
  jobsite_addresses JSONB DEFAULT '[]'::jsonb,
  preferred_products JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  contractor_id UUID REFERENCES contractor_profiles(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER,
  shipping_estimate_cents INTEGER,
  total_cents INTEGER,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','quoted','accepted','ordered','shipped','delivered','expired')),
  project_type TEXT,
  project_location TEXT,
  timeline TEXT,
  special_requirements TEXT,
  ai_conversation_id TEXT,
  ai_recommended BOOLEAN DEFAULT false,
  quoted_by TEXT,
  quoted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_contractor ON quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  contractor_id UUID REFERENCES contractor_profiles(id),
  items JSONB NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  xpose_invoice_ref TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_contractor ON orders(contractor_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id),
  session_token TEXT UNIQUE NOT NULL,
  identified_needs JSONB,
  recommended_products JSONB,
  converted_to_rfq BOOLEAN DEFAULT false,
  quote_id UUID REFERENCES quotes(id),
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  products_referenced JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Products: public read (no cost_price_cents for anon)
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (active = true);

-- Product lines: public read
CREATE POLICY "Public can read product lines" ON product_lines
  FOR SELECT USING (true);

-- Contractor profiles: own data only
CREATE POLICY "Contractors read own profile" ON contractor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Contractors update own profile" ON contractor_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Quotes: contractors read own, guests read by session (handled in API)
CREATE POLICY "Contractors read own quotes" ON quotes
  FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Anyone can insert quotes" ON quotes
  FOR INSERT WITH CHECK (true);

-- Orders: contractors read own
CREATE POLICY "Contractors read own orders" ON orders
  FOR SELECT USING (contractor_id = auth.uid());

-- Chat: session-based (handled server-side)
CREATE POLICY "Service role manages chat" ON chat_sessions
  FOR ALL USING (true);

CREATE POLICY "Service role manages messages" ON chat_messages
  FOR ALL USING (true);

-- Pricing rules: admin only (via service role)
CREATE POLICY "Admin manages pricing rules" ON pricing_rules
  FOR ALL USING (false); -- blocked for all; use service role key

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
