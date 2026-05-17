import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as logger from '@/lib/logger'

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id, action } = await request.json()
  // action: 'submit' (tradie) | 'approve' (client) | 'dispute' (client)

  const updates: Record<string, unknown> = {}

  if (action === 'submit') {
    updates.status = 'submitted'
    updates.submitted_at = new Date().toISOString()
  } else if (action === 'approve') {
    updates.status = 'approved'
    updates.approved_at = new Date().toISOString()
  } else if (action === 'dispute') {
    updates.status = 'disputed'
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const { data: milestone, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  logger.log('api/milestones', action, { milestone_id: id, job_id: milestone.job_id, user_id: user.id })

  // If approved, check if all milestones are done → advance job to signoff
  if (action === 'approve') {
    const { data: allMilestones } = await supabase
      .from('milestones')
      .select('status')
      .eq('job_id', milestone.job_id)

    const allDone = allMilestones?.every(m => m.status === 'approved')
    if (allDone) {
      await supabase.from('jobs').update({ status: 'signoff' }).eq('id', milestone.job_id)
    }
  }

  return NextResponse.json({ milestone })
}
