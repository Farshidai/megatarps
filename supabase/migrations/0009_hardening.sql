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
