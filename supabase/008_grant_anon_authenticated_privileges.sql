-- ================================================================
-- FIX — anon/authenticated roles had ZERO table-level privileges
-- ================================================================
-- Every table in this project has Row Level Security enabled with
-- correct policies (see schema.sql), but RLS only ever RESTRICTS
-- access that the underlying Postgres GRANTs already allow — it
-- can't grant access on its own. Since schema.sql never ran the
-- standard Supabase bootstrap GRANTs, the `anon` and `authenticated`
-- roles had no SELECT/INSERT/UPDATE/DELETE privileges on `public`
-- tables at all, so PostgREST rejected every request from the public
-- site with "permission denied for table ..." before RLS was even
-- evaluated. This is why published activities/blog posts (and likely
-- every other public-facing query) never showed up.
--
-- This grants the same baseline privileges a standard Supabase
-- project sets up automatically, and applies them to any tables
-- created in the future too (ALTER DEFAULT PRIVILEGES). RLS policies
-- already in place remain the real access-control layer — this just
-- lets Postgres get far enough to evaluate them.
-- ================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;
