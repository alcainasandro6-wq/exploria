-- ================================================================
-- TEST ACCOUNTS — run AFTER schema.sql
-- ================================================================
-- Admin:    alcainasandro6@gmail.com  /  Admin123!
-- Hotel:    hotel@exploria.es         /  Hotel123!
-- Provider: provider@exploria.es      /  Provider123!
-- ================================================================

DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_hotel_id uuid := gen_random_uuid();
  v_prov_id  uuid := gen_random_uuid();
  v_pro_plan uuid;
BEGIN

  -- ── 1. Admin (alcainasandro6@gmail.com / Admin123!) ──
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'alcainasandro6@gmail.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sandro Admin","role":"admin"}',
    'authenticated', 'authenticated'
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'alcainasandro6@gmail.com'),
    'email', 'alcainasandro6@gmail.com', now(), now()
  );
  -- Fix role (trigger creates 'customer' by default; override)
  UPDATE public.profiles SET role = 'admin' WHERE id = v_admin_id;


  -- ── 2. Hotel (hotel@exploria.es / Hotel123!) ──
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
  ) VALUES (
    v_hotel_id,
    '00000000-0000-0000-0000-000000000000',
    'hotel@exploria.es',
    crypt('Hotel123!', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Hotel Test Torrevieja","role":"hotel"}',
    'authenticated', 'authenticated'
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_hotel_id,
    jsonb_build_object('sub', v_hotel_id::text, 'email', 'hotel@exploria.es'),
    'email', 'hotel@exploria.es', now(), now()
  );
  UPDATE public.profiles SET role = 'hotel' WHERE id = v_hotel_id;
  -- Create hotel record
  INSERT INTO public.hotels (profile_id, name, slug, city, country, phone, commission_rate, affiliate_code)
  VALUES (v_hotel_id, 'Hotel Test Torrevieja', 'hotel-test-torrevieja',
          'Torrevieja', 'España', '+34 965 000 001', 0.08, 'HOTEL001');


  -- ── 3. Provider (provider@exploria.es / Provider123!) ──
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
  ) VALUES (
    v_prov_id,
    '00000000-0000-0000-0000-000000000000',
    'provider@exploria.es',
    crypt('Provider123!', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Buceo Mediterráneo","role":"provider"}',
    'authenticated', 'authenticated'
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_prov_id,
    jsonb_build_object('sub', v_prov_id::text, 'email', 'provider@exploria.es'),
    'email', 'provider@exploria.es', now(), now()
  );
  UPDATE public.profiles SET role = 'provider' WHERE id = v_prov_id;
  -- Create provider record
  INSERT INTO public.providers (profile_id, company_name, slug, city, country, phone, is_verified)
  VALUES (v_prov_id, 'Buceo Mediterráneo', 'buceo-mediterraneo',
          'Torrevieja', 'España', '+34 965 123 456', true);
  -- Assign Pro subscription (1 year, active)
  SELECT id INTO v_pro_plan FROM public.subscription_plans WHERE name = 'pro' LIMIT 1;
  INSERT INTO public.provider_subscriptions (provider_id, plan_id, status, current_period_end)
  SELECT id, v_pro_plan, 'active', now() + interval '1 year'
  FROM public.providers WHERE profile_id = v_prov_id;

END $$;
