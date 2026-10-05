-- Per-provider TuriTop calendar + secure credential storage.
--
-- SECURITY FIX: providers has the RLS policy "Anyone can view active providers"
-- (SELECT USING is_active), so a column like providers.turitop_api_key was
-- readable by ANY visitor through the public REST API. The API key now lives
-- in its own table that only the owning provider and admins can read.

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
