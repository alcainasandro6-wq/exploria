-- ================================================================
-- 2 MORE DEMO ACTIVITIES — gives the homepage "top row + packages"
-- sections enough variety to not overlap (7 total instead of 5).
-- ================================================================
-- Run AFTER 006_demo_seed.sql (needs an existing provider + active
-- subscription — same self-healing fallback as that migration, in
-- case it's ever run on its own).
-- ================================================================

DO $$
DECLARE
  v_provider_id  uuid;
  v_pro_plan_id  uuid;
  v_cat_boat     uuid;
  v_cat_water    uuid;
  v_activity_id  uuid;
BEGIN

  SELECT id INTO v_provider_id FROM public.providers ORDER BY created_at ASC LIMIT 1;
  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'No provider found — run 006_demo_seed.sql first.';
  END IF;

  IF NOT public.provider_has_active_subscription(v_provider_id) THEN
    SELECT id INTO v_pro_plan_id FROM public.subscription_plans WHERE name = 'pro' LIMIT 1;
    INSERT INTO public.provider_subscriptions (provider_id, plan_id, status, current_period_end)
    VALUES (v_provider_id, v_pro_plan_id, 'active', now() + interval '10 years');
  END IF;

  SELECT id INTO v_cat_boat  FROM public.categories WHERE slug = 'excursiones-barco';
  SELECT id INTO v_cat_water FROM public.categories WHERE slug = 'deportes-acuaticos';

  -- ── 6. Velero al atardecer ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_boat,
    'Excursión en velero al atardecer',
    'velero-atardecer-torrevieja-demo',
    'Navega a bordo de un velero clásico mientras el sol se pone sobre el Mediterráneo. Una experiencia tranquila con copa de cava incluida, ideal para parejas y grupos reducidos que buscan algo distinto a las excursiones habituales.\n\nZarpamos desde el Puerto de Torrevieja rumbo a mar abierto, con parada para disfrutar de las vistas mientras cae el sol.',
    'Navega en velero clásico y disfruta del atardecer con una copa de cava a bordo.',
    32.00, 120, 12, 2, ARRAY['es','en'],
    'Puerto de Torrevieja, muelle 5', 'Torrevieja', 'España',
    'Cancelación gratuita hasta 24 horas antes de la actividad.',
    '["Copa de cava", "Patrón profesional", "Seguro de actividad"]',
    '["Transporte al puerto", "Comida"]',
    '["No apto para personas con mareo severo"]',
    'published', false, 4.8, 15, 23
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&q=80', 'Velero al atardecer', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', 'Navegando por la costa', false, 1);

  -- ── 7. Paddle surf en la playa ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_water,
    'Clase de paddle surf en la playa del Cura',
    'paddle-surf-playa-cura-demo',
    'Iníciate en el paddle surf de la mano de un monitor titulado en las tranquilas aguas de la Playa del Cura. Clase apta para todos los niveles, incluyendo quienes nunca han probado este deporte.\n\nIncluye toda la equipación y una sesión teórica en la orilla antes de entrar al agua.',
    'Aprende paddle surf con monitor en la Playa del Cura, apto para principiantes.',
    25.00, 90, 8, 1, ARRAY['es','en'],
    'Playa del Cura, Torrevieja', 'Torrevieja', 'España',
    'Cancelación gratuita hasta 24 horas antes de la actividad.',
    '["Tabla y remo", "Chaleco salvavidas", "Monitor titulado", "Seguro de actividad"]',
    '["Ropa de baño", "Toalla"]',
    '["Saber nadar"]',
    'published', false, 4.7, 9, 14
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', 'Paddle surf en la playa', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1200&q=80', 'Playa del Cura', false, 1);

END $$;
