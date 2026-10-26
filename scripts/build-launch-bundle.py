# Builds supabase/launch/{1-structure,2-catalog,3-prices}.sql — copy-paste bundles for the
# Supabase SQL editor. Re-run after changing any migration or seed. Test: node scripts/test-launch-bundle.mjs
import re, glob
def idem(sql):
    sql = re.sub(r'(?m)^CREATE POLICY "([^"]+)" ON (\w+)', lambda m: f'DROP POLICY IF EXISTS "{m.group(1)}" ON {m.group(2)};\nCREATE POLICY "{m.group(1)}" ON {m.group(2)}', sql)
    sql = re.sub(r'(?m)^CREATE TRIGGER (\w+)\s*\n?\s*(BEFORE|AFTER) (\w+(?: OR \w+)*) ON (\w+)', lambda m: f'DROP TRIGGER IF EXISTS {m.group(1)} ON {m.group(4)};\nCREATE TRIGGER {m.group(1)}\n  {m.group(2)} {m.group(3)} ON {m.group(4)}', sql)
    return sql
def hdr(t): return f"-- ============================================================\n-- MegaTarps launch — {t}\n-- Paste ALL of this into Supabase → SQL Editor → New query → Run.\n-- Safe to run more than once.\n-- ============================================================\n\n"
migs = sorted(glob.glob('supabase/migrations/*.sql'))
p1 = hdr('STEP 1 of 3: database structure & security') + 'BEGIN;\n\n' + idem(open('supabase/schema.sql').read())
for m in migs: p1 += f"\n\n-- ---------------- {m} ----------------\n" + open(m).read()
open('supabase/launch/1-structure.sql', 'w').write(p1 + '\n\nCOMMIT;\n')
p2 = hdr('STEP 2 of 3: product catalog. ⚠️ Replaces all existing products & pricing rules.') + 'BEGIN;\n\n' + open('supabase/seed.sql').read() + '\n\n' + open('supabase/seed-catalog.sql').read() + '\n\nCOMMIT;\n'
open('supabase/launch/2-catalog.sql', 'w').write(p2)
p3 = hdr('STEP 3 of 3: shipping weights, prices (Xpose store −5%), market reference prices, final security') + 'BEGIN;\n\n'
for f in ['supabase/seed-weights.sql', 'supabase/seed-prices-2026-10-25.sql', 'supabase/seed-market-amazon-2026-10-25.sql', 'supabase/seed-market-ttw-2026-10-25.sql', 'supabase/migrations/0099_column_privileges.sql']:
    p3 += f"\n-- ---------------- {f} ----------------\n" + open(f).read() + '\n'
p3 += '\nCOMMIT;\n\n-- Check: ~597 products, ~40 priced, ~800+ market observations\nSELECT (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM products WHERE retail_price_cents > 0) AS priced, (SELECT count(*) FROM market_observations) AS market_prices;\n'
open('supabase/launch/3-prices.sql', 'w').write(p3)
print('bundles written')
