-- =====================================================
-- BookActivities v3 — Product template, service-approval workflow,
-- coupons/loyalty. Run AFTER 004_backend_v2.sql
-- =====================================================

-- =====================================================
-- 0. REBRAND: default base URL + confirmation code prefix
-- =====================================================

CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := 'BKA-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_hotel_tracking_url(p_affiliate_code TEXT, p_base_url TEXT DEFAULT 'https://bookactivities.com')
RETURNS TEXT AS $$
BEGIN
  RETURN p_base_url || '/en/activities?ref=' || p_affiliate_code || '&source=qr';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 1. ACTIVITY TEMPLATE FIELDS (Airbnb-style product page)
-- =====================================================

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS faqs JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS extra_info JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS booking_widget_embed_code TEXT,
  ADD COLUMN IF NOT EXISTS external_booking_platform TEXT
    CHECK (external_booking_platform IS NULL OR external_booking_platform IN (
      'bokun', 'turitop', 'civitatis', 'getyourguide', 'clickandboat', 'other'
    )),
  ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN activities.translations IS 'DeepL-generated translations, keyed by locale: { en: { title, short_description, description }, ... }';

COMMENT ON COLUMN activities.faqs IS 'Array of {question, answer}';
COMMENT ON COLUMN activities.extra_info IS 'Array of {title, content} freeform sections';
COMMENT ON COLUMN activities.booking_widget_embed_code IS 'Raw shortcode/iframe HTML pasted by the provider from Bokun/TuriTop/Civitatis/GetYourGuide/ClickAndBoat. Sanitized at render time — never rendered unescaped without an iframe sandbox.';

-- =====================================================
-- 2. SERVICE APPROVAL WORKFLOW
-- =====================================================

ALTER TYPE activity_status ADD VALUE IF NOT EXISTS 'pending_review';

-- =====================================================
-- 3. COUPONS / LOYALTY
-- =====================================================

CREATE TYPE coupon_discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type coupon_discount_type NOT NULL DEFAULT 'percent',
  value DECIMAL(10,2) NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN coupons.customer_id IS 'NULL = public/global coupon visible to every customer. Set = personal promo for that customer only.';

CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_coupons_customer_id ON coupons(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer can view public and their own coupons" ON coupons;
CREATE POLICY "Customer can view public and their own coupons" ON coupons
  FOR SELECT USING (
    is_active = TRUE
    AND (customer_id IS NULL OR customer_id = auth.uid())
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW())
  );

DROP POLICY IF EXISTS "Admin can manage all coupons" ON coupons;
CREATE POLICY "Admin can manage all coupons" ON coupons
  FOR ALL USING (is_admin());

-- =====================================================
-- 4. SERVICE APPROVAL: admin queue helper
-- =====================================================

CREATE OR REPLACE FUNCTION submit_activity_for_review(p_activity_id UUID)
RETURNS activities AS $$
DECLARE
  v_activity activities;
BEGIN
  UPDATE activities
  SET status = 'pending_review', admin_feedback = NULL, updated_at = NOW()
  WHERE id = p_activity_id
    AND provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
    AND status IN ('draft', 'pending_review')
  RETURNING * INTO v_activity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or not owned by the current provider';
  END IF;

  RETURN v_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION review_activity_submission(
  p_activity_id UUID,
  p_approve BOOLEAN,
  p_feedback TEXT DEFAULT NULL
) RETURNS activities AS $$
DECLARE
  v_activity activities;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can review service submissions';
  END IF;

  UPDATE activities
  SET
    status = CASE WHEN p_approve THEN 'published' ELSE 'draft' END,
    admin_feedback = p_feedback,
    updated_at = NOW()
  WHERE id = p_activity_id AND status = 'pending_review'
  RETURNING * INTO v_activity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or not pending review';
  END IF;

  RETURN v_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. STORAGE BUCKETS (photos/video for activities, provider logos)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', TRUE), ('provider-logos', 'provider-logos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {provider_id}/{activity_id}/{filename}. Public can read
-- (activity photos are public marketing assets); only the owning provider
-- can write into their own provider_id folder.
DROP POLICY IF EXISTS "Anyone can view activity images" ON storage.objects;
CREATE POLICY "Anyone can view activity images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('activity-images', 'provider-logos'));

DROP POLICY IF EXISTS "Provider can upload their own activity images" ON storage.objects;
CREATE POLICY "Provider can upload their own activity images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('activity-images', 'provider-logos')
    AND (storage.foldername(name))[1] IN (SELECT id::TEXT FROM providers WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Provider can delete their own activity images" ON storage.objects;
CREATE POLICY "Provider can delete their own activity images" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('activity-images', 'provider-logos')
    AND (storage.foldername(name))[1] IN (SELECT id::TEXT FROM providers WHERE profile_id = auth.uid())
  );

-- =====================================================
-- 6. PUBLIC REVIEW AUTHOR NAMES
-- profiles has no public SELECT policy (by design — phone/email are
-- private), but review author name/avatar need to be visible on the
-- public product page. Expose only those two columns, scoped to people
-- who have an actual published review, via a definer-style view.
-- =====================================================

CREATE OR REPLACE VIEW public_review_authors AS
SELECT p.id, p.full_name, p.avatar_url
FROM profiles p
WHERE p.id IN (SELECT customer_id FROM reviews WHERE is_published = TRUE);

GRANT SELECT ON public_review_authors TO anon, authenticated;

COMMIT;
