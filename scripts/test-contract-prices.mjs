// Verifies supabase/migrations/0008_contract_prices.sql on PGlite:
// idempotence, constraints, RLS (own rows only), column privileges (no internal
// note/created_by), and that contractors / anon can never write contract prices.
// Usage: node scripts/test-contract-prices.mjs
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'

const db = new PGlite()
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'select current_user::text';
  CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'select ''{}''::jsonb';
  DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN others THEN NULL; END $$;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE TABLE IF NOT EXISTS storage.buckets (id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]);
  CREATE TABLE IF NOT EXISTS storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS
    'select (string_to_array(name, ''/''))[1:array_length(string_to_array(name, ''/''), 1) - 1]';
`)
const strip = (sql) => sql.replace(/CREATE EXTENSION[^;]*;/gi, '')
await db.exec(strip(readFileSync('supabase/schema.sql', 'utf8')))
// Supabase default: public roles get table-level privileges on everything in public
await db.exec(`GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
  ALTER ROLE service_role BYPASSRLS;`)
const migs = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
let failures = 0
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!ok) failures++ }
check('0099 is still the last migration', migs[migs.length - 1] === '0099_column_privileges.sql', migs.join(','))
check('0008 runs before 0099', migs.indexOf('0008_contract_prices.sql') >= 0 && migs.indexOf('0008_contract_prices.sql') < migs.indexOf('0099_column_privileges.sql'))
for (const f of migs) await db.exec(strip(readFileSync(`supabase/migrations/${f}`, 'utf8')))
// idempotent: run 0008 (and 0099 after it) again
await db.exec(strip(readFileSync('supabase/migrations/0008_contract_prices.sql', 'utf8')))
await db.exec(strip(readFileSync('supabase/migrations/0099_column_privileges.sql', 'utf8')))
check('0008 + 0099 re-run cleanly (idempotent)', true)

const A = '11111111-1111-1111-1111-111111111111'
const B = '22222222-2222-2222-2222-222222222222'
const P1 = 'aaaaaaaa-0000-0000-0000-000000000001'
const P2 = 'aaaaaaaa-0000-0000-0000-000000000002'
const Q = 'bbbbbbbb-0000-0000-0000-000000000001'
await db.exec(`
  INSERT INTO auth.users VALUES ('${A}'), ('${B}');
  INSERT INTO contractor_profiles (id, company_name, contact_name, email) VALUES
    ('${A}', 'A Co', 'Ay', 'a@x.com'), ('${B}', 'B Co', 'Bee', 'b@x.com');
  INSERT INTO products (id, xpose_sku, name, slug, tarp_type, width_ft, length_ft, color, retail_price_cents) VALUES
    ('${P1}', 'T1', 't1', 't1', 'poly', 10, 10, 'blue', 5000),
    ('${P2}', 'T2', 't2', 't2', 'poly', 20, 20, 'blue', 9000);
  INSERT INTO quotes (id, quote_number, contractor_id) VALUES ('${Q}', 'MQ-T-1', '${A}');
  INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents, min_quantity, valid_until, source_quote_id, note, created_by) VALUES
    ('${A}', '${P1}', 'T1', 4100, 1, current_date + 90, '${Q}', 'internal: matched competitor', 'admin@megatarps.com'),
    ('${A}', '${P1}', 'T1', 3900, 50, NULL, NULL, NULL, 'admin@megatarps.com'),
    ('${B}', '${P2}', 'T2', 7000, 1, NULL, NULL, 'B secret', 'admin@megatarps.com');
`)

const as = async (role, uid, sql) => {
  await db.exec(`SET test.uid = '${uid ?? ''}'; SET ROLE ${role};`)
  try { return { rows: (await db.query(sql)).rows } } catch (e) { return { error: e.message } } finally { await db.exec('RESET ROLE; RESET test.uid;') }
}
const COLS = 'id, contractor_id, product_id, sku, unit_price_cents, min_quantity, valid_until, source_quote_id, created_at, updated_at'

// --- constraints ---
const fails = async (sql) => { try { await db.exec(sql); return false } catch { return true } }
check('unit_price_cents must be > 0', await fails(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents) VALUES ('${A}', '${P2}', 'T2', 0)`))
check('negative price rejected', await fails(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents) VALUES ('${A}', '${P2}', 'T2', -5)`))
check('min_quantity must be >= 1', await fails(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents, min_quantity) VALUES ('${A}', '${P2}', 'T2', 100, 0)`))
check('unique (contractor_id, product_id, min_quantity)', await fails(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents, min_quantity) VALUES ('${A}', '${P1}', 'T1', 4000, 1)`))
check('contractor FK enforced', await fails(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents) VALUES ('${'9'.repeat(8)}-9999-9999-9999-999999999999', '${P1}', 'T1', 4000)`))
check('product FK enforced', await fails(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents) VALUES ('${A}', '${'9'.repeat(8)}-9999-9999-9999-999999999999', 'T1', 4000)`))
let r = (await db.query(`select min_quantity from contract_prices where unit_price_cents = 7000`)).rows[0]
check('min_quantity defaults to 1', r.min_quantity === 1)
const upsert = await db.query(`INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents, min_quantity) VALUES ('${A}', '${P1}', 'T1', 4050, 1)
  ON CONFLICT (contractor_id, product_id, min_quantity) DO UPDATE SET unit_price_cents = EXCLUDED.unit_price_cents RETURNING unit_price_cents`)
check('upsert on (contractor_id, product_id, min_quantity) works', upsert.rows[0].unit_price_cents === 4050)

// --- RLS / privileges: contractor A ---
r = await as('authenticated', A, `select ${COLS} from contract_prices order by min_quantity`)
check('contractor A reads own rows', !r.error && r.rows.length === 2 && r.rows.every((x) => x.contractor_id === A), r.error ?? '')
r = await as('authenticated', A, `select ${COLS} from contract_prices where contractor_id = '${B}'`)
check("contractor A cannot read B's rows (filtered by RLS)", !r.error && r.rows.length === 0)
r = await as('authenticated', B, `select sku, unit_price_cents from contract_prices`)
check('contractor B sees only own row', !r.error && r.rows.length === 1 && r.rows[0].unit_price_cents === 7000)
r = await as('authenticated', A, `select note from contract_prices`)
check('contractor cannot read internal note column', !!r.error)
r = await as('authenticated', A, `select created_by from contract_prices`)
check('contractor cannot read created_by column', !!r.error)
r = await as('authenticated', A, `select * from contract_prices`)
check('contractor cannot SELECT * (would include internal columns)', !!r.error)

r = await as('authenticated', A, `INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents) VALUES ('${A}', '${P2}', 'T2', 1)`)
check('contractor cannot insert own contract price', !!r.error)
r = await as('authenticated', A, `UPDATE contract_prices SET unit_price_cents = 1 WHERE contractor_id = '${A}'`)
check('contractor cannot update own contract price', !!r.error)
r = await as('authenticated', A, `DELETE FROM contract_prices WHERE contractor_id = '${A}'`)
check('contractor cannot delete contract prices', !!r.error)
r = (await db.query(`select count(*)::int as n, min(unit_price_cents) as lo from contract_prices where contractor_id = '${A}'`)).rows[0]
check('contractor rows untouched after attempted writes', r.n === 2 && r.lo === 3900)

// --- anon ---
r = await as('anon', null, `select id, sku, unit_price_cents from contract_prices`)
check('anon cannot read contract prices', !!r.error || r.rows.length === 0, r.error ? '' : `(${r.rows?.length} rows)`)
r = await as('anon', null, `INSERT INTO contract_prices (contractor_id, product_id, sku, unit_price_cents) VALUES ('${A}', '${P2}', 'T2', 1)`)
check('anon cannot insert', !!r.error)

// --- service role ---
r = await as('service_role', null, `select * from contract_prices`)
check('service_role reads all rows and columns', !r.error && r.rows.length === 3 && 'note' in r.rows[0], r.error ?? '')
r = await as('service_role', null, `UPDATE contract_prices SET unit_price_cents = 3800, valid_until = current_date + 30 WHERE contractor_id = '${A}' AND min_quantity = 50 RETURNING unit_price_cents, updated_at > created_at OR updated_at = created_at AS ok`)
check('service_role can update', !r.error && r.rows[0]?.unit_price_cents === 3800, r.error ?? '')
r = await as('service_role', null, `DELETE FROM contract_prices WHERE contractor_id = '${B}' RETURNING id`)
check('service_role can delete', !r.error && r.rows.length === 1, r.error ?? '')

// --- referential behaviour ---
await db.exec(`DELETE FROM quotes WHERE id = '${Q}'`)
r = (await db.query(`select source_quote_id from contract_prices where contractor_id = '${A}' and min_quantity = 1`)).rows[0]
check('deleting the source quote keeps the contract price (source → NULL)', r && r.source_quote_id === null)

// --- 0099 still hides product cost after 0008 ---
r = await as('anon', null, `select cost_price_cents from products`)
check('0099 still hides products.cost_price_cents', !!r.error)

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
