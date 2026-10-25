// Verifies supabase/migrations/0003_wholesale_accounts.sql on PGlite:
// idempotence, RLS on contractor_profiles, and the privileged-column guard trigger.
// Usage: node scripts/test-accounts-migration.mjs
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

// default status
let r = (await db.query(`select account_status, payment_terms, wholesale_discount_percent from contractor_profiles where id='${B}'`)).rows[0]
check('new profile defaults to pending/prepaid/0', r.account_status === 'pending' && r.payment_terms === 'prepaid' && Number(r.wholesale_discount_percent) === 0)

// self insert with privileged values gets forced to pending
r = await asUser(A, `INSERT INTO contractor_profiles (id, company_name, contact_name, email, account_status, wholesale_discount_percent, tax_exempt, payment_terms)
  VALUES ('${A}', 'A Co', 'Ay', 'a@x.com', 'approved', 40, true, 'net30') RETURNING account_status, wholesale_discount_percent, tax_exempt, payment_terms`)
check('self insert allowed', !r.error, r.error ?? '')
check('self insert privileged values forced to defaults', r.rows?.[0]?.account_status === 'pending' && Number(r.rows[0].wholesale_discount_percent) === 0 && r.rows[0].tax_exempt === false && r.rows[0].payment_terms === 'prepaid')

r = await asUser(A, `INSERT INTO contractor_profiles (id, company_name, contact_name, email) VALUES ('${'3'.repeat(8)}-3333-3333-3333-333333333333', 'X', 'X', 'x@x.com')`)
check('cannot insert profile for someone else', !!r.error)

r = await asUser(A, `select id from contractor_profiles`)
check('user sees only own profile', r.rows?.length === 1 && r.rows[0].id === A)

r = await asUser(A, `update contractor_profiles set company_name='A Co LLC', phone='555', website='a.com', jobsite_addresses='[{"line1":"1 Main"}]' where id='${A}' returning company_name`)
check('user can update safe fields', r.rows?.[0]?.company_name === 'A Co LLC', r.error ?? '')

for (const [col, val] of [['account_status', "'approved'"], ['wholesale_discount_percent', '15'], ['payment_terms', "'net30'"], ['credit_limit_cents', '500000'], ['tax_exempt', 'true'], ['approved_by', "'me'"], ['rejection_reason', "'x'"]]) {
  r = await asUser(A, `update contractor_profiles set ${col}=${val} where id='${A}'`)
  check(`user cannot change ${col}`, !!r.error && /staff/.test(r.error), r.error ? '' : '(no error!)')
}

r = await asUser(A, `update contractor_profiles set company_name='hacked' where id='${B}' returning id`)
check("user cannot update another user's profile", !r.error && r.rows.length === 0)

await db.exec(`GRANT ALL ON contractor_profiles TO service_role; ALTER ROLE service_role BYPASSRLS;`)
await db.exec(`SET ROLE service_role`)
await db.exec(`update contractor_profiles set account_status='rejected', rejection_reason='test' where id='${B}'`)
await db.exec('RESET ROLE')
r = (await db.query(`select account_status from contractor_profiles where id='${B}'`)).rows[0]
check('service_role can change status', r.account_status === 'rejected')
// owner (postgres) path == SQL editor / migrations
await db.exec(`update contractor_profiles set account_status='approved', wholesale_discount_percent=12, payment_terms='net30', tax_exempt=true where id='${A}'`)
r = (await db.query(`select account_status, wholesale_discount_percent from contractor_profiles where id='${A}'`)).rows[0]
check('owner/service role can approve', r.account_status === 'approved' && Number(r.wholesale_discount_percent) === 12)

let threw = false
try { await db.exec(`update contractor_profiles set account_status='bogus' where id='${A}'`) } catch { threw = true }
check('status check constraint', threw)

// storage policies
await db.exec(`INSERT INTO storage.objects (bucket_id, name) VALUES ('resale-certificates', '${B}/cert.pdf')`)
r = await asUser(A, `INSERT INTO storage.objects (bucket_id, name) VALUES ('resale-certificates', '${A}/123-cert.pdf') RETURNING name`)
check('user can upload into own folder', !r.error, r.error ?? '')
r = await asUser(A, `INSERT INTO storage.objects (bucket_id, name) VALUES ('resale-certificates', '${B}/evil.pdf')`)
check("user cannot upload into another user's folder", !!r.error)
r = await asUser(A, `select name from storage.objects where bucket_id='resale-certificates'`)
check('user reads only own certificates', r.rows?.length === 1 && r.rows[0].name.startsWith(A))
r = (await db.query(`select public, file_size_limit from storage.buckets where id='resale-certificates'`)).rows[0]
check('bucket is private with 10MB limit', r.public === false && Number(r.file_size_limit) === 10485760)

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
