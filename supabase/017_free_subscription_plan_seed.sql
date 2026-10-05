-- Seeds the free plan row. Must run after 016 commits the new enum value.
INSERT INTO subscription_plans (name, display_name, price_monthly, price_annual, max_activities, features)
VALUES (
  'free',
  'Free',
  0,
  0,
  1,
  '["1 actividad publicada", "Panel de gestión básico", "Soporte por email"]'
)
ON CONFLICT (name) DO NOTHING;
