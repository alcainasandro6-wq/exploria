-- ================================================================
-- Admin activity workflow: admins publish directly (no subscription
-- gate, no approval detour) and can manage any provider's photos.
-- Also adds the TuriTop calendar-embed fields (global company code
-- per provider + per-activity service code).
-- ================================================================

-- 1. Admin bypasses the subscription/quota gate when publishing.
-- Providers still can't self-publish (enforced in the TS server
-- actions, unchanged) — this only widens what the DB trigger allows
-- when the calling session is an admin.
CREATE OR REPLACE FUNCTION enforce_subscription_on_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND NOT is_admin() THEN
    IF NOT provider_has_active_subscription(NEW.provider_id) THEN
      RAISE EXCEPTION 'Provider subscription is not active. Upgrade to publish activities.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Admin can upload/delete photos in ANY provider's storage folder,
-- not just their own (there is no "admin's own provider" folder).
DROP POLICY IF EXISTS "Provider can upload their own activity images" ON storage.objects;
CREATE POLICY "Provider can upload their own activity images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('activity-images', 'provider-logos')
    AND (
      (storage.foldername(name))[1] IN (SELECT id::TEXT FROM providers WHERE profile_id = auth.uid())
      OR is_admin()
    )
  );

DROP POLICY IF EXISTS "Provider can delete their own activity images" ON storage.objects;
CREATE POLICY "Provider can delete their own activity images" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('activity-images', 'provider-logos')
    AND (
      (storage.foldername(name))[1] IN (SELECT id::TEXT FROM providers WHERE profile_id = auth.uid())
      OR is_admin()
    )
  );

-- 3. TuriTop calendar embed — a global per-provider company code plus
-- a per-activity service code (see help.turitop.com widget install docs:
-- one <script data-company> per site, one <div data-service> per activity).
ALTER TABLE providers  ADD COLUMN IF NOT EXISTS turitop_company_code TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS turitop_service_code TEXT;
