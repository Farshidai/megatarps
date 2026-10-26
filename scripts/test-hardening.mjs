// Verifies supabase/migrations/0009_hardening.sql on PGlite: tax re-verification + floor-follows-cost.
// Usage: node scripts/test-hardening.mjs
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const db = new PGlite()
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'select current_user::text';
  DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN others THEN NULL; END $$;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE TABLE IF NOT EXISTS storage.buckets (id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]);
  CREATE TABLE IF NOT EXISTS storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS
    'select (string_to_array(name, ''/''))[1:array_length(string_to_array(name, ''/''), 1) - 1]';
`)
const strip = (sql) => sql.replace(/CREATE EXTENSION[^;]*;/gi, '')
await db.exec(strip(readFileSync('supabase/schema.sql', 'utf8')))
const mig = readFileSync('supabase/migrations/0003_wholesale_accounts.sql', 'utf8')
await db.exec(mig)
await db.exec(mig) // idempotent
const h = readFileSync('supabase/migrations/0002_catalog.sql','utf8'); await db.exec(h)
const m9 = readFileSync('supabase/migrations/0009_hardening.sql','utf8'); await db.exec(m9); await db.exec(m9)

const A = '11111111-1111-1111-1111-111111111111'
const B = '22222222-2222-2222-2222-222222222222'
await db.exec(`
  INSERT INTO auth.users VALUES ('${A}'), ('${B}');
  GRANT USAGE ON SCHEMA public, auth, storage TO authenticated, anon;
  GRANT SELECT, INSERT, UPDATE ON contractor_profiles TO authenticated;
  GRANT SELECT, INSERT, UPDATE ON storage.objects TO authenticated;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth, storage TO authenticated, anon;
  INSERT INTO contractor_profiles (id, company_name, contact_name, email) VALUES ('${B}', 'B Co', 'Bee', 'b@x.com');
`)

let failures = 0
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!ok) failures++ }
const asUser = async (uid, sql) => {
  await db.exec(`SET test.uid = '${uid}'; SET ROLE authenticated;`)
  try { return { rows: (await db.query(sql)).rows } } catch (e) { return { error: e.message } } finally { await db.exec('RESET ROLE; RESET test.uid;') }
}
// staff approves B as tax exempt
await db.exec(`UPDATE contractor_profiles SET account_status='approved', tax_exempt=true, tax_id='11-111', resale_certificate_path='${B}/cert.pdf' WHERE id='${B}'`)
let r = await asUser(B, `UPDATE contractor_profiles SET resale_certificate_path='${A}/cert.pdf' WHERE id='${B}'`)
check('customer cannot point certificate at another user\'s file', !!r.error, r.error ?? '')
r = await asUser(B, `UPDATE contractor_profiles SET tax_id='99-999' WHERE id='${B}'`)
check('customer can update own tax ID', !r.error, r.error ?? '')
let t = (await db.query(`SELECT tax_exempt, account_status FROM contractor_profiles WHERE id='${B}'`)).rows[0]
check('changing tax ID removes tax-exempt until staff re-verify', t.tax_exempt === false, JSON.stringify(t))
check('account stays approved', t.account_status === 'approved')
r = await asUser(B, `UPDATE contractor_profiles SET tax_exempt=true WHERE id='${B}'`)
check('customer still cannot set tax_exempt themselves', !!r.error)
r = await asUser(B, `UPDATE contractor_profiles SET resale_certificate_path='${B}/new.pdf' WHERE id='${B}'`)
check('customer can upload a renewed certificate in own folder', !r.error, r.error ?? '')
// floor follows cost
await db.exec(`INSERT INTO products (xpose_sku,name,slug,tarp_type,width_ft,length_ft,color,retail_price_cents,cost_price_cents) VALUES ('T1','t','t','poly',10,10,'blue',5000,2000)`)
let p = (await db.query(`SELECT min_unit_price_cents FROM products WHERE xpose_sku='T1'`)).rows[0]
check('floor set from cost on insert (2000 x 1.15 = 2300)', p.min_unit_price_cents === 2300, JSON.stringify(p))
await db.exec(`UPDATE products SET cost_price_cents=3000 WHERE xpose_sku='T1'`)
p = (await db.query(`SELECT min_unit_price_cents FROM products WHERE xpose_sku='T1'`)).rows[0]
check('floor follows a cost increase (3450)', p.min_unit_price_cents === 3450, JSON.stringify(p))
await db.exec(`UPDATE products SET retail_price_cents=5500 WHERE xpose_sku='T1'`)
p = (await db.query(`SELECT min_unit_price_cents FROM products WHERE xpose_sku='T1'`)).rows[0]
check('retail edit leaves floor alone', p.min_unit_price_cents === 3450)
console.log(failures ? `${failures} FAILED` : 'All hardening checks passed'); process.exit(failures ? 1 : 0)
