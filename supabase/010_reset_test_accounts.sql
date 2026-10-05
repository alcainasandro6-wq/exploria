-- ================================================================
-- RESET TEST ACCOUNTS — one working, pre-confirmed account per role
-- ================================================================
-- Instead of deleting the existing admin/provider accounts outright,
-- this migration finds-or-creates each one and resets its password +
-- email confirmation. A hard delete would cascade away the 7 demo
-- activities (tied to the provider) and the demo blog posts' author
-- (tied to the admin) — this avoids that data loss while still
-- guaranteeing all 4 accounts log in immediately, no email
-- confirmation step required.
--
-- Credentials after running this:
--   Admin:     alcainasandro6@gmail.com   / Admin123!
--   Hotel:     hotel@exploria.es          / Hotel123!
--   Provider:  provider@exploria.es       / Provider123!   (or whichever
--              email your existing provider account already used)
--   Customer:  cliente@exploria.es        / Cliente123!
-- ================================================================

DO $$
DECLARE
  v_admin_id     uuid;
  v_hotel_id     uuid;
  v_provider_id  uuid;
  v_customer_id  uuid;
  v_provider_row_id uuid;
  v_pro_plan_id  uuid;
BEGIN

  -- ================================================================
  -- ADMIN
  -- ================================================================
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'alcainasandro6@gmail.com';

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'alcainasandro6@gmail.com',
      crypt('Admin123!', gen_salt('bf', 10)), now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Sandro Admin","role":"admin"}',
      'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'alcainasandro6@gmail.com'),
      'email', 'alcainasandro6@gmail.com', now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Admin123!', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_admin_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_admin_id, 'alcainasandro6@gmail.com', 'Sandro Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  -- ================================================================
  -- HOTEL
  -- ================================================================
  SELECT id INTO v_hotel_id FROM auth.users WHERE email = 'hotel@exploria.es';

  IF v_hotel_id IS NULL THEN
    v_hotel_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
    ) VALUES (
      v_hotel_id, '00000000-0000-0000-0000-000000000000', 'hotel@exploria.es',
      crypt('Hotel123!', gen_salt('bf', 10)), now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Hotel Demo Torrevieja","role":"hotel"}',
      'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_hotel_id,
      jsonb_build_object('sub', v_hotel_id::text, 'email', 'hotel@exploria.es'),
      'email', 'hotel@exploria.es', now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Hotel123!', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_hotel_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_hotel_id, 'hotel@exploria.es', 'Hotel Demo Torrevieja', 'hotel')
  ON CONFLICT (id) DO UPDATE SET role = 'hotel';

  INSERT INTO public.hotels (profile_id, name, slug, city, country, phone, commission_rate, affiliate_code)
  VALUES (v_hotel_id, 'Hotel Demo Torrevieja', 'hotel-demo-torrevieja', 'Torrevieja', 'España', '+34 965 000 001', 0.08, 'HOTELDEMO')
  ON CONFLICT (profile_id) DO NOTHING;

  -- ================================================================
  -- PROVIDER — reuses whichever provider ALREADY HOLDS the 7 demo
  -- activities (the oldest row in `providers`, regardless of which
  -- email it was created under — the original 003 seed or 006's
  -- self-healing fallback), so those activities stay attached to it.
  -- ================================================================
  SELECT profile_id INTO v_provider_id FROM public.providers ORDER BY created_at ASC LIMIT 1;

  IF v_provider_id IS NULL THEN
    v_provider_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
    ) VALUES (
      v_provider_id, '00000000-0000-0000-0000-000000000000', 'provider@exploria.es',
      crypt('Provider123!', gen_salt('bf', 10)), now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Buceo Mediterráneo","role":"provider"}',
      'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_provider_id,
      jsonb_build_object('sub', v_provider_id::text, 'email', 'provider@exploria.es'),
      'email', 'provider@exploria.es', now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Provider123!', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_provider_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_provider_id, (SELECT email FROM auth.users WHERE id = v_provider_id), 'Buceo Mediterráneo', 'provider')
  ON CONFLICT (id) DO UPDATE SET role = 'provider';

  INSERT INTO public.providers (profile_id, company_name, slug, city, country, phone, is_verified)
  VALUES (v_provider_id, 'Buceo Mediterráneo', 'buceo-mediterraneo', 'Torrevieja', 'España', '+34 965 123 456', true)
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT id INTO v_provider_row_id FROM public.providers WHERE profile_id = v_provider_id;

  IF NOT public.provider_has_active_subscription(v_provider_row_id) THEN
    SELECT id INTO v_pro_plan_id FROM public.subscription_plans WHERE name = 'pro' LIMIT 1;
    INSERT INTO public.provider_subscriptions (provider_id, plan_id, status, current_period_end)
    VALUES (v_provider_row_id, v_pro_plan_id, 'active', now() + interval '10 years');
  END IF;

  -- ================================================================
  -- CUSTOMER — brand new, didn't exist before
  -- ================================================================
  SELECT id INTO v_customer_id FROM auth.users WHERE email = 'cliente@exploria.es';

  IF v_customer_id IS NULL THEN
    v_customer_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud
    ) VALUES (
      v_customer_id, '00000000-0000-0000-0000-000000000000', 'cliente@exploria.es',
      crypt('Cliente123!', gen_salt('bf', 10)), now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Cliente Demo","role":"customer"}',
      'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_customer_id,
      jsonb_build_object('sub', v_customer_id::text, 'email', 'cliente@exploria.es'),
      'email', 'cliente@exploria.es', now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Cliente123!', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  UPDATE public.profiles SET role = 'customer', full_name = 'Cliente Demo' WHERE id = v_customer_id;

END $$;
