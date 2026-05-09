import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SessionState {
  session: any
  profile: any
  loading: boolean
  error: string | null
}

/**
 * Shared session + profile loader.
 * ADOPTION STATUS: Ready for use on new pages.
 * Use this instead of duplicating supabase.auth.getSession() + profiles fetch inline.
 * Pages already using inline pattern: agreement, delivery, signoff, warranty, consult, compare, shortlist.
 * New pages should import and use this hook instead.
 * Handles auth check, redirect to /login, and profile fetch in one place.
 * onLoad is called once session and profile are available.
 */
export function useSession(onLoad?: (session: any, profile: any, supabase: any) => void) {
  const [state, setState] = useState<SessionState>({
    session: null,
    profile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = createClient()
    const timeout = setTimeout(() => {
      setState(s => ({ ...s, loading: false, error: 'Loading timed out — please refresh' }))
    }, 8000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (!session) {
        window.location.href = '/login'
        return
      }
      try {
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profErr) throw new Error(profErr.message)

        setState({ session, profile, loading: false, error: null })
        onLoad?.(session, profile, supabase)
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message || 'Failed to load profile' }))
      }
    })

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
