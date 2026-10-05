-- ================================================================
-- FULL RESET — delete every previous test account and create 4 fresh
-- ones from scratch (admin, hotel, provider, customer), each landing
-- on their own dashboard, no email confirmation required.
-- ================================================================
-- Superseded 010_reset_test_accounts.sql, which likely failed as one
-- single all-or-nothing transaction (e.g. a duplicate affiliate_code
-- on a second run would silently roll back everything in that block,
-- including the password reset — matching "still get invalid
-- credentials after running it").
--
-- The demo activities (tied to the old provider) and demo blog posts
-- (tied to the old admin) are re-pointed to the new accounts before
-- the old rows are deleted, so nothing is lost.
--
-- New credentials:
--   Admin:     alcainasandro6@gmail.com      / Admin123!
--   Hotel:     hotel@bookactivities.test     / Hotel123!
--   Provider:  provider@bookactivities.test  / Provider123!
--   Customer:  customer@bookactivities.test  / Customer123!
-- ================================================================

DO $$
DECLARE
  v_old_admin_ids       uuid[];
  v_old_provider_row_id uuid;
  v_new_admin_id        uuid := gen_random_uuid();
  v_new_hotel_id        uuid := gen_random_uuid();
  v_new_provider_id     uuid := gen_random_uuid();
  v_new_customer_id     uuid := gen_random_uuid();
  v_new_provider_row_id uuid;
  v_pro_plan_id         uuid;
BEGIN

  -- ================================================================
  -- ADMIN — same real email as before (delete + recreate)
  -- ================================================================
  SELECT array_agg(id) INTO v_old_admin_ids FROM public.profiles WHERE role = 'admin';
  IF v_old_admin_ids IS NOT NULL THEN
    UPDATE public.blog_posts SET author_id = NULL WHERE author_id = ANY(v_old_admin_ids);
  END IF;

  DELETE FROM auth.users WHERE email = 'alcainasandro6@gmail.com';

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    v_new_admin_id, '00000000-0000-0000-0000-000000000000', 'alcainasandro6@gmail.com',
    crypt('Admin123!', gen_salt('bf', 10)), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sandro Admin","role":"admin"}',
    'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (gen_random_uuid(), v_new_admin_id,
    jsonb_build_object('sub', v_new_admin_id::text, 'email', 'alcainasandro6@gmail.com'),
    'email', 'alcainasandro6@gmail.com', now(), now());
  UPDATE public.profiles SET role = 'admin', full_name = 'Sandro Admin' WHERE id = v_new_admin_id;

  UPDATE public.blog_posts SET author_id = v_new_admin_id WHERE author_id IS NULL;

  -- ================================================================
  -- HOTEL — fresh dedicated test email
  -- ================================================================
  DELETE FROM auth.users WHERE email IN ('hotel@exploria.es', 'hotel@bookactivities.test');

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    v_new_hotel_id, '00000000-0000-0000-0000-000000000000', 'hotel@bookactivities.test',
    crypt('Hotel123!', gen_salt('bf', 10)), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Hotel Demo Torrevieja","role":"hotel"}',
    'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (gen_random_uuid(), v_new_hotel_id,
    jsonb_build_object('sub', v_new_hotel_id::text, 'email', 'hotel@bookactivities.test'),
    'email', 'hotel@bookactivities.test', now(), now());
  UPDATE public.profiles SET role = 'hotel', full_name = 'Hotel Demo Torrevieja' WHERE id = v_new_hotel_id;

  INSERT INTO public.hotels (profile_id, name, slug, city, country, phone, commission_rate, affiliate_code)
  VALUES (v_new_hotel_id, 'Hotel Demo Torrevieja', 'hotel-demo-torrevieja-' || substr(v_new_hotel_id::text, 1, 8),
          'Torrevieja', 'España', '+34 965 000 001', 0.08, 'HOTELDEMO-' || substr(v_new_hotel_id::text, 1, 8));

  -- ================================================================
  -- PROVIDER — fresh test email created FIRST (no conflict with the
  -- old one), demo activities re-pointed to it, THEN old rows removed.
  -- ================================================================
  SELECT id INTO v_old_provider_row_id FROM public.providers ORDER BY created_at ASC LIMIT 1;

  DELETE FROM auth.users WHERE email = 'provider@bookactivities.test';

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    v_new_provider_id, '00000000-0000-0000-0000-000000000000', 'provider@bookactivities.test',
    crypt('Provider123!', gen_salt('bf', 10)), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Buceo Mediterráneo","role":"provider"}',
    'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (gen_random_uuid(), v_new_provider_id,
    jsonb_build_object('sub', v_new_provider_id::text, 'email', 'provider@bookactivities.test'),
    'email', 'provider@bookactivities.test', now(), now());
  UPDATE public.profiles SET role = 'provider', full_name = 'Buceo Mediterráneo' WHERE id = v_new_provider_id;

  INSERT INTO public.providers (profile_id, company_name, slug, city, country, phone, is_verified)
  VALUES (v_new_provider_id, 'Buceo Mediterráneo', 'buceo-mediterraneo-' || substr(v_new_provider_id::text, 1, 8),
          'Torrevieja', 'España', '+34 965 123 456', true)
  RETURNING id INTO v_new_provider_row_id;

  -- Grant the subscription BEFORE re-pointing activities: the
  -- enforce_subscription_on_activity trigger fires on this same UPDATE
  -- (activities keep status = 'published') and blocks it if the new
  -- provider has no active subscription yet.
  SELECT id INTO v_pro_plan_id FROM public.subscription_plans WHERE name = 'pro' LIMIT 1;
  INSERT INTO public.provider_subscriptions (provider_id, plan_id, status, current_period_end)
  VALUES (v_new_provider_row_id, v_pro_plan_id, 'active', now() + interval '10 years');

  IF v_old_provider_row_id IS NOT NULL THEN
    UPDATE public.activities SET provider_id = v_new_provider_row_id WHERE provider_id = v_old_provider_row_id;
  END IF;

  -- Now safe: activities/blog no longer reference the old rows.
  DELETE FROM auth.users WHERE email IN ('provider@exploria.es', 'demo-provider@bookactivities.es');

  -- ================================================================
  -- CUSTOMER — fresh dedicated test email
  -- ================================================================
  DELETE FROM auth.users WHERE email IN ('cliente@exploria.es', 'customer@bookactivities.test');

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    v_new_customer_id, '00000000-0000-0000-0000-000000000000', 'customer@bookactivities.test',
    crypt('Customer123!', gen_salt('bf', 10)), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Demo","role":"customer"}',
    'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (gen_random_uuid(), v_new_customer_id,
    jsonb_build_object('sub', v_new_customer_id::text, 'email', 'customer@bookactivities.test'),
    'email', 'customer@bookactivities.test', now(), now());
  UPDATE public.profiles SET role = 'customer', full_name = 'Cliente Demo' WHERE id = v_new_customer_id;

END $$;
