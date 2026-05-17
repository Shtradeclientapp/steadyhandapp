import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Per-route limits: max requests per windowMinutes for a single user
const LIMITS: Record<string, { max: number; windowMinutes: number }> = {
  '/api/match':       { max: 10, windowMinutes: 60 },
  '/api/dialogue':    { max: 30, windowMinutes: 60 },
  '/api/ob-summary':  { max: 5,  windowMinutes: 60 },
  '/api/observatory': { max: 20, windowMinutes: 60 },
  '/api/scope':       { max: 10, windowMinutes: 60 },
}

export async function checkRateLimit(
  userId: string,
  route: string,
): Promise<{ limited: boolean; remaining: number; resetAt: string }> {
  const cfg = LIMITS[route]
  if (!cfg) return { limited: false, remaining: 999, resetAt: '' }

  const windowMs = cfg.windowMinutes * 60 * 1000
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const resetAt = new Date(windowStart.getTime() + windowMs).toISOString()

  const { data, error } = await supabase.rpc('increment_rate_limit', {
    p_user_id:   userId,
    p_route:     route,
    p_window_ts: windowStart.toISOString(),
  })

  if (error) {
    // Fail open — don't block legitimate requests if DB is unavailable
    console.error('ratelimit: rpc failed', error.message)
    return { limited: false, remaining: 999, resetAt }
  }

  const count = data as number
  const remaining = Math.max(0, cfg.max - count)
  return { limited: count > cfg.max, remaining, resetAt }
}

export function rateLimitResponse(resetAt: string) {
  return new Response(
    JSON.stringify({ error: 'Too many requests — try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)),
      },
    },
  )
}
