-- Real TuriTop API connection (OCTO standard, Bearer auth) per provider —
-- distinct from the existing turitop_company_code/turitop_service_code
-- fields, which only configure the public embed *widget* and involve no
-- API call at all. This lets a provider (or admin, on their behalf)
-- authenticate server-to-server against https://app.turitop.com/octo/.

CREATE TYPE turitop_connection_status AS ENUM ('unverified', 'ok', 'error');

ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_api_key TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_connection_status turitop_connection_status NOT NULL DEFAULT 'unverified';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_connection_error TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS turitop_connected_at TIMESTAMPTZ;
