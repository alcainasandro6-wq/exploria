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
