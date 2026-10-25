// Proves anon/authenticated cannot read cost/market columns after 0099.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
const db = new PGlite()
await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'select null::uuid';
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'select ''anon''::text';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'select ''{}''::jsonb';
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS 'select string_to_array(name, ''/'')';`)
const strip = (s) => s.replace(/CREATE EXTENSION[^;]*;/gi, '')
await db.exec(strip(readFileSync('supabase/schema.sql', 'utf8')))
// Supabase default: public roles get table-level privileges
await db.exec(`GRANT USAGE ON SCHEMA public TO anon, authenticated; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;`)
for (const f of readdirSync('supabase/migrations').sort()) await db.exec(strip(readFileSync('supabase/migrations/' + f, 'utf8')))
await db.exec(`INSERT INTO products (xpose_sku,name,slug,tarp_type,width_ft,length_ft,color,retail_price_cents,cost_price_cents) VALUES ('T1','t','t','poly',10,10,'blue',5000,2100)`)
let pass = 0, fail = 0
const check = async (label, sql, shouldFail) => {
  try { await db.exec(`SET ROLE anon; ${sql}; RESET ROLE;`); if (shouldFail) { fail++; console.log('FAIL', label) } else { pass++; console.log('ok  ', label) } }
  catch (e) { await db.exec('RESET ROLE'); if (shouldFail) { pass++; console.log('ok  ', label, '→', e.message.split('\n')[0]) } else { fail++; console.log('FAIL', label, e.message) } }
}
await check('anon reads public product columns', 'SELECT id, name, retail_price_cents FROM products', false)
await check('anon cannot read cost_price_cents', 'SELECT cost_price_cents FROM products', true)
await check('anon cannot SELECT * (would include cost)', 'SELECT * FROM products', true)
await check('anon reads public rule columns', 'SELECT min_quantity, discount_from_retail_percent FROM pricing_rules', false)
await check('anon cannot read margin_percent', 'SELECT margin_percent FROM pricing_rules', true)
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
