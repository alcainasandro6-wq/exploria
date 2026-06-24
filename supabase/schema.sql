-- =====================================================
-- EXPLORIA - Complete Supabase Schema
-- Platform: SaaS marketplace for tourist activities in Torrevieja
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('customer', 'hotel', 'provider', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'suspended', 'expired', 'cancelled', 'trialing');
CREATE TYPE subscription_plan AS ENUM ('basic', 'pro', 'premium');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');
CREATE TYPE activity_status AS ENUM ('draft', 'published', 'suspended', 'archived');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE commission_status AS ENUM ('pending', 'paid', 'cancelled');

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  locale TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'es')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CUSTOMERS
-- =====================================================

CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nationality TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- HOTELS
-- =====================================================

CREATE TABLE hotels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Torrevieja',
  country TEXT NOT NULL DEFAULT 'España',
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  website TEXT,
  phone TEXT NOT NULL DEFAULT '',
  tax_id TEXT,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.08,
  affiliate_code TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER hotels_updated_at BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_hotels_affiliate_code ON hotels(affiliate_code);
CREATE INDEX idx_hotels_profile_id ON hotels(profile_id);

-- =====================================================
-- PROVIDERS
-- =====================================================

CREATE TABLE providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Torrevieja',
  country TEXT NOT NULL DEFAULT 'España',
  phone TEXT NOT NULL DEFAULT '',
  tax_id TEXT,
  logo_url TEXT,
  website TEXT,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_providers_profile_id ON providers(profile_id);

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

CREATE TABLE subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name subscription_plan NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2) NOT NULL,
  stripe_price_monthly_id TEXT,
  stripe_price_annual_id TEXT,
  max_activities INTEGER NOT NULL DEFAULT 5,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed subscription plans
INSERT INTO subscription_plans (name, display_name, price_monthly, price_annual, max_activities, features) VALUES
('basic', 'Basic', 49.00, 470.00, 5, '["Hasta 5 actividades publicadas", "Panel de gestión básico", "Soporte por email", "Estadísticas básicas"]'),
('pro', 'Pro', 99.00, 950.00, 20, '["Hasta 20 actividades publicadas", "Posicionamiento mejorado", "Soporte prioritario", "Estadísticas avanzadas", "Calendario de disponibilidad", "Exportación CSV"]'),
('premium', 'Premium', 199.00, 1910.00, -1, '["Actividades ilimitadas", "Máxima visibilidad y destacados", "Soporte VIP 24/7", "Análisis completo de rendimiento", "Badge de proveedor verificado", "Campaña de marketing incluida", "API de integración"]');

-- =====================================================
-- PROVIDER SUBSCRIPTIONS
-- =====================================================

CREATE TABLE provider_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trialing',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER provider_subscriptions_updated_at BEFORE UPDATE ON provider_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_provider_subs_provider_id ON provider_subscriptions(provider_id);
CREATE INDEX idx_provider_subs_stripe_sub_id ON provider_subscriptions(stripe_subscription_id);

-- Function to check if provider has active subscription
CREATE OR REPLACE FUNCTION provider_has_active_subscription(p_provider_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM provider_subscriptions
    WHERE provider_id = p_provider_id
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CATEGORIES
-- =====================================================

CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Deportes acuáticos', 'deportes-acuaticos', '🏄', 1),
('Excursiones en barco', 'excursiones-barco', '⛵', 2),
('Kayak y piragüismo', 'kayak-piraguismo', '🚣', 3),
('Buceo y snorkel', 'buceo-snorkel', '🤿', 4),
('Tours culturales', 'tours-culturales', '🏛️', 5),
('Gastronomía', 'gastronomia', '🍽️', 6),
('Naturaleza y senderismo', 'naturaleza-senderismo', '🌿', 7),
('Vida nocturna', 'vida-nocturna', '🌙', 8);

-- =====================================================
-- ACTIVITIES
-- =====================================================

CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  price_from DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  min_participants INTEGER NOT NULL DEFAULT 1,
  languages TEXT[] NOT NULL DEFAULT ARRAY['es'],
  meeting_point TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  city TEXT NOT NULL DEFAULT 'Torrevieja',
  country TEXT NOT NULL DEFAULT 'España',
  cancellation_policy TEXT NOT NULL,
  included JSONB NOT NULL DEFAULT '[]',
  excluded JSONB NOT NULL DEFAULT '[]',
  requirements JSONB NOT NULL DEFAULT '[]',
  status activity_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INTEGER NOT NULL DEFAULT 0,
  booking_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_activities_provider_id ON activities(provider_id);
CREATE INDEX idx_activities_category_id ON activities(category_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_slug ON activities(slug);
CREATE INDEX idx_activities_city ON activities(city);
CREATE INDEX idx_activities_featured ON activities(featured);

-- =====================================================
-- ACTIVITY IMAGES
-- =====================================================

CREATE TABLE activity_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_images_activity_id ON activity_images(activity_id);

-- =====================================================
-- RESERVATIONS
-- =====================================================

CREATE TABLE reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) NOT NULL,
  booking_date DATE NOT NULL,
  activity_date DATE NOT NULL,
  activity_time TIME NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  hotel_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  affiliate_code TEXT,
  confirmation_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_reservations_activity_id ON reservations(activity_id);
CREATE INDEX idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX idx_reservations_hotel_id ON reservations(hotel_id);
CREATE INDEX idx_reservations_provider_id ON reservations(provider_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_confirmation_code ON reservations(confirmation_code);
CREATE INDEX idx_reservations_affiliate_code ON reservations(affiliate_code);

-- Prevent duplicate reservations (antifraude)
CREATE UNIQUE INDEX idx_no_duplicate_reservations
  ON reservations(customer_id, activity_id, activity_date, activity_time)
  WHERE status NOT IN ('cancelled');

-- =====================================================
-- COMMISSIONS
-- =====================================================

CREATE TABLE commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) NOT NULL,
  hotel_commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status commission_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_hotel_id ON commissions(hotel_id);
CREATE INDEX idx_commissions_provider_id ON commissions(provider_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- =====================================================
-- REVIEWS
-- =====================================================

CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  reservation_id UUID REFERENCES reservations(id) NOT NULL UNIQUE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_activity_id ON reviews(activity_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);

-- Auto-update activity rating on review changes
CREATE OR REPLACE FUNCTION update_activity_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE activities
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
      AND is_published = TRUE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
      AND is_published = TRUE
    )
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_activity_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_activity_rating();

-- =====================================================
-- FAVORITES
-- =====================================================

CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, activity_id)
);

CREATE INDEX idx_favorites_customer_id ON favorites(customer_id);

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_from_id ON messages(from_id);
CREATE INDEX idx_messages_to_id ON messages(to_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- =====================================================
-- AFFILIATE LINKS
-- =====================================================

CREATE TABLE affiliate_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_links_hotel_id ON affiliate_links(hotel_id);
CREATE INDEX idx_affiliate_links_code ON affiliate_links(code);

-- =====================================================
-- BLOG POSTS
-- =====================================================

CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at);

-- =====================================================
-- PAYMENTS (Subscription payments log)
-- =====================================================

CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES provider_subscriptions(id),
  provider_id UUID REFERENCES providers(id) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_provider_id ON payments(provider_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);

-- =====================================================
-- ACTIVITY AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR ALL USING (is_admin());

-- CATEGORIES - Public read
CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (is_admin());

-- SUBSCRIPTION PLANS - Public read
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admin can manage subscription plans" ON subscription_plans
  FOR ALL USING (is_admin());

-- PROVIDERS policies
CREATE POLICY "Anyone can view active providers" ON providers
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Provider can manage their own record" ON providers
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Admin can manage all providers" ON providers
  FOR ALL USING (is_admin());

-- PROVIDER SUBSCRIPTIONS policies
CREATE POLICY "Provider can view their own subscription" ON provider_subscriptions
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin can manage all subscriptions" ON provider_subscriptions
  FOR ALL USING (is_admin());

-- HOTELS policies
CREATE POLICY "Anyone can view active hotels" ON hotels
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Hotel can manage their own record" ON hotels
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Admin can manage all hotels" ON hotels
  FOR ALL USING (is_admin());

-- ACTIVITIES policies
CREATE POLICY "Anyone can view published activities" ON activities
  FOR SELECT USING (
    status = 'published'
    AND provider_id IN (
      SELECT p.id FROM providers p
      JOIN provider_subscriptions ps ON ps.provider_id = p.id
      WHERE ps.status = 'active' AND ps.current_period_end > NOW()
    )
  );

CREATE POLICY "Provider can manage their own activities" ON activities
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin can manage all activities" ON activities
  FOR ALL USING (is_admin());

-- ACTIVITY IMAGES policies
CREATE POLICY "Anyone can view activity images" ON activity_images
  FOR SELECT USING (
    activity_id IN (SELECT id FROM activities WHERE status = 'published')
  );

CREATE POLICY "Provider can manage their activity images" ON activity_images
  FOR ALL USING (
    activity_id IN (
      SELECT a.id FROM activities a
      JOIN providers p ON p.id = a.provider_id
      WHERE p.profile_id = auth.uid()
    )
  );

-- RESERVATIONS policies
CREATE POLICY "Customer can view their own reservations" ON reservations
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customer can create reservations" ON reservations
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Provider can view their reservations" ON reservations
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Provider can update reservation status" ON reservations
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Hotel can view their attributed reservations" ON reservations
  FOR SELECT USING (
    hotel_id IN (SELECT id FROM hotels WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin can manage all reservations" ON reservations
  FOR ALL USING (is_admin());

-- REVIEWS policies
CREATE POLICY "Anyone can view published reviews" ON reviews
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Customer can create and manage their own reviews" ON reviews
  FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Admin can manage all reviews" ON reviews
  FOR ALL USING (is_admin());

-- FAVORITES policies
CREATE POLICY "Customer can manage their own favorites" ON favorites
  FOR ALL USING (customer_id = auth.uid());

-- MESSAGES policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (from_id = auth.uid() OR to_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (from_id = auth.uid());

-- NOTIFICATIONS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can mark their notifications as read" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- COMMISSIONS policies
CREATE POLICY "Hotel can view their commissions" ON commissions
  FOR SELECT USING (
    hotel_id IN (SELECT id FROM hotels WHERE profile_id = auth.uid())
  );

CREATE POLICY "Provider can view their commissions" ON commissions
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin can manage all commissions" ON commissions
  FOR ALL USING (is_admin());

-- AFFILIATE LINKS policies
CREATE POLICY "Hotel can manage their affiliate links" ON affiliate_links
  FOR ALL USING (
    hotel_id IN (SELECT id FROM hotels WHERE profile_id = auth.uid())
  );

CREATE POLICY "Anyone can view affiliate links" ON affiliate_links
  FOR SELECT USING (TRUE);

-- BLOG POSTS policies
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admin can manage all blog posts" ON blog_posts
  FOR ALL USING (is_admin());

-- PAYMENTS policies
CREATE POLICY "Provider can view their own payments" ON payments
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin can manage all payments" ON payments
  FOR ALL USING (is_admin());

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- Active providers with subscription info
CREATE VIEW active_providers_view AS
SELECT
  p.*,
  ps.status as subscription_status,
  sp.name as subscription_plan,
  ps.current_period_end as subscription_expires
FROM providers p
LEFT JOIN provider_subscriptions ps ON ps.provider_id = p.id AND ps.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = ps.plan_id
WHERE p.is_active = TRUE;

-- Platform MRR
CREATE VIEW mrr_view AS
SELECT
  SUM(sp.price_monthly) as monthly_mrr,
  COUNT(*) as active_subscriptions,
  sp.name as plan
FROM provider_subscriptions ps
JOIN subscription_plans sp ON sp.id = ps.plan_id
WHERE ps.status = 'active'
GROUP BY sp.name;

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := 'EXP-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Calculate commissions on reservation
CREATE OR REPLACE FUNCTION calculate_commissions()
RETURNS TRIGGER AS $$
DECLARE
  hotel_rate DECIMAL := 0;
  platform_rate DECIMAL := 0.05;
  hotel_comm DECIMAL := 0;
  platform_comm DECIMAL := 0;
BEGIN
  -- Get hotel commission rate if hotel is set
  IF NEW.hotel_id IS NOT NULL THEN
    SELECT commission_rate INTO hotel_rate FROM hotels WHERE id = NEW.hotel_id;
    hotel_comm := NEW.total_price * hotel_rate;
  END IF;

  platform_comm := NEW.total_price * platform_rate;

  -- Update reservation commissions
  NEW.hotel_commission := hotel_comm;
  NEW.platform_commission := platform_comm;

  -- Generate confirmation code if not set
  IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
    NEW.confirmation_code := generate_confirmation_code();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_reservation_commissions
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION calculate_commissions();

-- Create commission record after reservation
CREATE OR REPLACE FUNCTION create_commission_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    INSERT INTO commissions (
      reservation_id, hotel_id, provider_id,
      hotel_commission_amount, platform_commission_amount,
      total_amount, status
    )
    VALUES (
      NEW.id, NEW.hotel_id, NEW.provider_id,
      NEW.hotel_commission, NEW.platform_commission,
      NEW.hotel_commission + NEW.platform_commission,
      'pending'
    )
    ON CONFLICT (reservation_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_commission_on_confirmation
  AFTER UPDATE ON reservations
  FOR EACH ROW
  WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION create_commission_record();

-- Update booking count
CREATE OR REPLACE FUNCTION update_activity_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE activities
  SET booking_count = (
    SELECT COUNT(*) FROM reservations
    WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
    AND status NOT IN ('cancelled')
  )
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_booking_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_activity_booking_count();

-- =====================================================
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- =====================================================
-- supabase storage create activity-images --public
-- supabase storage create provider-logos --public
-- supabase storage create hotel-assets --public
-- supabase storage create avatars --public
-- supabase storage create qr-codes --public
