-- 0005_newsletter.sql — Team E (SEO, Content & Performance)
-- Email capture for the homepage / resources newsletter block (POST /api/newsletter).
-- Idempotent: safe to run more than once.
--
-- Access model: the API route writes with the service role (which bypasses RLS).
-- RLS is enabled with NO anon/authenticated policies, and table privileges are
-- revoked from those roles, so the public anon key can neither read nor write
-- the list. Read it from the Supabase dashboard or a service-role admin tool.

CREATE TABLE IF NOT EXISTS public.newsletter_signups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  source          TEXT,                       -- e.g. 'homepage', 'resources', 'footer'
  consent_text    TEXT,                       -- what the visitor agreed to, for the record
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- Constraints added separately so re-runs on an existing table still pick them up.
DO $$ BEGIN
  ALTER TABLE public.newsletter_signups
    ADD CONSTRAINT newsletter_signups_email_lower CHECK (email = lower(email));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.newsletter_signups
    ADD CONSTRAINT newsletter_signups_email_format
    CHECK (char_length(email) <= 254 AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.newsletter_signups
    ADD CONSTRAINT newsletter_signups_source_len CHECK (source IS NULL OR char_length(source) <= 40);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_signups_email_key ON public.newsletter_signups (email);
CREATE INDEX IF NOT EXISTS newsletter_signups_created_at_idx ON public.newsletter_signups (created_at DESC);

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated on purpose (deny all). Drop any that may
-- have been added by hand so the table stays private.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_signups;
DROP POLICY IF EXISTS "Public can read newsletter signups" ON public.newsletter_signups;

REVOKE ALL ON public.newsletter_signups FROM anon, authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;
