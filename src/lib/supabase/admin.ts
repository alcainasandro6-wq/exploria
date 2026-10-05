import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely. Only ever import this from
// server-only code (server actions, route handlers) gated by an admin check,
// never from a client component or anything reachable without auth.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
