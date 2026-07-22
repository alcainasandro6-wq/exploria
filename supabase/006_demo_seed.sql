-- ================================================================
-- DEMO SEED — 5 example activities + 4 example blog posts
-- ================================================================
-- Run AFTER schema.sql, 003_test_users.sql, 004_backend_v2.sql and
-- 005_bookactivities_v3.sql.
--
-- Assumes at least one row already exists in `providers` (e.g. the
-- "Buceo Mediterráneo" test provider created by 003_test_users.sql) —
-- the 5 demo activities are attached to the OLDEST provider account
-- found. All 5 are fully deletable afterwards from
-- /dashboard/admin/activities (each row has a trash-can button).
--
-- The 4 demo blog posts are attached to an admin profile if one
-- exists (author_id is nullable, so it still works if not). They are
-- fully editable/deletable from /dashboard/admin/cms.
-- ================================================================

DO $$
DECLARE
  v_provider_id   uuid;
  v_admin_id      uuid;
  v_cat_boat      uuid;
  v_cat_kayak     uuid;
  v_cat_dive      uuid;
  v_cat_food      uuid;
  v_cat_nature    uuid;
  v_activity_id   uuid;
BEGIN

  SELECT id INTO v_provider_id FROM public.providers ORDER BY created_at ASC LIMIT 1;
  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'No provider found — run 003_test_users.sql (or create a provider) before this seed migration.';
  END IF;

  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1;

  SELECT id INTO v_cat_boat    FROM public.categories WHERE slug = 'excursiones-barco';
  SELECT id INTO v_cat_kayak   FROM public.categories WHERE slug = 'kayak-piraguismo';
  SELECT id INTO v_cat_dive    FROM public.categories WHERE slug = 'buceo-snorkel';
  SELECT id INTO v_cat_food    FROM public.categories WHERE slug = 'gastronomia';
  SELECT id INTO v_cat_nature  FROM public.categories WHERE slug = 'naturaleza-senderismo';

  -- ── 1. Catamarán por la Costa Blanca ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_boat,
    'Excursión en catamarán por la Costa Blanca',
    'catamaran-costa-blanca-demo',
    'Navega la costa de Torrevieja a bordo de un catamarán con música en directo, zona de baño en alta mar y las mejores vistas de las Islas Hormigas. Una tarde perfecta para disfrutar del Mediterráneo con toda comodidad.\n\nSalimos desde el Puerto de Torrevieja y navegamos hacia calas de aguas cristalinas donde podrás bañarte y hacer snorkel. A bordo, música en vivo y ambiente festivo con bebida incluida.',
    'Navega la costa en catamarán con parada para bañarte en calas de aguas cristalinas.',
    35.00, 180, 80, 1, ARRAY['es','en'],
    'Puerto de Torrevieja, muelle 3', 'Torrevieja', 'España',
    'Cancelación gratuita hasta 24 horas antes de la actividad.',
    '["Bebida a bordo", "Música en directo", "Equipo de snorkel", "Seguro de actividad"]',
    '["Comida", "Transporte al puerto", "Fotos profesionales"]',
    '["Saber nadar", "No apto para embarazadas"]',
    'published', true, 4.7, 32, 58
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', 'Catamarán en la Costa Blanca', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1500036064239-3c6ba8153123?w=1200&q=80', 'Vista al mar Mediterráneo', false, 1),
    (v_activity_id, 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80', 'Baño en cala de aguas cristalinas', false, 2);

  -- ── 2. Kayak por las Salinas de Torrevieja ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_kayak,
    'Ruta en kayak por las Salinas de Torrevieja',
    'kayak-salinas-torrevieja-demo',
    'Recorre en kayak la famosa laguna rosada de Torrevieja, una de las más saladas del mundo y reserva natural protegida. Un guía especializado te acompañará explicando la flora y fauna del parque natural mientras remas a un ritmo tranquilo apto para todos los niveles.\n\nLa ruta incluye paradas fotográficas en los puntos con mejor luz y vistas a los flamencos que habitan la zona.',
    'Rema por la icónica laguna rosada con guía naturalista incluido.',
    28.00, 120, 16, 2, ARRAY['es','en','fr'],
    'Centro de interpretación del Parque Natural de las Lagunas', 'Torrevieja', 'España',
    'Cancelación gratuita hasta 48 horas antes de la actividad.',
    '["Kayak y remo", "Chaleco salvavidas", "Guía naturalista", "Seguro de actividad"]',
    '["Transporte", "Ropa de baño", "Toalla"]',
    '["Saber nadar", "Edad mínima 8 años"]',
    'published', true, 4.9, 47, 91
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', 'Kayak en la laguna rosada', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 'Laguna rosada de Torrevieja', false, 1);

  -- ── 3. Bautismo de buceo en Cabo Roig ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_dive,
    'Bautismo de buceo en Cabo Roig',
    'bautismo-buceo-cabo-roig-demo',
    'Vive tu primera inmersión con botellas junto a un instructor certificado PADI, sin necesidad de experiencia previa. Descubre los fondos rocosos de Cabo Roig, hogar de meros, doradas y praderas de posidonia.\n\nToda la formación teórica y práctica se realiza en la propia playa antes de la inmersión, garantizando la máxima seguridad.',
    'Tu primera inmersión con botella junto a un instructor PADI certificado.',
    59.00, 150, 6, 1, ARRAY['es','en','de'],
    'Playa de Cabo Roig, centro de buceo', 'Orihuela Costa', 'España',
    'Cancelación gratuita hasta 24 horas antes de la actividad.',
    '["Equipo completo de buceo", "Instructor PADI", "Seguro de buceo", "Certificado de participación"]',
    '["Fotos y vídeo submarino", "Transporte"]',
    '["Saber nadar", "No apto para personas con problemas cardíacos o respiratorios", "Edad mínima 10 años"]',
    'published', false, 4.8, 21, 34
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', 'Buceo en Cabo Roig', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80', 'Fondos marinos del Mediterráneo', false, 1);

  -- ── 4. Tour gastronómico por el casco antiguo ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_food,
    'Tour gastronómico por el casco antiguo de Torrevieja',
    'tour-gastronomico-torrevieja-demo',
    'Un recorrido a pie por las calles del casco antiguo de Torrevieja parando en 5 bares y restaurantes locales para degustar arroz con costra, caldosa, embutidos de la zona y vinos de la Comunidad Valenciana.\n\nUna forma deliciosa de conocer la ciudad de la mano de un guía local que te contará la historia de cada rincón y de cada plato.',
    'Ruta de tapas y platos tradicionales por el casco antiguo con guía local.',
    45.00, 150, 14, 2, ARRAY['es','en'],
    'Plaza de la Constitución, Torrevieja', 'Torrevieja', 'España',
    'Cancelación gratuita hasta 24 horas antes de la actividad.',
    '["5 degustaciones", "Bebida en cada parada", "Guía local"]',
    '["Bebidas alcohólicas extra", "Transporte"]',
    '["Informar de alergias alimentarias al reservar"]',
    'published', false, 4.6, 18, 27
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80', 'Gastronomía local de Torrevieja', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', 'Casco antiguo de Torrevieja', false, 1);

  -- ── 5. Senderismo y estrellas en La Mata ──
  INSERT INTO public.activities (
    provider_id, category_id, title, slug, description, short_description,
    price_from, duration_minutes, max_participants, min_participants, languages,
    meeting_point, city, country, cancellation_policy, included, excluded, requirements,
    status, featured, rating, review_count, booking_count
  ) VALUES (
    v_provider_id, v_cat_nature,
    'Senderismo nocturno y observación de estrellas en La Mata',
    'senderismo-nocturno-la-mata-demo',
    'Una ruta de senderismo tranquila al atardecer por el parque natural de La Mata, terminando con una sesión de observación de estrellas con telescopio guiada por un astrónomo aficionado, lejos de la contaminación lumínica de la ciudad.\n\nIdeal para parejas, familias y amantes de la naturaleza que buscan una experiencia diferente y relajante.',
    'Ruta al atardecer por La Mata y observación de estrellas con telescopio.',
    22.00, 150, 20, 1, ARRAY['es','en'],
    'Aparcamiento del Parque Natural de La Mata', 'Torrevieja', 'España',
    'Cancelación gratuita hasta 24 horas antes de la actividad.',
    '["Guía naturalista", "Telescopio y material de observación", "Seguro de actividad"]',
    '["Cena", "Transporte al punto de encuentro"]',
    '["Llevar calzado cómodo y ropa de abrigo"]',
    'published', false, 4.9, 12, 19
  ) RETURNING id INTO v_activity_id;

  INSERT INTO public.activity_images (activity_id, url, alt, is_cover, sort_order) VALUES
    (v_activity_id, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80', 'Cielo estrellado en La Mata', true, 0),
    (v_activity_id, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80', 'Sendero natural al atardecer', false, 1);

  -- ================================================================
  -- 4 demo blog posts
  -- ================================================================

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category, tags, is_published, published_at) VALUES
  (
    'Las 10 mejores playas de Torrevieja para 2025',
    'mejores-playas-torrevieja-demo',
    'Descubre cuáles son las playas más impresionantes de Torrevieja, desde la icónica Playa del Cura hasta las tranquilas calas escondidas.',
    'Torrevieja cuenta con más de veinte kilómetros de costa y algunas de las playas mejor valoradas de la Costa Blanca. En este artículo repasamos las diez imprescindibles para 2025.\n\n1. Playa del Cura — la más emblemática, con Bandera Azul y todos los servicios.\n2. Playa de los Locos — perfecta para familias, aguas tranquilas y poco oleaje.\n3. Cala Piteras — una pequeña cala rodeada de rocas, ideal para el snorkel.\n4. Playa de la Mata — extensa playa de arena dorada junto al parque natural.\n5. Cala Ferris — pequeña y menos concurrida, perfecta para desconectar.\n\nCada una ofrece una experiencia distinta, desde el bullicio del centro hasta la tranquilidad de las calas más escondidas. Sea cual sea tu elección, la Costa Blanca no defrauda.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    v_admin_id, 'Guías', ARRAY['playas','torrevieja','costa blanca'],
    true, now() - interval '3 days'
  ),
  (
    'Guía completa de buceo para principiantes en Torrevieja',
    'guia-buceo-principiantes-torrevieja-demo',
    'Todo lo que necesitas saber para hacer tu primera inmersión en las cristalinas aguas del Mediterráneo. Consejos, seguridad y los mejores puntos de buceo.',
    'El Mediterráneo frente a Torrevieja y Cabo Roig ofrece algunos de los mejores fondos rocosos para iniciarse en el buceo. En esta guía te contamos todo lo necesario antes de tu primera inmersión.\n\nQué esperar de un bautismo de buceo: una breve sesión teórica en la orilla, práctica de las señales básicas en aguas poco profundas y, finalmente, la inmersión guiada por un instructor certificado.\n\nLos mejores puntos: Cabo Roig, la Isla Tabarca y los arrecifes artificiales frente a la costa de Torrevieja son los favoritos de los buceadores noveles gracias a su visibilidad y su riqueza de fauna marina.\n\nRecomendamos siempre bucear con centros certificados PADI o SSI, y consultar el estado del mar antes de reservar.',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    v_admin_id, 'Actividades', ARRAY['buceo','principiantes','cabo roig'],
    true, now() - interval '10 days'
  ),
  (
    'La laguna rosada de Torrevieja: por qué es única en el mundo',
    'laguna-rosada-torrevieja-demo',
    'La laguna de Torrevieja es una de las más saladas del mundo y su característico color rosa la convierte en un espectáculo natural único. Te explicamos por qué.',
    'El color rosado de la Laguna Salada de Torrevieja se debe a un alga microscópica, la Dunaliella salina, que prospera en aguas con una salinidad extremadamente alta y libera un pigmento carotenoide como mecanismo de protección solar.\n\nLa intensidad del color varía según la estación y la concentración de sal, siendo más visible en los meses de más calor. La laguna forma parte de un parque natural protegido y es, además, uno de los mayores productores de sal marina de Europa.\n\nLa mejor forma de disfrutarla es en una ruta en kayak guiada, que permite acercarse a los flamencos que habitan la zona sin alterar su hábitat.',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    v_admin_id, 'Naturaleza', ARRAY['naturaleza','laguna rosada','parque natural'],
    true, now() - interval '18 days'
  ),
  (
    'Qué ver y hacer en Torrevieja: guía completa 2025',
    'que-ver-torrevieja-guia-demo',
    'Una guía completa con los imprescindibles de Torrevieja. Playas, actividades, gastronomía, cultura y todos los secretos que los locales conocen.',
    'Torrevieja combina playas premiadas, un parque natural único y una animada vida gastronómica. Esta guía reúne los imprescindibles para sacarle el máximo partido a tu visita.\n\nPlayas: la Playa del Cura y la Playa de los Locos son las más populares, aunque las calas del sur ofrecen más tranquilidad.\n\nNaturaleza: el Parque Natural de las Lagunas de La Mata y Torrevieja es Reserva de la Biosfera y un paraíso para observar flamencos.\n\nGastronomía: no te vayas sin probar el arroz con costra y la caldosa de langosta, dos platos típicos de la zona.\n\nActividades: desde excursiones en catamarán hasta bautismos de buceo, la oferta de actividades en Torrevieja es de las más variadas de la Costa Blanca.',
    'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=80',
    v_admin_id, 'Guías', ARRAY['guía','torrevieja','turismo'],
    true, now() - interval '25 days'
  );

END $$;
