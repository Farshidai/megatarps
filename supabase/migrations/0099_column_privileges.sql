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
  -- products: everything except cost / market reference data / the price floor
  -- (min_unit_price_cents = cost x 1.15, so floor / 1.15 reveals cost; server code reads it
  -- with the service role — src/lib/price-floors.ts)
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
    AND column_name NOT IN ('cost_price_cents', 'min_unit_price_cents', 'market_price_cents', 'market_price_source', 'market_price_url', 'market_price_checked_at');
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
