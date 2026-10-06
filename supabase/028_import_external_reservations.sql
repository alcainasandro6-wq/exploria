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
