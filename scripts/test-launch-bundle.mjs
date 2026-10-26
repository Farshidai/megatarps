// Runs supabase/launch/1-3 on PGlite (with Supabase stand-ins) TWICE to prove they apply and are re-runnable.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
const db = new PGlite()
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'select current_user::text';
  CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'select ''{}''::jsonb';
  DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN others THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN others THEN NULL; END $$;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE TABLE IF NOT EXISTS storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
  CREATE TABLE IF NOT EXISTS storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS 'select (string_to_array(name, ''/''))[1:array_length(string_to_array(name, ''/''), 1) - 1]';
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
`)
const strip = (s) => s.replace(/CREATE EXTENSION[^;]*;/gi, '')
for (const round of [1, 2]) {
  for (const f of ['1-structure', '2-catalog', '3-prices']) {
    try { await db.exec(strip(readFileSync(`supabase/launch/${f}.sql`, 'utf8'))) }
    catch (e) { console.error(`FAIL round ${round} ${f}: ${e.message}`); process.exit(1) }
    console.log(`ok   round ${round} ${f}`)
  }
}
const r = (await db.query(`SELECT count(*)::int AS products, count(*) FILTER (WHERE retail_price_cents > 0)::int AS priced, count(*) FILTER (WHERE cost_price_cents > 0)::int AS costed FROM products`)).rows[0]
console.log(r)
let blocked = false
try { await db.exec('SET ROLE anon; SELECT cost_price_cents FROM products; RESET ROLE;') } catch { blocked = true; await db.exec('RESET ROLE') }
console.log(blocked ? 'ok   anon cannot read cost' : 'FAIL anon can read cost'); process.exit(blocked && r.products > 500 ? 0 : 1)
