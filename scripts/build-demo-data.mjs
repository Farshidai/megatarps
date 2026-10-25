// Builds src/data/demo-catalog.json from supabase/schema.sql + seed files using
// an in-memory Postgres (PGlite). Used for DEMO MODE (no Supabase keys) so the
// storefront can be previewed and tested without a live database.
// Usage: node scripts/build-demo-data.mjs [extra seed .sql files...]
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, writeFileSync } from 'node:fs'

const db = new PGlite()
// Minimal stand-ins for Supabase-specific objects referenced by schema.sql
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'select null::uuid';
  CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'select ''anon''::text';
  DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN others THEN NULL; END $$;
`)
const strip = (sql) => sql.replace(/CREATE EXTENSION[^;]*;/gi, '')
// migrations (if any) run after schema, before seeds
import { readdirSync, existsSync } from 'node:fs'
const migs = existsSync('supabase/migrations')
  ? readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort().map((f) => `supabase/migrations/${f}`)
  : []
const seeds = process.argv.slice(2).length ? process.argv.slice(2) : ['supabase/seed.sql']
for (const f of ['supabase/schema.sql', ...migs, ...seeds]) {
  try { await db.exec(strip(readFileSync(f, 'utf8'))) }
  catch (e) { console.error(`Error in ${f}:`, e.message); process.exit(1) }
}
const q = async (s) => (await db.query(s)).rows
const out = {
  generated_at: new Date().toISOString(),
  product_lines: await q('select * from product_lines order by id'),
  products: await q('select * from products order by width_ft, length_ft'),
  pricing_rules: await q('select * from pricing_rules where active order by min_quantity'),
}
writeFileSync('src/data/demo-catalog.json', JSON.stringify(out, null, 1))
console.log(`demo-catalog.json: ${out.products.length} products, ${out.product_lines.length} lines, ${out.pricing_rules.length} rules`)
