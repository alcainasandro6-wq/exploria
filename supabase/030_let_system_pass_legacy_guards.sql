-- Your database has "privilege escalation" guard triggers that are not in the
-- repository (e.g. activities_prevent_privilege_escalation). They only test
-- NOT is_admin(), so they also block the platform itself: the automatic
-- booking_count update, the server (service role) and the TuriTop importer.
--
-- This rewrites those guards so that "privileged" = admin OR server/system
-- (is_privileged_actor(), see 026). Ordinary users calling the REST API with
-- their own session are blocked exactly as before. Safe to re-run.

DO $$
DECLARE
  t RECORD;
  def TEXT;
BEGIN
  FOR t IN
    SELECT DISTINCT p.oid AS fn_oid, p.proname, c.relname AS tbl
    FROM pg_trigger tg
    JOIN pg_proc p ON p.oid = tg.tgfoid
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT tg.tgisinternal
      AND n.nspname = 'public'
      AND c.relname IN ('activities', 'reservations', 'providers', 'hotels', 'profiles', 'reviews')
      AND p.proname NOT IN ('is_privileged_actor')
      AND p.prosrc ILIKE '%NOT is_admin()%'
      AND (tg.tgname ILIKE '%escalation%' OR p.prosrc ILIKE '%Only an admin%')
  LOOP
    def := pg_get_functiondef(t.fn_oid);
    IF def LIKE '%NOT is_admin()%' THEN
      EXECUTE replace(def, 'NOT is_admin()', 'NOT is_privileged_actor()');
      RAISE NOTICE 'Updated guard function % on table %', t.proname, t.tbl;
    END IF;
  END LOOP;
END $$;
