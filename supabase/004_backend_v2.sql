-- =====================================================
-- EXPLORIA v2 — Backend business logic layer
-- Run AFTER schema.sql
-- =====================================================

-- =====================================================
-- 1. SCHEMA EXTENSIONS
-- =====================================================

-- Extend reservation_status enum
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add missing columns to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web'
    CHECK (source IN ('qr', 'web', 'direct')),
  ADD COLUMN IF NOT EXISTS provider_notes TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Add tracking_url to hotels (QR landing URL)
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Index for source tracking
CREATE INDEX IF NOT EXISTS idx_reservations_source ON reservations(source);
CREATE INDEX IF NOT EXISTS idx_reservations_activity_date ON reservations(activity_date);

-- =====================================================
-- 2. HELPER FUNCTIONS
-- =====================================================

-- Check if a provider has an active subscription
CREATE OR REPLACE FUNCTION provider_has_active_subscription(p_provider_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM provider_subscriptions
    WHERE provider_id = p_provider_id
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get hotel_id from affiliate_code
CREATE OR REPLACE FUNCTION get_hotel_by_affiliate_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_hotel_id UUID;
BEGIN
  SELECT id INTO v_hotel_id
  FROM hotels
  WHERE affiliate_code = p_code AND is_active = TRUE;
  RETURN v_hotel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Generate tracking URL for a hotel
CREATE OR REPLACE FUNCTION generate_hotel_tracking_url(p_affiliate_code TEXT, p_base_url TEXT DEFAULT 'https://exploria.es')
RETURNS TEXT AS $$
BEGIN
  RETURN p_base_url || '/en/activities?ref=' || p_affiliate_code || '&source=qr';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 3. RESERVATION STATE MACHINE
-- =====================================================

-- Validate status transitions (called by trigger or API)
CREATE OR REPLACE FUNCTION validate_reservation_transition(
  p_old_status reservation_status,
  p_new_status reservation_status,
  p_actor_role user_role,
  p_is_own_reservation BOOLEAN DEFAULT FALSE,
  p_is_own_provider BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN AS $$
DECLARE
  v_allowed_statuses reservation_status[];
BEGIN
  -- Define valid transitions per current status
  v_allowed_statuses := CASE p_old_status
    WHEN 'pending'   THEN ARRAY['confirmed', 'rejected', 'cancelled']::reservation_status[]
    WHEN 'confirmed' THEN ARRAY['cancelled', 'completed', 'no_show']::reservation_status[]
    ELSE ARRAY[]::reservation_status[]
  END;

  -- Transition must be in the allowed list
  IF NOT (p_new_status = ANY(v_allowed_statuses)) THEN
    RETURN FALSE;
  END IF;

  -- Authorization per role + transition
  CASE
    -- Admin can do anything valid
    WHEN p_actor_role = 'admin' THEN RETURN TRUE;

    -- Provider confirms/rejects pending, or marks completed/no_show for confirmed
    WHEN p_actor_role = 'provider' AND p_is_own_provider THEN
      RETURN p_new_status IN ('confirmed', 'rejected', 'completed', 'no_show', 'cancelled');

    -- Customer can only cancel their own reservation
    WHEN p_actor_role = 'customer' AND p_is_own_reservation THEN
      RETURN p_new_status = 'cancelled';

    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Perform state transition (SECURITY DEFINER = runs as owner, bypasses RLS for the update)
CREATE OR REPLACE FUNCTION transition_reservation(
  p_reservation_id UUID,
  p_new_status reservation_status,
  p_notes TEXT DEFAULT NULL
) RETURNS reservations AS $$
DECLARE
  v_res reservations;
  v_actor_id UUID := auth.uid();
  v_actor_role user_role;
  v_is_own_reservation BOOLEAN;
  v_is_own_provider BOOLEAN;
BEGIN
  -- Load reservation
  SELECT * INTO v_res FROM reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;

  -- Load actor role
  SELECT role INTO v_actor_role FROM profiles WHERE id = v_actor_id;

  v_is_own_reservation := v_res.customer_id = v_actor_id;
  v_is_own_provider := EXISTS (
    SELECT 1 FROM providers WHERE id = v_res.provider_id AND profile_id = v_actor_id
  );

  -- Validate
  IF NOT validate_reservation_transition(
    v_res.status, p_new_status, v_actor_role, v_is_own_reservation, v_is_own_provider
  ) THEN
    RAISE EXCEPTION 'Unauthorized status transition from % to % for role %',
      v_res.status, p_new_status, v_actor_role;
  END IF;

  -- Apply transition
  UPDATE reservations SET
    status           = p_new_status,
    provider_notes   = COALESCE(p_notes, provider_notes),
    confirmed_at     = CASE WHEN p_new_status = 'confirmed' THEN NOW() ELSE confirmed_at END,
    completed_at     = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END,
    cancelled_at     = CASE WHEN p_new_status = 'cancelled' THEN NOW() ELSE cancelled_at END,
    rejected_at      = CASE WHEN p_new_status = 'rejected'  THEN NOW() ELSE rejected_at END,
    updated_at       = NOW()
  WHERE id = p_reservation_id
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. SUBSCRIPTION ENFORCEMENT TRIGGERS
-- =====================================================

-- Block activity INSERT/UPDATE to published if provider has no active subscription
CREATE OR REPLACE FUNCTION enforce_subscription_on_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce when trying to set status = 'published'
  IF NEW.status = 'published' THEN
    IF NOT provider_has_active_subscription(NEW.provider_id) THEN
      RAISE EXCEPTION 'Provider subscription is not active. Upgrade to publish activities.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_subscription_on_activity_insert ON activities;
CREATE TRIGGER enforce_subscription_on_activity_insert
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION enforce_subscription_on_activity();

-- Block reservation INSERT if provider subscription is inactive
CREATE OR REPLACE FUNCTION enforce_subscription_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT provider_has_active_subscription(NEW.provider_id) THEN
    RAISE EXCEPTION 'This activity is not currently accepting reservations.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_subscription_on_reservation_insert ON reservations;
CREATE TRIGGER enforce_subscription_on_reservation_insert
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION enforce_subscription_on_reservation();

-- When subscription becomes inactive → suspend all published activities
CREATE OR REPLACE FUNCTION handle_subscription_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'trialing') AND OLD.status IN ('active', 'trialing') THEN
    UPDATE activities
    SET status = 'suspended', updated_at = NOW()
    WHERE provider_id = NEW.provider_id AND status = 'published';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS subscription_deactivation_trigger ON provider_subscriptions;
CREATE TRIGGER subscription_deactivation_trigger
  AFTER UPDATE OF status ON provider_subscriptions
  FOR EACH ROW EXECUTE FUNCTION handle_subscription_deactivation();

-- =====================================================
-- 5. ATTRIBUTION TRACKING
-- =====================================================

-- Track affiliate_link clicks
CREATE OR REPLACE FUNCTION track_affiliate_click(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links
  SET clicks = clicks + 1
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track affiliate_link conversions (called after reservation confirmed)
CREATE OR REPLACE FUNCTION track_affiliate_conversion(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links
  SET conversions = conversions + 1
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-resolve hotel_id from affiliate_code on reservation insert
CREATE OR REPLACE FUNCTION auto_resolve_hotel_from_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.affiliate_code IS NOT NULL AND NEW.hotel_id IS NULL THEN
    NEW.hotel_id := get_hotel_by_affiliate_code(NEW.affiliate_code);
    -- Track the click/conversion
    PERFORM track_affiliate_conversion(NEW.affiliate_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_resolve_hotel_trigger ON reservations;
CREATE TRIGGER auto_resolve_hotel_trigger
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION auto_resolve_hotel_from_code();

-- =====================================================
-- 6. DASHBOARD QUERY FUNCTIONS
-- =====================================================

-- Hotel dashboard: attributed reservation stats
CREATE OR REPLACE FUNCTION get_hotel_dashboard_stats(p_hotel_id UUID)
RETURNS TABLE (
  total_reservations     BIGINT,
  confirmed_reservations BIGINT,
  pending_reservations   BIGINT,
  completed_reservations BIGINT,
  total_participants     BIGINT,
  estimated_commission   NUMERIC,
  qr_conversions         BIGINT,
  web_conversions        BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)                                                          AS total_reservations,
    COUNT(*) FILTER (WHERE r.status = 'confirmed')                    AS confirmed_reservations,
    COUNT(*) FILTER (WHERE r.status = 'pending')                      AS pending_reservations,
    COUNT(*) FILTER (WHERE r.status = 'completed')                    AS completed_reservations,
    COALESCE(SUM(r.participants), 0)                                  AS total_participants,
    COALESCE(SUM(r.hotel_commission), 0)                              AS estimated_commission,
    COUNT(*) FILTER (WHERE r.source = 'qr')                          AS qr_conversions,
    COUNT(*) FILTER (WHERE r.source = 'web')                         AS web_conversions
  FROM reservations r
  WHERE r.hotel_id = p_hotel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Hotel dashboard: top activities
CREATE OR REPLACE FUNCTION get_hotel_top_activities(p_hotel_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
  activity_id    UUID,
  activity_title TEXT,
  total_bookings BIGINT,
  total_participants BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    COUNT(r.id)         AS total_bookings,
    SUM(r.participants) AS total_participants
  FROM reservations r
  JOIN activities a ON a.id = r.activity_id
  WHERE r.hotel_id = p_hotel_id
    AND r.status NOT IN ('cancelled', 'rejected')
  GROUP BY a.id, a.title
  ORDER BY total_bookings DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Provider dashboard: reservations by hotel (attribution breakdown)
CREATE OR REPLACE FUNCTION get_provider_attribution_stats(p_provider_id UUID)
RETURNS TABLE (
  hotel_id            UUID,
  hotel_name          TEXT,
  affiliate_code      TEXT,
  total_reservations  BIGINT,
  confirmed           BIGINT,
  participants        BIGINT,
  direct_bookings     BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.name,
    h.affiliate_code,
    COUNT(r.id)                                           AS total_reservations,
    COUNT(r.id) FILTER (WHERE r.status = 'confirmed')    AS confirmed,
    COALESCE(SUM(r.participants), 0)                     AS participants,
    COUNT(r.id) FILTER (WHERE r.hotel_id IS NULL)        AS direct_bookings
  FROM reservations r
  LEFT JOIN hotels h ON h.id = r.hotel_id
  WHERE r.provider_id = p_provider_id
  GROUP BY h.id, h.name, h.affiliate_code
  ORDER BY total_reservations DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Provider dashboard: activity performance
CREATE OR REPLACE FUNCTION get_provider_activity_performance(p_provider_id UUID)
RETURNS TABLE (
  activity_id      UUID,
  activity_title   TEXT,
  total_bookings   BIGINT,
  confirmed        BIGINT,
  completed        BIGINT,
  cancelled        BIGINT,
  total_participants BIGINT,
  avg_rating       NUMERIC,
  hotel_attributed BIGINT,
  direct_bookings  BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    COUNT(r.id)                                               AS total_bookings,
    COUNT(r.id) FILTER (WHERE r.status = 'confirmed')        AS confirmed,
    COUNT(r.id) FILTER (WHERE r.status = 'completed')        AS completed,
    COUNT(r.id) FILTER (WHERE r.status = 'cancelled')        AS cancelled,
    COALESCE(SUM(r.participants), 0)                         AS total_participants,
    a.rating,
    COUNT(r.id) FILTER (WHERE r.hotel_id IS NOT NULL)        AS hotel_attributed,
    COUNT(r.id) FILTER (WHERE r.hotel_id IS NULL)            AS direct_bookings
  FROM activities a
  LEFT JOIN reservations r ON r.activity_id = a.id
  WHERE a.provider_id = p_provider_id
  GROUP BY a.id, a.title, a.rating
  ORDER BY total_bookings DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin: global platform stats
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
  total_reservations  BIGINT,
  pending_count       BIGINT,
  confirmed_count     BIGINT,
  completed_count     BIGINT,
  active_providers    BIGINT,
  active_hotels       BIGINT,
  hotel_attributed    BIGINT,
  direct_bookings     BIGINT,
  mrr_eur             NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM reservations)                                   AS total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE status = 'pending')          AS pending_count,
    (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed')        AS confirmed_count,
    (SELECT COUNT(*) FROM reservations WHERE status = 'completed')        AS completed_count,
    (SELECT COUNT(*) FROM providers WHERE is_active = TRUE)               AS active_providers,
    (SELECT COUNT(*) FROM hotels WHERE is_active = TRUE)                  AS active_hotels,
    (SELECT COUNT(*) FROM reservations WHERE hotel_id IS NOT NULL)        AS hotel_attributed,
    (SELECT COUNT(*) FROM reservations WHERE hotel_id IS NULL)            AS direct_bookings,
    (SELECT COALESCE(SUM(sp.price_monthly), 0)
     FROM provider_subscriptions ps
     JOIN subscription_plans sp ON sp.id = ps.plan_id
     WHERE ps.status = 'active')                                          AS mrr_eur;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 7. NOTIFICATIONS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.customer_id,
      'reservation_status_change',
      CASE NEW.status
        WHEN 'confirmed' THEN 'Reserva confirmada'
        WHEN 'rejected'  THEN 'Reserva no disponible'
        WHEN 'cancelled' THEN 'Reserva cancelada'
        WHEN 'completed' THEN 'Actividad completada'
        ELSE 'Actualización de reserva'
      END,
      CASE NEW.status
        WHEN 'confirmed' THEN 'El proveedor ha confirmado tu reserva. Código: ' || NEW.confirmation_code
        WHEN 'rejected'  THEN 'El proveedor no puede atender tu reserva en la fecha solicitada.'
        WHEN 'cancelled' THEN 'Tu reserva ha sido cancelada. Código: ' || NEW.confirmation_code
        WHEN 'completed' THEN 'Esperamos que hayas disfrutado la actividad. ¡Déjanos tu valoración!'
        ELSE 'El estado de tu reserva ha cambiado.'
      END,
      jsonb_build_object(
        'reservation_id', NEW.id,
        'confirmation_code', NEW.confirmation_code,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );

    -- Also notify provider when customer cancels
    IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed') THEN
      INSERT INTO notifications (user_id, type, title, body, data)
      SELECT
        p.profile_id,
        'reservation_cancelled',
        'Reserva cancelada por el cliente',
        'El cliente ha cancelado la reserva ' || NEW.confirmation_code,
        jsonb_build_object('reservation_id', NEW.id, 'confirmation_code', NEW.confirmation_code)
      FROM providers p WHERE p.id = NEW.provider_id;
    END IF;

    -- Notify provider when new reservation arrives
    IF OLD.status IS NULL AND NEW.status = 'pending' THEN
      INSERT INTO notifications (user_id, type, title, body, data)
      SELECT
        p.profile_id,
        'new_reservation',
        'Nueva solicitud de reserva',
        'Tienes una nueva solicitud para ' || (SELECT title FROM activities WHERE id = NEW.activity_id),
        jsonb_build_object('reservation_id', NEW.id, 'confirmation_code', NEW.confirmation_code)
      FROM providers p WHERE p.id = NEW.provider_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_reservation_change ON reservations;
CREATE TRIGGER notify_reservation_change
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW EXECUTE FUNCTION notify_on_reservation_change();

-- =====================================================
-- 8. UPDATED RLS ADDITIONS
-- =====================================================

-- Provider can only INSERT activities if they have active subscription
-- (This is enforced by the trigger above, but also add RLS for defense-in-depth)
-- The existing policy "Provider can manage their own activities" covers UPDATE/DELETE.
-- We add a stricter INSERT policy:

DROP POLICY IF EXISTS "Provider can insert activity with active subscription" ON activities;
CREATE POLICY "Provider can insert activity with active subscription" ON activities
  FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );
-- Note: actual subscription check is in the TRIGGER (more reliable than RLS for complex logic)

-- Customer INSERT reservation: must be logged in AND provider subscription must be active
-- (also enforced by trigger, but RLS provides first-line defense)
DROP POLICY IF EXISTS "Customer can create reservation" ON reservations;
CREATE POLICY "Customer can create reservation" ON reservations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND customer_id = auth.uid()
  );

COMMIT;
