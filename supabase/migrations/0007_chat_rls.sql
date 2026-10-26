-- ============================================================
-- 0007 — Close the chat tables (QA fix)
-- schema.sql created "Service role manages chat" / "Service role manages messages"
-- as FOR ALL USING (true) with no TO clause, so they apply to anon and
-- authenticated too: anyone with the public anon key could read, insert and
-- delete every chat session token and message. The service role bypasses RLS
-- and needs no policy, so dropping them leaves server code unaffected.
-- (No app code reads or writes these tables today.)
-- Idempotent: safe to run more than once.
-- ============================================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages chat" ON chat_sessions;
DROP POLICY IF EXISTS "Service role manages messages" ON chat_messages;
-- No replacement policies on purpose: deny all for anon/authenticated.

REVOKE ALL ON chat_sessions FROM anon, authenticated;
REVOKE ALL ON chat_messages FROM anon, authenticated;
