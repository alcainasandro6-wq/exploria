-- ================================================================
-- ROOT-CAUSE FIX for "Database error creating new user"
-- ================================================================
-- Confirmed via Supabase Postgres logs: the real error was
--   ERROR: type "user_role" does not exist (SQLSTATE 42704)
-- raised inside handle_new_user() — the trigger that creates a
-- public.profiles row whenever a new row is inserted into auth.users.
--
-- Root cause: handle_new_user() is SECURITY DEFINER, which makes it run
-- with the privileges of whoever owns the function — but it does NOT
-- pin which schemas that session's search_path includes. GoTrue (Supabase
-- Auth) connects as its own dedicated Postgres role with a search_path
-- that does NOT include `public`, so the trigger's unqualified cast
-- `(...)::user_role` (a type defined in the public schema) failed to
-- resolve — even though the exact same trigger works fine when invoked
-- via PostgREST, whose connections DO default to a search_path that
-- includes public. This is why it looked fine in all our earlier testing
-- (raw SQL inserts, PostgREST-driven reads) and only broke for the one
-- path that goes through GoTrue's own internal connection: creating a
-- brand-new user, either via the public /auth/register signup or via
-- the admin "create user" feature.
--
-- Fix: pin `search_path = public, pg_temp` on every SECURITY DEFINER
-- function in the schema — the standard, recommended hardening for
-- SECURITY DEFINER functions in Postgres (also closes a security gap:
-- without a pinned search_path, a SECURITY DEFINER function can be
-- tricked into resolving an object from a schema the caller controls).
-- This is a metadata-only change — ALTER FUNCTION here does not touch
-- any function body/logic, so every function keeps behaving exactly as
-- before other than now always resolving `public` schema objects
-- correctly regardless of which internal service calls it.
-- ================================================================

ALTER FUNCTION handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION provider_has_active_subscription(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION update_activity_rating() SET search_path = public, pg_temp;
ALTER FUNCTION get_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION generate_confirmation_code() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_commissions() SET search_path = public, pg_temp;
ALTER FUNCTION create_commission_record() SET search_path = public, pg_temp;
ALTER FUNCTION update_activity_booking_count() SET search_path = public, pg_temp;
ALTER FUNCTION get_hotel_by_affiliate_code(TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION generate_hotel_tracking_url(TEXT, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION validate_reservation_transition(reservation_status, reservation_status, user_role, BOOLEAN, BOOLEAN) SET search_path = public, pg_temp;
ALTER FUNCTION transition_reservation(UUID, reservation_status, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION enforce_subscription_on_activity() SET search_path = public, pg_temp;
ALTER FUNCTION enforce_subscription_on_reservation() SET search_path = public, pg_temp;
ALTER FUNCTION handle_subscription_deactivation() SET search_path = public, pg_temp;
ALTER FUNCTION track_affiliate_click(TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION track_affiliate_conversion(TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION auto_resolve_hotel_from_code() SET search_path = public, pg_temp;
ALTER FUNCTION get_hotel_dashboard_stats(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION get_hotel_top_activities(UUID, INT) SET search_path = public, pg_temp;
ALTER FUNCTION get_provider_attribution_stats(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION get_provider_activity_performance(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION get_platform_stats() SET search_path = public, pg_temp;
ALTER FUNCTION notify_on_reservation_change() SET search_path = public, pg_temp;
ALTER FUNCTION submit_activity_for_review(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION review_activity_submission(UUID, BOOLEAN, TEXT) SET search_path = public, pg_temp;
