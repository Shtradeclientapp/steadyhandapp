import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// The 9 predictive reminder triggers from the spec
type ReminderType =
  | 'concrete_poured'
  | 'frame_approved'
  | 'rough_in_passed'
  | 'lockup_approved'
  | 'trade_on_site'
  | 'permit_expiring'
  | 'all_milestones_approved'
  | 'six_month_mark'
  | 'project_complete_sale'

const REMINDER_MESSAGES: Record<ReminderType, { subject: string; body: string }> = {
  concrete_poured: {
    subject: 'Time to book your framer',
    body: 'Concrete typically takes 28 days to cure before framing can begin. Now is the time to book your framer to secure a start date — good framers are in demand.',
  },
  frame_approved: {
    subject: 'Frame inspection passed — book your rough-in trades',
    body: 'Your frame inspection has been passed. Rough-in electrical and plumbing work can now begin. Contact your licensed electrician and plumber to confirm their start dates.',
  },
  rough_in_passed: {
    subject: 'Rough-in inspected — schedule insulation before linings go up',
    body: 'Your rough-in inspection has been passed. Insulation must be installed before wall linings go up. Schedule your insulation installer this week.',
  },
  lockup_approved: {
    subject: 'Lock-up reached — finalise your fit-out selections',
    body: 'You have reached lock-up. Now is the time to finalise your tiling, joinery and fit-out selections before those trades are booked. Delays in selections are a common cause of project overruns.',
  },
  trade_on_site: {
    subject: 'Trade on site — is your next trade confirmed?',
    body: 'Your trade is currently on site. Do you have the next trade\'s start date confirmed? Check your project sequence in the Build Journal to avoid gaps.',
  },
  permit_expiring: {
    subject: 'Owner-builder approval expiring soon',
    body: 'Your owner-builder approval expires within 30 days. Ensure your building permit has been issued before this date — the approval cannot be renewed once expired.',
  },
  all_milestones_approved: {
    subject: 'Request your certificate of compliance',
    body: 'All milestones for a trade package have been approved. Request your certificate of compliance from the tradie now — you will need this for your final inspection.',
  },
  six_month_mark: {
    subject: 'Six month build review',
    body: 'You have been owner-building for six months. Review your compliance checklist and collect any outstanding certificates of compliance from your trades.',
  },
  project_complete_sale: {
    subject: 'Home indemnity insurance reminder',
    body: 'Your build has been complete for over six years. If you are considering selling, home indemnity insurance is required under the Home Building Contracts Act for owner-builder work.',
  },
}

async function sendReminder(userId: string, projectId: string, type: ReminderType, jobId?: string) {
  // Check if this reminder was already sent recently (within 7 days)
  const { data: existing } = await supabase
    .from('ob_reminders_sent')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('type', type)
    .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .single()
  if (existing) return // Already sent recently

  const msg = REMINDER_MESSAGES[type]

  // Store in-app notification
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'ob_reminder',
      message: msg.subject,
      job_id: jobId || null,
      read: false,
    })
  } catch { /* non-critical */ }

  // Send email via /api/email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (profile?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://steadyhandapp.vercel.app'
    await fetch(appUrl + '/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ob_reminder',
        to: profile.email,
        subject: msg.subject,
        body: msg.body,
        project_id: projectId,
        cta_url: appUrl + '/diy',
      }),
    }).catch(() => {})
  }

  // Record that we sent it
  try {
    await supabase.from('ob_reminders_sent').insert({
      user_id: userId,
      project_id: projectId,
      type,
      job_id: jobId || null,
      sent_at: new Date().toISOString(),
    })
  } catch { /* non-critical */ }
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorised triggering
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    // Fetch all active OB projects
    const { data: projects } = await supabase
      .from('diy_projects')
      .select('*, user:profiles!diy_projects_user_id_fkey(id, email, full_name)')
      .eq('project_type', 'owner_builder')
      .eq('status', 'active')

    if (!projects || projects.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    let remindersFired = 0

    for (const project of projects) {
      const userId = project.user_id
      const projectId = project.id

      // Fetch child jobs for this project
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, trade_category, status, created_at')
        .eq('diy_project_id', projectId)

      const jobIds = (jobs || []).map((j: any) => j.id)

      // Fetch milestones for all child jobs
      let milestones: any[] = []
      if (jobIds.length > 0) {
        const { data: ms } = await supabase
          .from('milestones')
          .select('id, job_id, label, status, approved_at')
          .in('job_id', jobIds)
        milestones = ms || []
      }

      // TRIGGER 1: Permit expiring within 30 days
      if (project.permit_date) {
        const expiry = new Date(project.permit_date)
        expiry.setMonth(expiry.getMonth() + 6)
        const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysLeft > 0 && daysLeft <= 30) {
          await sendReminder(userId, projectId, 'permit_expiring')
          remindersFired++
        }
      }

      // TRIGGER 2: Six month mark
      const projectAge = (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (projectAge >= 180 && projectAge < 187) {
        await sendReminder(userId, projectId, 'six_month_mark')
        remindersFired++
      }

      // TRIGGER 3: Project complete > 6 years (home indemnity)
      if (project.status === 'complete') {
        const completedAge = project.completed_at
          ? (Date.now() - new Date(project.completed_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
          : 0
        if (completedAge >= 6 && completedAge < 6.1) {
          await sendReminder(userId, projectId, 'project_complete_sale')
          remindersFired++
        }
      }

      // Per-job triggers
      for (const job of (jobs || [])) {
        const jobMilestones = milestones.filter((m: any) => m.job_id === job.id)
        const allApproved = jobMilestones.length > 0 && jobMilestones.every((m: any) => m.status === 'approved')
        const cat = (job.trade_category || '').toLowerCase()

        // TRIGGER 4: All milestones approved — request CoC
        if (allApproved) {
          await sendReminder(userId, projectId, 'all_milestones_approved', job.id)
          remindersFired++
        }

        // TRIGGER 5: Trade on site (delivery status)
        if (job.status === 'delivery') {
          await sendReminder(userId, projectId, 'trade_on_site', job.id)
          remindersFired++
        }

        // TRIGGER 6: Concrete poured — book framer
        // Heuristic: slab/concrete job has all milestones approved
        if ((cat.includes('concret') || cat.includes('slab') || cat.includes('footing')) && allApproved) {
          await sendReminder(userId, projectId, 'concrete_poured', job.id)
          remindersFired++
        }

        // TRIGGER 7: Frame approved — book rough-in
        if ((cat.includes('frame') || cat.includes('struct') || cat.includes('carpent')) && allApproved) {
          await sendReminder(userId, projectId, 'frame_approved', job.id)
          remindersFired++
        }

        // TRIGGER 8: Rough-in inspected — insulation
        if ((cat.includes('electr') || cat.includes('plumb')) && job.status === 'signoff') {
          await sendReminder(userId, projectId, 'rough_in_passed', job.id)
          remindersFired++
        }

        // TRIGGER 9: Lock-up — finalise fit-out
        if ((cat.includes('roof') || cat.includes('window') || cat.includes('door') || cat.includes('lock')) && allApproved) {
          await sendReminder(userId, projectId, 'lockup_approved', job.id)
          remindersFired++
        }
      }
    }

    return NextResponse.json({ ok: true, processed: projects.length, remindersFired })
  } catch (e: any) {
    console.error('OB reminders error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Allow manual trigger via POST for testing
export async function POST(request: NextRequest) {
  return GET(request)
}
