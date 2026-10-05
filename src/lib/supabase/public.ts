/**
 * Public Supabase client — NO cookies, NO auth context.
 * Use this for read-only public queries in Server Components that need
 * to be statically renderable (e.g. page.tsx, layout.tsx).
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database'

let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createPublicClient() {
  if (_client) return _client
  _client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}
