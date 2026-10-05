-- ================================================================
-- ROOT-CAUSE FIX for "Credenciales incorrectas" on every account
-- ================================================================
-- Every previous migration that hand-inserted rows into auth.users
-- (003, 010, 011) only set the columns needed for a working login
-- (email, encrypted_password, email_confirmed_at, metadata...) and
-- left GoTrue's internal token columns unset, so Postgres defaulted
-- them to NULL.
--
-- GoTrue (the Supabase Auth server) always scans those columns as
-- Go strings, never as nullable strings. The moment ANY row in
-- auth.users has NULL in one of them, every query that has to read
-- that row — including a plain login and the admin "list users"
-- call — fails with a generic 500 ("Database error querying schema"
-- / "Database error finding users"), which the app's login form
-- then shows to the user as "Credenciales incorrectas".
--
-- This was confirmed directly: calling the GoTrue admin API against
-- this project returned exactly that 500 for every one of the 4 test
-- accounts. It has nothing to do with the password or confirmation
-- state — those were already correct.
--
-- Fix: backfill every NULL token/text column on EVERY existing row
-- in auth.users with '' (GoTrue's own default for these columns),
-- so every account — the 4 test accounts and any real user created
-- the same way — can log in again. Safe to run any number of times.
-- ================================================================

UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;
