import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get the accepted tradie_id for a job.
 * Option A: quote_requests is the single source of truth.
 * jobs.tradie_id is deprecated — use this instead.
 */
export async function getAcceptedTradie(
  supabase: SupabaseClient,
  jobId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('quote_requests')
    .select('tradie_id')
    .eq('job_id', jobId)
    .eq('qr_status', 'accepted')
    .maybeSingle()
  return data?.tradie_id ?? null
}

/**
 * Mark a quote as accepted and decline all others for the same job.
 * Replaces: supabase.from('jobs').update({ tradie_id: ... })
 */
export async function acceptQuote(
  supabase: SupabaseClient,
  jobId: string,
  tradieId: string
): Promise<{ error: any }> {
  const { error: e1 } = await supabase
    .from('quote_requests')
    .update({ qr_status: 'accepted' })
    .eq('job_id', jobId)
    .eq('tradie_id', tradieId)

  if (e1) return { error: e1 }

  const { error: e2 } = await supabase
    .from('quote_requests')
    .update({ qr_status: 'declined' })
    .eq('job_id', jobId)
    .neq('tradie_id', tradieId)

  return { error: e2 }
}
