-- Security hardening.
--
-- The app talks to Supabase from the browser with a PUBLIC anon key, so every
-- RLS policy is directly reachable through the REST API. Several policies
-- allowed owners to UPDATE/INSERT *any* column of their own row, which allowed:
--   * a user to set profiles.role = 'admin' on themselves (full takeover)
--   * anyone to sign up with role 'admin' via signUp({ options: { data: { role } } })
--   * a provider to set their own commission_rate / is_verified / tier
--   * a customer to insert a reservation with total_price = 0 or payment_status = 'paid'
--   * a provider to publish an activity directly, skipping admin review
--   * a customer to post reviews for activities they never booked
-- These triggers lock the sensitive columns for ordinary users. Admins, the
-- service role (server actions / webhooks) and SECURITY DEFINER functions are
-- unaffected.

-- True when the caller is NOT an ordinary end user going through the REST API.
CREATE OR REPLACE FUNCTION is_privileged_actor()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NULL
      OR current_user NOT IN ('authenticated', 'anon')
      OR is_admin();
$$ LANGUAGE SQL STABLE;

-- ---------------------------------------------------------------------------
-- 1. Signup can no longer choose its own role.
--    Role now comes ONLY from app_metadata (settable by the server/admin API),
--    never from user_metadata (settable by the user).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := NEW.raw_app_meta_data->>'role';
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('customer', 'hotel', 'provider', 'admin') THEN
    v_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role::user_role,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'es')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. profiles: role / email / id are not user-editable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_privileged_actor() THEN
    NEW.id := OLD.id;
    NEW.role := OLD.role;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_profile_update ON profiles;
CREATE TRIGGER a0_guard_profile_update BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_update();

-- ---------------------------------------------------------------------------
-- 3. providers / hotels: money- and trust-related columns are admin-only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_provider_write()
RETURNS TRIGGER AS $$
BEGIN
  IF is_privileged_actor() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    -- Only an account that an admin already made a provider may own a provider row.
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'provider') THEN
      RAISE EXCEPTION 'Not allowed';
    END IF;
    NEW.commission_rate := 0.05;
    NEW.is_verified := FALSE;
    NEW.is_active := TRUE;
    NEW.tier := 'registered';
    NEW.internal_notes := NULL;
    NEW.stripe_connect_account_id := NULL;
    NEW.stripe_connect_onboarded := FALSE;
    NEW.referred_by_provider_id := NULL;
  ELSE
    NEW.profile_id := OLD.profile_id;
    NEW.commission_rate := OLD.commission_rate;
    NEW.is_verified := OLD.is_verified;
    NEW.is_active := OLD.is_active;
    NEW.tier := OLD.tier;
    NEW.internal_notes := OLD.internal_notes;
    NEW.stripe_connect_account_id := OLD.stripe_connect_account_id;
    NEW.stripe_connect_onboarded := OLD.stripe_connect_onboarded;
    NEW.referred_by_provider_id := OLD.referred_by_provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_provider_write ON providers;
CREATE TRIGGER a0_guard_provider_write BEFORE INSERT OR UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION guard_provider_write();

CREATE OR REPLACE FUNCTION guard_hotel_write()
RETURNS TRIGGER AS $$
BEGIN
  IF is_privileged_actor() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hotel') THEN
      RAISE EXCEPTION 'Not allowed';
    END IF;
    NEW.commission_rate := 0.08;
    NEW.is_active := TRUE;
  ELSE
    NEW.profile_id := OLD.profile_id;
    NEW.commission_rate := OLD.commission_rate;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_hotel_write ON hotels;
CREATE TRIGGER a0_guard_hotel_write BEFORE INSERT OR UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION guard_hotel_write();

-- ---------------------------------------------------------------------------
-- 4. reservations: price, payment and ownership are computed by the server,
--    never taken from the client.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_reservation_write()
RETURNS TRIGGER AS $$
DECLARE
  v_act RECORD;
BEGIN
  IF is_privileged_actor() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT provider_id, price_from, min_participants, max_participants
      INTO v_act
      FROM activities
      WHERE id = NEW.activity_id AND status = 'published';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Activity not available';
    END IF;
    IF NEW.participants IS NULL OR NEW.participants < v_act.min_participants OR NEW.participants > v_act.max_participants THEN
      RAISE EXCEPTION 'Invalid number of participants';
    END IF;
    IF NEW.activity_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Activity date is in the past';
    END IF;

    NEW.customer_id := auth.uid();
    NEW.provider_id := v_act.provider_id;
    NEW.total_price := ROUND(v_act.price_from * NEW.participants, 2);
    NEW.status := 'pending';
    NEW.payment_status := 'unpaid';
    NEW.stripe_payment_intent_id := NULL;
    NEW.hotel_commission := 0;
    NEW.platform_commission := 0;
    NEW.hotel_id := NULL;           -- re-resolved from affiliate_code by auto_resolve_hotel_from_code
    NEW.provider_notes := NULL;
  ELSE
    NEW.customer_id := OLD.customer_id;
    NEW.provider_id := OLD.provider_id;
    NEW.activity_id := OLD.activity_id;
    NEW.hotel_id := OLD.hotel_id;
    NEW.affiliate_code := OLD.affiliate_code;
    NEW.total_price := OLD.total_price;
    NEW.participants := OLD.participants;
    NEW.payment_status := OLD.payment_status;
    NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
    NEW.hotel_commission := OLD.hotel_commission;
    NEW.platform_commission := OLD.platform_commission;
    NEW.confirmation_code := OLD.confirmation_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_reservation_write ON reservations;
CREATE TRIGGER a0_guard_reservation_write BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION guard_reservation_write();

-- ---------------------------------------------------------------------------
-- 5. reviews: only for your own completed booking, and not self-moderated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_review_write()
RETURNS TRIGGER AS $$
BEGIN
  IF is_privileged_actor() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = NEW.reservation_id
        AND r.customer_id = auth.uid()
        AND r.activity_id = NEW.activity_id
        AND r.status = 'completed'
    ) THEN
      RAISE EXCEPTION 'You can only review your own completed bookings';
    END IF;
    NEW.customer_id := auth.uid();
    NEW.is_verified := TRUE;
    NEW.is_published := TRUE;
  ELSE
    NEW.activity_id := OLD.activity_id;
    NEW.customer_id := OLD.customer_id;
    NEW.reservation_id := OLD.reservation_id;
    NEW.is_verified := OLD.is_verified;
    NEW.is_published := OLD.is_published;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_review_write ON reviews;
CREATE TRIGGER a0_guard_review_write BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION guard_review_write();

-- ---------------------------------------------------------------------------
-- 6. activities: providers cannot self-publish, self-feature or fake stats.
--    Publishing only happens through review_activity_submission() (admin).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_activity_write()
RETURNS TRIGGER AS $$
BEGIN
  IF is_privileged_actor() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft', 'pending_review') THEN
      NEW.status := 'draft';
    END IF;
    NEW.featured := FALSE;
    NEW.rating := 0;
    NEW.review_count := 0;
    NEW.booking_count := 0;
    NEW.admin_feedback := NULL;
  ELSE
    NEW.provider_id := OLD.provider_id;
    NEW.featured := OLD.featured;
    NEW.rating := OLD.rating;
    NEW.review_count := OLD.review_count;
    NEW.booking_count := OLD.booking_count;
    NEW.admin_feedback := OLD.admin_feedback;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF OLD.status = 'suspended' THEN
        RAISE EXCEPTION 'A suspended activity can only be reinstated by an admin';
      END IF;
      IF NEW.status NOT IN ('draft', 'pending_review', 'archived') THEN
        RAISE EXCEPTION 'Only an admin can publish an activity';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_activity_write ON activities;
CREATE TRIGGER a0_guard_activity_write BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION guard_activity_write();

-- ---------------------------------------------------------------------------
-- 7. messages / notifications: recipients can only flip the read flag.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Recipients can mark messages read" ON messages;
CREATE POLICY "Recipients can mark messages read" ON messages
  FOR UPDATE USING (to_id = auth.uid());

CREATE OR REPLACE FUNCTION guard_message_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_privileged_actor() THEN
    NEW.from_id := OLD.from_id;
    NEW.to_id := OLD.to_id;
    NEW.reservation_id := OLD.reservation_id;
    NEW.subject := OLD.subject;
    NEW.body := OLD.body;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a0_guard_message_update ON messages;
CREATE TRIGGER a0_guard_message_update BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION guard_message_update();

-- ---------------------------------------------------------------------------
-- 8. Public "become a provider" form: bound the size of what anonymous
--    visitors can store (the insert policy itself must stay open).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_applications') THEN
    BEGIN
      ALTER TABLE provider_applications
        ADD CONSTRAINT provider_applications_size_check CHECK (
          char_length(company_name) <= 200 AND char_length(contact_name) <= 200 AND
          char_length(email) <= 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
          char_length(COALESCE(phone, '')) <= 50 AND char_length(COALESCE(website, '')) <= 300 AND
          char_length(COALESCE(activities_description, '')) <= 3000 AND
          char_length(COALESCE(referral_code, '')) <= 50
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
