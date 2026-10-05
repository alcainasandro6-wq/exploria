-- The public "Hazte proveedor" (/providers) application form had no
-- backend at all — it faked a success state with a setTimeout and never
-- persisted anything. This adds real lead capture.

CREATE TYPE provider_application_status AS ENUM ('new', 'contacted', 'approved', 'rejected');

CREATE TABLE provider_applications (
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

CREATE TRIGGER provider_applications_updated_at BEFORE UPDATE ON provider_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_provider_applications_status ON provider_applications(status);
CREATE INDEX idx_provider_applications_created_at ON provider_applications(created_at);

ALTER TABLE provider_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit an application — it's a
-- public lead-capture form. No read access for anon/authenticated non-admin.
CREATE POLICY "Anyone can submit a provider application" ON provider_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage provider applications" ON provider_applications
  FOR ALL USING (is_admin());
