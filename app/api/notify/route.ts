import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, job_id } = body

    // Forward to email route
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://steadyhandapp.vercel.app'
    await fetch(base + '/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, job_id, ...body }),
    }).catch(() => {})

    // Also store as in-app notification in Supabase
    if (job_id) {
      const { data: job } = await supabase
        .from('jobs')
        .select('client_id, tradie_id, title')
        .eq('id', job_id)
        .single()

      if (job) {
        const notifMap: Record<string, { user_id: string; message: string }[]> = {
          tradie_selected: [{ user_id: job.tradie_id, message: 'You have been selected for: ' + job.title }],
          scope_signed: [
            { user_id: job.client_id, message: 'Scope agreement signed for: ' + job.title },
            { user_id: job.tradie_id, message: 'Scope agreement signed for: ' + job.title },
          ],
          milestone_approved: [{ user_id: job.tradie_id, message: 'Milestone approved on: ' + job.title }],
          milestone_submitted: [{ user_id: job.client_id, message: 'Milestone ready for review on: ' + job.title }],
          warranty_issue: [{ user_id: job.tradie_id, message: 'Warranty issue logged on: ' + job.title }],
          quote_submitted: [{ user_id: job.client_id, message: 'New quote received for: ' + job.title }],
          consult_complete: [{ user_id: job.client_id, message: 'Consult complete — quotes are now open for: ' + job.title }],
          ob_final_inspection: [{ user_id: job.client_id, message: 'All trades at sign-off — time to book your final building inspection.' }],
        }
        const notifs = notifMap[type] || []
        for (const n of notifs) {
          if (n.user_id) {
            try {
              await supabase.from('notifications').insert({
                user_id: n.user_id,
                type,
                message: n.message,
                job_id,
                read: false,
              })
            } catch { /* non-critical */ }
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Notify failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
