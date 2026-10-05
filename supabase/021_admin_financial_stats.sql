-- =====================================================================
-- 021: Admin financial stats
-- Sales/commission/payout KPIs + "top activities"/"top destinations" for
-- the new "Financiero" section of the admin dashboard home, plus the
-- data the /dashboard/admin/settlements page groups by provider/hotel.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Money-flow note (read before touching the math below):
-- create_commission_record() (schema.sql) inserts one commissions row per
-- confirmed reservation with:
--   total_amount = hotel_commission_amount + platform_commission_amount
-- i.e. commissions.total_amount is the platform's *combined take* from the
-- booking (what it keeps + what it owes the referring hotel) — it is NOT
-- the reservation's total_price. That means a formula like
--   total_amount - platform_commission_amount - hotel_commission_amount
-- always evaluates to 0 and cannot be "money pending payout to providers".
-- The amount actually owed back to the provider who ran the activity is
-- what's left of the sale after both cuts:
--   reservations.total_price - commissions.total_amount
-- "Pending to hotels" is simply the not-yet-paid hotel_commission_amount.
-- ---------------------------------------------------------------------

-- All date filters below operate on reservations.booking_date (the date
-- the sale/transaction happened), which is what "sales today" / "sales
-- this month" naturally mean — as opposed to activity_date (when the
-- experience takes place). sales_today / sales_this_month are always
-- evaluated against the real calendar regardless of p_from/p_to (those
-- two only scope the range-based metrics); city/provider filters apply
-- to every metric.

CREATE OR REPLACE FUNCTION get_admin_financial_stats(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_provider_id UUID DEFAULT NULL
)
RETURNS TABLE (
  sales_today                NUMERIC,
  sales_this_month           NUMERIC,
  avg_ticket                 NUMERIC,
  platform_commission_earned NUMERIC,
  pending_to_providers       NUMERIC,
  pending_to_hotels          NUMERIC,
  cancellations_count        BIGINT,
  refunds_count               BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COALESCE(SUM(r.total_price), 0)
       FROM reservations r
       JOIN activities a ON a.id = r.activity_id
      WHERE r.booking_date = CURRENT_DATE
        AND r.status NOT IN ('cancelled', 'rejected')
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS sales_today,

    (SELECT COALESCE(SUM(r.total_price), 0)
       FROM reservations r
       JOIN activities a ON a.id = r.activity_id
      WHERE r.booking_date >= date_trunc('month', CURRENT_DATE)::DATE
        AND r.status NOT IN ('cancelled', 'rejected')
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS sales_this_month,

    (SELECT COALESCE(AVG(r.total_price), 0)
       FROM reservations r
       JOIN activities a ON a.id = r.activity_id
      WHERE r.status NOT IN ('cancelled', 'rejected')
        AND (p_from IS NULL OR r.booking_date >= p_from)
        AND (p_to   IS NULL OR r.booking_date <= p_to)
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS avg_ticket,

    (SELECT COALESCE(SUM(c.platform_commission_amount), 0)
       FROM commissions c
       JOIN reservations r ON r.id = c.reservation_id
       JOIN activities a ON a.id = r.activity_id
      WHERE (p_from IS NULL OR r.booking_date >= p_from)
        AND (p_to   IS NULL OR r.booking_date <= p_to)
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS platform_commission_earned,

    (SELECT COALESCE(SUM(r.total_price - c.total_amount), 0)
       FROM commissions c
       JOIN reservations r ON r.id = c.reservation_id
       JOIN activities a ON a.id = r.activity_id
      WHERE c.status IN ('pending', 'liquidable')
        AND (p_from IS NULL OR r.booking_date >= p_from)
        AND (p_to   IS NULL OR r.booking_date <= p_to)
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS pending_to_providers,

    (SELECT COALESCE(SUM(c.hotel_commission_amount), 0)
       FROM commissions c
       JOIN reservations r ON r.id = c.reservation_id
       JOIN activities a ON a.id = r.activity_id
      WHERE c.status IN ('pending', 'liquidable')
        AND (p_from IS NULL OR r.booking_date >= p_from)
        AND (p_to   IS NULL OR r.booking_date <= p_to)
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS pending_to_hotels,

    (SELECT COUNT(*)
       FROM reservations r
       JOIN activities a ON a.id = r.activity_id
      WHERE r.status = 'cancelled'
        AND (p_from IS NULL OR r.booking_date >= p_from)
        AND (p_to   IS NULL OR r.booking_date <= p_to)
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS cancellations_count,

    (SELECT COUNT(*)
       FROM reservations r
       JOIN activities a ON a.id = r.activity_id
      WHERE r.payment_status IN ('refunded', 'partially_refunded')
        AND (p_from IS NULL OR r.booking_date >= p_from)
        AND (p_to   IS NULL OR r.booking_date <= p_to)
        AND (p_city IS NULL OR a.city = p_city)
        AND (p_provider_id IS NULL OR r.provider_id = p_provider_id)
    ) AS refunds_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_admin_financial_stats(DATE, DATE, TEXT, UUID) SET search_path = public, pg_temp;

-- =====================================================================
-- Top-N activities and destinations by revenue, same date/city scoping.
-- =====================================================================

CREATE OR REPLACE FUNCTION get_admin_top_activities(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  activity_id        UUID,
  title               TEXT,
  city                TEXT,
  reservations_count  BIGINT,
  revenue             NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.city,
    COUNT(r.id)                      AS reservations_count,
    COALESCE(SUM(r.total_price), 0)  AS revenue
  FROM reservations r
  JOIN activities a ON a.id = r.activity_id
  WHERE r.status NOT IN ('cancelled', 'rejected')
    AND (p_from IS NULL OR r.booking_date >= p_from)
    AND (p_to   IS NULL OR r.booking_date <= p_to)
    AND (p_city IS NULL OR a.city = p_city)
  GROUP BY a.id, a.title, a.city
  ORDER BY revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_admin_top_activities(DATE, DATE, TEXT, INT) SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_admin_top_destinations(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  city                TEXT,
  reservations_count  BIGINT,
  revenue             NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.city,
    COUNT(r.id)                      AS reservations_count,
    COALESCE(SUM(r.total_price), 0)  AS revenue
  FROM reservations r
  JOIN activities a ON a.id = r.activity_id
  WHERE r.status NOT IN ('cancelled', 'rejected')
    AND (p_from IS NULL OR r.booking_date >= p_from)
    AND (p_to   IS NULL OR r.booking_date <= p_to)
  GROUP BY a.city
  ORDER BY revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_admin_top_destinations(DATE, DATE, INT) SET search_path = public, pg_temp;
