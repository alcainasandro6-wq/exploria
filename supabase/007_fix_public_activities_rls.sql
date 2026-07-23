-- ================================================================
-- FIX — public visitors could never see ANY published activity
-- ================================================================
-- The original "Anyone can view published activities" policy checks
-- subscription status with a raw subquery on `provider_subscriptions`:
--
--   provider_id IN (
--     SELECT p.id FROM providers p
--     JOIN provider_subscriptions ps ON ps.provider_id = p.id
--     WHERE ps.status = 'active' AND ps.current_period_end > NOW()
--   )
--
-- `provider_subscriptions` has its OWN row-level security, which only
-- lets a provider see their own subscription (profile_id = auth.uid())
-- or an admin see everything. An anonymous/public visitor has neither,
-- so that subquery always returns zero rows for them — meaning the
-- outer policy blocks every activity for every logged-out visitor,
-- regardless of whether the provider's subscription is actually active.
--
-- The fix: use the existing provider_has_active_subscription() helper
-- instead, which is SECURITY DEFINER and therefore evaluates the
-- subscription status with the function owner's privileges, bypassing
-- provider_subscriptions' RLS the same way the enforce_subscription_*
-- triggers already do.
-- ================================================================

DROP POLICY IF EXISTS "Anyone can view published activities" ON activities;

CREATE POLICY "Anyone can view published activities" ON activities
  FOR SELECT USING (
    status = 'published'
    AND provider_has_active_subscription(provider_id)
  );
