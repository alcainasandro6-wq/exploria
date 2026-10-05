-- Foundational schema for the marketplace-operations build-out: provider
-- tiers, incident management, settlement/payout tracking on commissions,
-- provider-to-provider referrals, and payment tracking on reservations.
-- Split into several ALTER TYPE ... ADD VALUE statements up front (each
-- needs its own transaction before the new value can be referenced).

CREATE TYPE provider_tier AS ENUM ('registered', 'verified', 'premium');

CREATE TYPE incident_type AS ENUM (
  'provider_cancelled', 'customer_no_show', 'different_activity',
  'weather', 'overbooking', 'refund_requested', 'reschedule',
  'poor_experience', 'other'
);

CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

CREATE TYPE reservation_payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'partially_refunded');

ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'liquidable';
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'held';
