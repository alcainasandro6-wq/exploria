-- =====================================================================
-- EXPLORIA — TODAS LAS MIGRACIONES PENDIENTES (022 + 025 a 030)
-- Pegar ENTERO en Supabase > SQL Editor > Run. Es seguro ejecutarlo varias
-- veces (idempotente). Requiere que ya existan schema.sql y 001-021.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 022 · Solicitudes de proveedor (formulario público /providers)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_application_status') THEN
    CREATE TYPE provider_application_status AS ENUM ('new', 'contacted', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS provider_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  activities_description TEXT,
  website TEXT,
  referral_code TEXT,
  status provider_application_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS provider_applications_updated_at ON provider_applications;
CREATE TRIGGER provider_applications_updated_at BEFORE UPDATE ON provider_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_provider_applications_status ON provider_applications(status);
CREATE INDEX IF NOT EXISTS idx_provider_applications_created_at ON provider_applications(created_at);

ALTER TABLE provider_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a provider application" ON provider_applications;
CREATE POLICY "Anyone can submit a provider application" ON provider_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage provider applications" ON provider_applications;
CREATE POLICY "Admin can manage provider applications" ON provider_applications
  FOR ALL USING (is_admin());

GRANT INSERT ON provider_applications TO anon, authenticated;
GRANT ALL ON provider_applications TO service_role;


-- ---------------------------------------------------------------------
-- 025
-- ---------------------------------------------------------------------
-- Per-provider TuriTop calendar + secure credential storage.
--
-- SECURITY FIX: providers has the RLS policy "Anyone can view active providers"
-- (SELECT USING is_active), so a column like providers.turitop_api_key was
-- readable by ANY visitor through the public REST API. The API key now lives
-- in its own table that only the owning provider and admins can read.

-- Ensure the connection-status columns from 023 exist (safe to re-run).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turitop_connection_status') THEN
    CREATE TYPE turitop_connection_status AS ENUM ('unverified', 'ok', 'error');
  END IF;
END $$;

ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_connection_status turitop_connection_status NOT NULL DEFAULT 'unverified';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_connection_error TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_connected_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS provider_turitop_credentials (
  provider_id UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  api_key     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE provider_turitop_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Provider can manage own turitop credentials" ON provider_turitop_credentials;
CREATE POLICY "Provider can manage own turitop credentials" ON provider_turitop_credentials
  FOR ALL
  USING (provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Admin can manage turitop credentials" ON provider_turitop_credentials;
CREATE POLICY "Admin can manage turitop credentials" ON provider_turitop_credentials
  FOR ALL USING (is_admin());

-- Never expose to anonymous visitors.
REVOKE ALL ON provider_turitop_credentials FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON provider_turitop_credentials TO authenticated, service_role;

-- Non-secret flag so the UI can show "key configured" without reading the key.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_has_key BOOLEAN NOT NULL DEFAULT FALSE;

-- Move any existing keys, then drop the publicly readable column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'turitop_api_key'
  ) THEN
    INSERT INTO provider_turitop_credentials (provider_id, api_key)
      SELECT id, turitop_api_key FROM providers
      WHERE turitop_api_key IS NOT NULL AND turitop_api_key <> ''
    ON CONFLICT (provider_id) DO NOTHING;

    UPDATE providers SET turitop_has_key = TRUE
      WHERE turitop_api_key IS NOT NULL AND turitop_api_key <> '';

    ALTER TABLE providers DROP COLUMN turitop_api_key;
  END IF;
END $$;

-- Maps an Exploria activity to its TuriTop (OCTO) product so the provider's
-- own TuriTop availability can be shown in their calendar.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS turitop_product_id TEXT;


-- ---------------------------------------------------------------------
-- 026
-- ---------------------------------------------------------------------
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
        ) NOT VALID;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 027
-- ---------------------------------------------------------------------
-- Two-way sync with TuriTop: remember which TuriTop booking mirrors an
-- Exploria reservation, so it can be marked paid / deleted later.

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS turitop_booking_id TEXT;
CREATE INDEX IF NOT EXISTS idx_reservations_turitop_booking_id ON reservations(turitop_booking_id);

-- Keep the column server-controlled: ordinary users must not be able to
-- point their reservation at somebody else's TuriTop booking.
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
    NEW.hotel_id := NULL;
    NEW.provider_notes := NULL;
    NEW.turitop_booking_id := NULL;
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
    NEW.turitop_booking_id := OLD.turitop_booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------
-- 028
-- ---------------------------------------------------------------------
-- Import reservations made OUTSIDE Exploria (TuriTop: widget, backoffice,
-- Viator, GetYourGuide, ...) as real rows in `reservations`, so every
-- statistic of the platform counts them.
--
-- Imported rows:
--   * have no Exploria customer account (customer_id is NULL, the customer's
--     name/email are kept in external_customer_*)
--   * never generate platform/hotel commissions (they were not sold by Exploria)
--   * never send notifications and never require an active subscription
--   * are identified by (provider_id, external_id) so re-syncing is idempotent

ALTER TABLE reservations ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_source TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_channel TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_customer_name TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_customer_email TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_customer_phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_external
  ON reservations(provider_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_source_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_source_check
  CHECK (source IN ('qr', 'web', 'direct', 'concierge', 'turitop'));

-- Activities that only exist because a TuriTop booking referenced an
-- un-imported product. Hidden everywhere (archived) until the provider
-- imports that product for real, which upgrades the placeholder in place.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS turitop_placeholder BOOLEAN NOT NULL DEFAULT FALSE;

-- Last time this provider's TuriTop bookings were synchronised.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_last_sync_at TIMESTAMPTZ;

-- ---- Disable the Exploria-only automations for imported rows ----

DROP TRIGGER IF EXISTS enforce_subscription_on_reservation_insert ON reservations;
CREATE TRIGGER enforce_subscription_on_reservation_insert
  BEFORE INSERT ON reservations
  FOR EACH ROW WHEN (NEW.external_source IS NULL)
  EXECUTE FUNCTION enforce_subscription_on_reservation();

DROP TRIGGER IF EXISTS calculate_reservation_commissions ON reservations;
CREATE TRIGGER calculate_reservation_commissions
  BEFORE INSERT ON reservations
  FOR EACH ROW WHEN (NEW.external_source IS NULL)
  EXECUTE FUNCTION calculate_commissions();

DROP TRIGGER IF EXISTS create_commission_on_confirmation ON reservations;
CREATE TRIGGER create_commission_on_confirmation
  AFTER UPDATE ON reservations
  FOR EACH ROW
  WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed' AND NEW.external_source IS NULL)
  EXECUTE FUNCTION create_commission_record();

DROP TRIGGER IF EXISTS notify_reservation_change ON reservations;
CREATE TRIGGER notify_reservation_change
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW WHEN (NEW.external_source IS NULL)
  EXECUTE FUNCTION notify_on_reservation_change();

-- Ordinary users may never set the external_* columns (server-controlled).
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
    NEW.hotel_id := NULL;
    NEW.provider_notes := NULL;
    NEW.turitop_booking_id := NULL;
    NEW.external_source := NULL;
    NEW.external_id := NULL;
    NEW.external_channel := NULL;
    NEW.external_customer_name := NULL;
    NEW.external_customer_email := NULL;
    NEW.external_customer_phone := NULL;
    IF NEW.source = 'turitop' THEN NEW.source := 'web'; END IF;
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
    NEW.turitop_booking_id := OLD.turitop_booking_id;
    NEW.external_source := OLD.external_source;
    NEW.external_id := OLD.external_id;
    NEW.external_channel := OLD.external_channel;
    NEW.external_customer_name := OLD.external_customer_name;
    NEW.external_customer_email := OLD.external_customer_email;
    NEW.external_customer_phone := OLD.external_customer_phone;
    NEW.source := OLD.source;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------
-- 029
-- ---------------------------------------------------------------------
-- Some databases carry extra CHECK constraints on reservations that require a
-- customer (e.g. "reservations_customer_or_guest": customer_id OR guest data).
-- Imported TuriTop bookings have no Exploria customer, so every CHECK that
-- mentions customer_id is rewritten as:   external_source IS NOT NULL OR (<original rule>)
-- Ordinary bookings keep exactly the same rule as before. Safe to re-run.

DO $$
DECLARE
  c RECORD;
  expr TEXT;
BEGIN
  FOR c IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%customer_id%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%external_source%'
  LOOP
    expr := regexp_replace(c.def, '^CHECK ', '');
    expr := regexp_replace(expr, ' NOT VALID$', '');
    EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT %I', c.conname);
    EXECUTE format(
      'ALTER TABLE public.reservations ADD CONSTRAINT %I CHECK (external_source IS NOT NULL OR %s)',
      c.conname, expr
    );
    RAISE NOTICE 'Relaxed constraint % (was %)', c.conname, c.def;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- 030
-- ---------------------------------------------------------------------
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

