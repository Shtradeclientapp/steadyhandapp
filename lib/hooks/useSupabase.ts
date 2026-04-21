import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Returns a stable Supabase client instance for the component lifecycle.
 * Prevents multiple createClient() calls within the same component.
 */
export function useSupabase() {
  return useMemo(() => createClient(), [])
}
