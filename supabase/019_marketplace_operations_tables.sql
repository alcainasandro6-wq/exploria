-- Tables and columns built on the types from 018. Must run after 018 commits.

-- =====================================================
-- PROVIDER TIERS + COMMISSION EDITING + STRIPE CONNECT + REFERRALS
-- =====================================================

ALTER TABLE providers ADD COLUMN IF NOT EXISTS tier provider_tier NOT NULL DEFAULT 'registered';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS referred_by_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_providers_referral_code ON providers(referral_code);
CREATE INDEX IF NOT EXISTS idx_providers_referred_by ON providers(referred_by_provider_id);
CREATE INDEX IF NOT EXISTS idx_providers_tier ON providers(tier);

-- =====================================================
-- INCIDENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  type incident_type NOT NULL,
  status incident_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  resolution TEXT,
  refund_amount DECIMAL(10,2),
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_reservation_id ON incidents(reservation_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- =====================================================
-- SETTLEMENT / LIQUIDACIÓN TRACKING ON COMMISSIONS
-- =====================================================

ALTER TABLE commissions ADD COLUMN IF NOT EXISTS liquidable_at TIMESTAMPTZ;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS held_for_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_liquidable_at ON commissions(liquidable_at);

-- =====================================================
-- RESERVATION PAYMENT TRACKING (for centralized checkout)
-- =====================================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status reservation_payment_status NOT NULL DEFAULT 'unpaid';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);

-- 'concierge' = booked by hotel reception on behalf of the guest (existing
-- 'qr'/'web'/'direct' values track how the customer found the booking).
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_source_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_source_check
  CHECK (source IN ('qr', 'web', 'direct', 'concierge'));

-- =====================================================
-- PACKS
-- =====================================================

CREATE TABLE IF NOT EXISTS packs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER packs_updated_at BEFORE UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS pack_activities (
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pack_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_pack_activities_pack_id ON pack_activities(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_activities_activity_id ON pack_activities(activity_id);

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage incidents" ON incidents
  FOR ALL USING (is_admin());

CREATE POLICY "Provider can view incidents on their reservations" ON incidents
  FOR SELECT USING (
    reservation_id IN (
      SELECT r.id FROM reservations r
      JOIN providers p ON p.id = r.provider_id
      WHERE p.profile_id = auth.uid()
    )
  );

CREATE POLICY "Customer can view incidents on their reservations" ON incidents
  FOR SELECT USING (
    reservation_id IN (SELECT id FROM reservations WHERE customer_id = auth.uid())
  );

CREATE POLICY "Anyone can view active packs" ON packs
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admin can manage packs" ON packs
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view pack activities of active packs" ON pack_activities
  FOR SELECT USING (pack_id IN (SELECT id FROM packs WHERE is_active = TRUE));

CREATE POLICY "Admin can manage pack activities" ON pack_activities
  FOR ALL USING (is_admin());
