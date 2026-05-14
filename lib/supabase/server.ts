import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Pooled connection for high-throughput server-side operations (port 6543 via PgBouncer)
// Use this for API routes that make many DB calls under load
export function createPooledClient() {
  const pooledUrl = process.env.SUPABASE_DB_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  return createSupabaseClient(
    pooledUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false },
      global: { headers: { 'x-connection-encrypted': 'true' } },
    }
  )
}