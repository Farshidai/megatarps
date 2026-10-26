# Supabase setup — run order

Run each file in the Supabase SQL editor, in this exact order (all are safe to re-run unless noted).

1. `supabase/schema.sql` — base tables (fresh database only)
2. Migrations, in number order:
   `0002_catalog.sql` → `0003_wholesale_accounts.sql` → `0004_quote_lifecycle.sql` → `0005_newsletter.sql` →
   `0006_freight.sql` → `0007_chat_rls.sql` → `0008_contract_prices.sql` (when merged) → `0009_hardening.sql` →
   `0010_market_observations.sql` → **`0099_column_privileges.sql` last** (re-run it after any future migration that adds product columns)
3. Seeds:
   - `supabase/seed.sql` — ⚠️ fresh database only: it deletes all products and pricing rules first
   - `supabase/seed-catalog.sql` — full Xpose catalog (upsert, never overwrites real prices/images)
   - `supabase/seed-weights.sql` — real packed shipping weights (10-mil)
   - `supabase/seed-prices-2026-10-25.sql` — guest prices = Xpose store pallet price −5%, floor cost × 1.15
   - `supabase/seed-market-amazon-2026-10-25.sql` — Amazon reference prices (admin-only)
4. Keep existing customers approved after 0003 (all existing profiles become `pending`):
   `UPDATE contractor_profiles SET account_status='approved', approved_at=now(), approved_by='mfirooz@megatarps.com' WHERE id IN (...);`

Easiest: paste `supabase/launch/1-structure.sql`, then `2-catalog.sql`, then `3-prices.sql` (bundles of everything above, tested by `node scripts/test-launch-bundle.mjs`).

Local check of the whole chain: `node scripts/build-demo-data.mjs supabase/seed.sql supabase/seed-catalog.sql supabase/seed-weights.sql supabase/seed-prices-2026-10-25.sql supabase/seed-market-amazon-2026-10-25.sql`
