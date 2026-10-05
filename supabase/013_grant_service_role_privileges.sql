-- ================================================================
-- FIX — service_role had ZERO table-level privileges on public schema
-- ================================================================
-- 008_grant_anon_authenticated_privileges.sql fixed anon/authenticated
-- but only covered those two roles. service_role was never granted
-- the standard bootstrap privileges either, so anything using the
-- service-role key (e.g. src/app/api/webhooks/stripe/route.ts, and
-- any admin script) gets "permission denied for table ..." even
-- though service_role normally bypasses RLS entirely — RLS bypass
-- doesn't help if the base GRANT is missing in the first place.
-- ================================================================

GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
