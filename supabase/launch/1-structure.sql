-- ============================================================
-- MegaTarps launch — STEP 1 of 3: database structure & security
-- Paste ALL of this into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

BEGIN;

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
DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (active = true);

-- Product lines: public read
DROP POLICY IF EXISTS "Public can read product lines" ON product_lines;
CREATE POLICY "Public can read product lines" ON product_lines
  FOR SELECT USING (true);

-- Contractor profiles: own data only
DROP POLICY IF EXISTS "Contractors read own profile" ON contractor_profiles;
CREATE POLICY "Contractors read own profile" ON contractor_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors update own profile" ON contractor_profiles;
CREATE POLICY "Contractors update own profile" ON contractor_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Quotes: contractors read own, guests read by session (handled in API)
DROP POLICY IF EXISTS "Contractors read own quotes" ON quotes;
CREATE POLICY "Contractors read own quotes" ON quotes
  FOR SELECT USING (contractor_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert quotes" ON quotes;
CREATE POLICY "Anyone can insert quotes" ON quotes
  FOR INSERT WITH CHECK (true);

-- Orders: contractors read own
DROP POLICY IF EXISTS "Contractors read own orders" ON orders;
CREATE POLICY "Contractors read own orders" ON orders
  FOR SELECT USING (contractor_id = auth.uid());

-- Chat: session-based (handled server-side)
DROP POLICY IF EXISTS "Service role manages chat" ON chat_sessions;
CREATE POLICY "Service role manages chat" ON chat_sessions
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role manages messages" ON chat_messages;
CREATE POLICY "Service role manages messages" ON chat_messages
  FOR ALL USING (true);

-- Pricing rules: admin only (via service role)
DROP POLICY IF EXISTS "Admin manages pricing rules" ON pricing_rules;
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

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ---------------- supabase/migrations/0002_catalog.sql ----------------
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


-- ---------------- supabase/migrations/0003_wholesale_accounts.sql ----------------
-- ============================================================
-- 0003 — Wholesale accounts (Team C)
-- Application + approval workflow on contractor_profiles, a private Storage
-- bucket for resale / tax-exempt certificates, and guards so contractors can
-- never grant themselves pricing, terms, credit or tax exemption.
-- Idempotent: safe to run more than once.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columns
-- ------------------------------------------------------------
ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS wholesale_discount_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT NOT NULL DEFAULT 'prepaid',
  ADD COLUMN IF NOT EXISTS credit_limit_cents INTEGER,
  ADD COLUMN IF NOT EXISTS resale_certificate_path TEXT,
  ADD COLUMN IF NOT EXISTS resale_cert_state TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
  ADD COLUMN IF NOT EXISTS est_monthly_volume TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,          -- admin email that approved/rejected
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Check constraints (drop + add so re-runs stay clean)
ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_account_status_check;
ALTER TABLE contractor_profiles ADD CONSTRAINT contractor_profiles_account_status_check
  CHECK (account_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_payment_terms_check;
ALTER TABLE contractor_profiles ADD CONSTRAINT contractor_profiles_payment_terms_check
  CHECK (payment_terms IN ('prepaid', 'net15', 'net30'));

ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_discount_range_check;
ALTER TABLE contractor_profiles ADD CONSTRAINT contractor_profiles_discount_range_check
  CHECK (wholesale_discount_percent >= 0 AND wholesale_discount_percent <= 100);

ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_credit_limit_check;
ALTER TABLE contractor_profiles ADD CONSTRAINT contractor_profiles_credit_limit_check
  CHECK (credit_limit_cents IS NULL OR credit_limit_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_status
  ON contractor_profiles(account_status, created_at DESC);

-- ------------------------------------------------------------
-- 2. RLS on contractor_profiles
--    (schema.sql already has "read own" + "update own"; restate them with an
--     explicit WITH CHECK and allow inserting only your own row. Privileged
--     columns are protected by the trigger below, not by RLS alone.)
-- ------------------------------------------------------------
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors read own profile" ON contractor_profiles;
CREATE POLICY "Contractors read own profile" ON contractor_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors update own profile" ON contractor_profiles;
CREATE POLICY "Contractors update own profile" ON contractor_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors insert own profile" ON contractor_profiles;
CREATE POLICY "Contractors insert own profile" ON contractor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
-- No DELETE policy: contractors cannot delete profiles (service role only).

-- ------------------------------------------------------------
-- 3. Guard trigger: only the service role / database owner may set
--    account_status, wholesale_discount_percent, payment_terms,
--    credit_limit_cents, tax_exempt, approved_at, approved_by, rejection_reason.
--    PostgREST runs end-user requests as role "anon" or "authenticated";
--    the service-role key runs as "service_role"; the SQL editor as "postgres".
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION contractor_profiles_guard()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();

  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;  -- service_role / postgres: trusted
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- A self-created profile always starts as a fresh, unapproved application.
    NEW.account_status := 'pending';
    NEW.wholesale_discount_percent := 0;
    NEW.payment_terms := 'prepaid';
    NEW.credit_limit_cents := NULL;
    NEW.tax_exempt := false;
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  IF NEW.account_status IS DISTINCT FROM OLD.account_status
     OR NEW.wholesale_discount_percent IS DISTINCT FROM OLD.wholesale_discount_percent
     OR NEW.payment_terms IS DISTINCT FROM OLD.payment_terms
     OR NEW.credit_limit_cents IS DISTINCT FROM OLD.credit_limit_cents
     OR NEW.tax_exempt IS DISTINCT FROM OLD.tax_exempt
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Only MegaTarps staff can change account status, pricing, terms, credit or tax exemption'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contractor_profiles_guard ON contractor_profiles;
CREATE TRIGGER contractor_profiles_guard
  BEFORE INSERT OR UPDATE ON contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION contractor_profiles_guard();

-- ------------------------------------------------------------
-- 4. Storage: private bucket for resale / tax-exempt certificates
--    Object path convention: <auth user id>/<timestamp>-<filename>
--    (10 MB max; PDF, JPG, PNG only — enforced by Storage itself)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resale-certificates', 'resale-certificates', false, 10485760,
        ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Resale certs: owners read own" ON storage.objects;
CREATE POLICY "Resale certs: owners read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resale-certificates'
         AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Resale certs: owners upload own" ON storage.objects;
CREATE POLICY "Resale certs: owners upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resale-certificates'
              AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Resale certs: owners update own" ON storage.objects;
CREATE POLICY "Resale certs: owners update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resale-certificates'
         AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resale-certificates'
              AND (storage.foldername(name))[1] = auth.uid()::text);
-- No DELETE policy: certificates are kept for tax records (admins use the service role).


-- ---------------- supabase/migrations/0004_quote_lifecycle.sql ----------------
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


-- ---------------- supabase/migrations/0005_newsletter.sql ----------------
-- 0005_newsletter.sql — Team E (SEO, Content & Performance)
-- Email capture for the homepage / resources newsletter block (POST /api/newsletter).
-- Idempotent: safe to run more than once.
--
-- Access model: the API route writes with the service role (which bypasses RLS).
-- RLS is enabled with NO anon/authenticated policies, and table privileges are
-- revoked from those roles, so the public anon key can neither read nor write
-- the list. Read it from the Supabase dashboard or a service-role admin tool.

CREATE TABLE IF NOT EXISTS public.newsletter_signups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  source          TEXT,                       -- e.g. 'homepage', 'resources', 'footer'
  consent_text    TEXT,                       -- what the visitor agreed to, for the record
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- Constraints added separately so re-runs on an existing table still pick them up.
DO $$ BEGIN
  ALTER TABLE public.newsletter_signups
    ADD CONSTRAINT newsletter_signups_email_lower CHECK (email = lower(email));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.newsletter_signups
    ADD CONSTRAINT newsletter_signups_email_format
    CHECK (char_length(email) <= 254 AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.newsletter_signups
    ADD CONSTRAINT newsletter_signups_source_len CHECK (source IS NULL OR char_length(source) <= 40);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_signups_email_key ON public.newsletter_signups (email);
CREATE INDEX IF NOT EXISTS newsletter_signups_created_at_idx ON public.newsletter_signups (created_at DESC);

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated on purpose (deny all). Drop any that may
-- have been added by hand so the table stays private.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_signups;
DROP POLICY IF EXISTS "Public can read newsletter signups" ON public.newsletter_signups;

REVOKE ALL ON public.newsletter_signups FROM anon, authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;


-- ---------------- supabase/migrations/0006_freight.sql ----------------
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


-- ---------------- supabase/migrations/0007_chat_rls.sql ----------------
-- ============================================================
-- 0007 — Close the chat tables (QA fix)
-- schema.sql created "Service role manages chat" / "Service role manages messages"
-- as FOR ALL USING (true) with no TO clause, so they apply to anon and
-- authenticated too: anyone with the public anon key could read, insert and
-- delete every chat session token and message. The service role bypasses RLS
-- and needs no policy, so dropping them leaves server code unaffected.
-- (No app code reads or writes these tables today.)
-- Idempotent: safe to run more than once.
-- ============================================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages chat" ON chat_sessions;
DROP POLICY IF EXISTS "Service role manages messages" ON chat_messages;
-- No replacement policies on purpose: deny all for anon/authenticated.

REVOKE ALL ON chat_sessions FROM anon, authenticated;
REVOKE ALL ON chat_messages FROM anon, authenticated;


-- ---------------- supabase/migrations/0008_contract_prices.sql ----------------
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


-- ---------------- supabase/migrations/0009_hardening.sql ----------------
-- ============================================================
-- 0009: Hardening from the independent QA review (Oct 2026). Idempotent.
--
-- 1. Tax details: a customer may update their own tax ID / certificate (e.g. a renewed
--    resale certificate), but any change REMOVES tax-exempt status until MegaTarps staff
--    re-approve it, and the certificate path must point inside the user's own folder.
-- 2. Price floor: min_unit_price_cents always follows cost (cost x 1.15, rounded up), so
--    a cost increase can never leave the site selling below cost.
-- ============================================================

-- 1. Tax re-verification -------------------------------------------------------
CREATE OR REPLACE FUNCTION contractor_profiles_tax_recheck()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;  -- service_role / postgres (admin actions): trusted
  END IF;

  IF NEW.resale_certificate_path IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.resale_certificate_path IS DISTINCT FROM OLD.resale_certificate_path)
     AND split_part(NEW.resale_certificate_path, '/', 1) IS DISTINCT FROM auth.uid()::text THEN
    RAISE EXCEPTION 'Certificate must be uploaded to your own folder' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND (
       NEW.tax_id IS DISTINCT FROM OLD.tax_id
       OR NEW.resale_cert_state IS DISTINCT FROM OLD.resale_cert_state
       OR NEW.resale_certificate_path IS DISTINCT FROM OLD.resale_certificate_path) THEN
    NEW.tax_exempt := false;  -- staff must re-verify the new tax details
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fires after contractor_profiles_guard (triggers run in name order), so the guard
-- still blocks customers from setting tax_exempt themselves.
DROP TRIGGER IF EXISTS contractor_profiles_tax_recheck ON contractor_profiles;
CREATE TRIGGER contractor_profiles_tax_recheck
  BEFORE INSERT OR UPDATE ON contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION contractor_profiles_tax_recheck();

-- 2. Price floor follows cost --------------------------------------------------
CREATE OR REPLACE FUNCTION products_floor_from_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cost_price_cents IS NOT NULL AND NEW.cost_price_cents > 0
     AND (TG_OP = 'INSERT' OR NEW.cost_price_cents IS DISTINCT FROM OLD.cost_price_cents
          OR NEW.min_unit_price_cents IS NULL) THEN
    NEW.min_unit_price_cents := CEIL(NEW.cost_price_cents * 1.15)::int;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_floor_from_cost ON products;
CREATE TRIGGER products_floor_from_cost
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_floor_from_cost();

-- Backfill any product that has a cost but no floor.
UPDATE products SET min_unit_price_cents = CEIL(cost_price_cents * 1.15)::int
WHERE cost_price_cents > 0 AND min_unit_price_cents IS NULL;


-- ---------------- supabase/migrations/0010_market_observations.sql ----------------
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


-- ---------------- supabase/migrations/0099_column_privileges.sql ----------------
-- ============================================================
-- 0099: Column-level privileges — hide cost & market data from the public API.
--
-- RLS controls WHICH ROWS a role can see; it cannot hide columns. The storefront
-- uses the public anon key, so without this anyone could query
-- products.cost_price_cents directly. Here we revoke table-wide SELECT from the
-- public roles and grant SELECT on every column EXCEPT the private ones.
--
-- Runs last on purpose. Safe to re-run. RE-RUN THIS FILE after any migration that
-- adds a new public column to products or pricing_rules (new columns are private
-- until granted). Service role (admin pages, webhooks) is unaffected.
-- ============================================================

DO $$
DECLARE
  cols text;
BEGIN
  -- products: everything except cost / market reference data
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
    AND column_name NOT IN ('cost_price_cents', 'market_price_cents', 'market_price_source', 'market_price_url', 'market_price_checked_at');
  EXECUTE 'REVOKE SELECT ON public.products FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.products TO anon, authenticated', cols);

  -- pricing_rules: hide internal margin / markup inputs
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'pricing_rules'
    AND column_name NOT IN ('margin_percent', 'flat_markup_cents');
  EXECUTE 'REVOKE SELECT ON public.pricing_rules FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.pricing_rules TO anon, authenticated', cols);
END $$;


COMMIT;
