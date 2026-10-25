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
