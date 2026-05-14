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
    body: 'Your trade is currently on site. Do you have the next trade\'s start date confirmed? Check your project sequence in the Property Journal to avoid gaps.',
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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://steadyhandtrade.app'

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
        cta_url: appUrl + '/diy?project_id=' + projectId,
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

  // ── Cron deduplication lock ──────────────────────────────────────────────────
  // Prevents double-fire if Vercel cold-starts two instances simultaneously
  const lockKey = 'ob_reminders_running'
  const lockExpiry = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min ago

  const { data: existingLock } = await supabase
    .from('cron_locks')
    .select('locked_at')
    .eq('key', lockKey)
    .single()

  if (existingLock && existingLock.locked_at > lockExpiry) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already_running' })
  }

  await supabase.from('cron_locks').upsert({ key: lockKey, locked_at: new Date().toISOString() })

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

    // ── Warranty expiry — 7 day warning ─────────────────────────────────────────
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data: expiringJobs } = await supabase
      .from('jobs')
      .select('id, title, client_id, warranty_ends_at')
      .eq('status', 'warranty')
      .gte('warranty_ends_at', oneDayAhead)
      .lte('warranty_ends_at', sevenDays)

    for (const job of (expiringJobs || [])) {
      const daysLeft = Math.ceil((new Date(job.warranty_ends_at).getTime() - Date.now()) / 86400000)
      const { data: client } = await supabase
        .from('profiles').select('email, full_name').eq('id', job.client_id).single()
      if (client?.email) {
        await fetch(siteUrl + '/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'warranty_expiring',
            to: client.email,
            job_title: job.title,
            days_left: daysLeft,
            cta_url: siteUrl + '/warranty?job_id=' + job.id,
          }),
        }).catch(() => {})
        remindersFired++
      }
    }

    // ── Warranty escalation — overdue response_due_at ──────────────────────────
    const { data: overdueIssues } = await supabase
      .from('warranty_issues')
      .select('*, job:jobs(id, client_id, tradie_id, title)')
      .eq('status', 'open')
      .lt('response_due_at', new Date().toISOString())

    for (const issue of (overdueIssues || [])) {
      const job = Array.isArray(issue.job) ? issue.job[0] : issue.job
      if (!job) continue

      // Notify tradie they are overdue
      const { data: tradie } = await supabase
        .from('profiles').select('email, full_name').eq('id', job.tradie_id).single()
      if (tradie?.email) {
        await fetch(siteUrl + '/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'warranty_overdue',
            to: tradie.email,
            subject: 'Warranty response overdue — action required',
            job_title: job.title,
            issue_title: issue.title,
            response_due_at: issue.response_due_at,
          }),
        }).catch(() => {})
      }

      // Notify client their issue is overdue
      const { data: client } = await supabase
        .from('profiles').select('email, full_name').eq('id', job.client_id).single()
      if (client?.email) {
        await fetch(siteUrl + '/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'warranty_overdue_client',
            to: client.email,
            subject: 'Your warranty issue has not received a response',
            job_title: job.title,
            issue_title: issue.title,
            cta_url: siteUrl + '/warranty?job_id=' + job.id,
          }),
        }).catch(() => {})
      }

      // Update issue status to escalated so we don't fire every day
      await supabase.from('warranty_issues')
        .update({ status: 'escalated' })
        .eq('id', issue.id)

      remindersFired++
    }

    // ── Licence expiry — 30 day warning ─────────────────────────────────────────
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data: expiringLicences } = await supabase
      .from('tradie_profiles')
      .select('id, business_name, licence_number, licence_expiry_date, insurance_expiry_date, profile:profiles(email, full_name)')
      .gte('licence_expiry_date', tomorrow)
      .lte('licence_expiry_date', thirtyDays)

    for (const tp of (expiringLicences || [])) {
      const prof = Array.isArray(tp.profile) ? tp.profile[0] : tp.profile
      if (!prof?.email) continue
      const daysLeft = Math.ceil((new Date(tp.licence_expiry_date).getTime() - Date.now()) / 86400000)
      await fetch(siteUrl + '/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'licence_expiring',
          to: prof.email,
          business_name: tp.business_name,
          licence_number: tp.licence_number,
          days_left: daysLeft,
          cta_url: siteUrl + '/tradie/profile',
        }),
      }).catch(() => {})
      remindersFired++
    }

    // Also check insurance expiry
    const { data: expiringInsurance } = await supabase
      .from('tradie_profiles')
      .select('id, business_name, insurance_expiry_date, profile:profiles(email, full_name)')
      .gte('insurance_expiry_date', tomorrow)
      .lte('insurance_expiry_date', thirtyDays)

    for (const tp of (expiringInsurance || [])) {
      const prof = Array.isArray(tp.profile) ? tp.profile[0] : tp.profile
      if (!prof?.email) continue
      const daysLeft = Math.ceil((new Date(tp.insurance_expiry_date).getTime() - Date.now()) / 86400000)
      await fetch(siteUrl + '/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'insurance_expiring',
          to: prof.email,
          business_name: tp.business_name,
          days_left: daysLeft,
          cta_url: siteUrl + '/tradie/profile',
        }),
      }).catch(() => {})
      remindersFired++
    }

    // ── Warranty auto-close — resolved issues not acknowledged after 7 days ───────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: autoCloseIssues } = await supabase
      .from('warranty_issues')
      .select('id, job_id, title, job:jobs(client_id, tradie_id, title)')
      .eq('status', 'in_progress')
      .lt('resolved_at', sevenDaysAgo)
      .is('client_accepted_at', null)

    for (const issue of (autoCloseIssues || [])) {
      const job = Array.isArray(issue.job) ? issue.job[0] : issue.job
      if (!job) continue

      // Auto-close the issue
      await supabase.from('warranty_issues')
        .update({ status: 'resolved', client_accepted_at: new Date().toISOString(), auto_closed: true })
        .eq('id', issue.id)

      // Notify client it was auto-closed
      const { data: client } = await supabase.from('profiles').select('email, full_name').eq('id', job.client_id).single()
      if (client?.email) {
        await fetch(siteUrl + '/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'warranty_auto_closed',
            to: client.email,
            job_title: job.title,
            issue_title: issue.title,
            cta_url: siteUrl + '/warranty?job_id=' + issue.job_id,
          }),
        }).catch(() => {})
      }
      remindersFired++
    }

    // ── Scope reminder — unsigned after 3 days ─────────────────────────────
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { data: unsignedScopes } = await supabase
      .from('scope_agreements')
      .select('*, job:jobs(id, title, client_id, tradie_id, client:profiles!jobs_client_id_fkey(email, full_name), tradie:tradie_profiles(business_name, profile:profiles(email, full_name)))')
      .is('client_signed_at', null)
      .is('tradie_signed_at', null)
      .lt('created_at', threeDaysAgo)

    for (const scope of (unsignedScopes || [])) {
      const job = Array.isArray(scope.job) ? scope.job[0] : scope.job
      if (!job) continue
      const tradie = Array.isArray(job.tradie) ? job.tradie[0] : job.tradie
      const tradieProf = Array.isArray(tradie?.profile) ? tradie.profile[0] : tradie?.profile
      const client = Array.isArray(job.client) ? job.client[0] : job.client
      const jobUrl = siteUrl + '/agreement?job_id=' + job.id
      // Email tradie
      if (tradieProf?.email) {
        await fetch(siteUrl + '/api/email', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'scope_reminder', to: tradieProf.email, name: tradie?.business_name, job_title: job.title, role:'tradie', cta_url: jobUrl }) }).catch(() => {})
        remindersFired++
      }
      // Email client
      if (client?.email) {
        await fetch(siteUrl + '/api/email', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'scope_reminder', to: client.email, name: client.full_name, job_title: job.title, role:'client', cta_url: jobUrl }) }).catch(() => {})
        remindersFired++
      }
    }

    // ── Sign-off reminder — all milestones approved but no signoff after 3 days ─
    const { data: readyJobs } = await supabase
      .from('jobs')
      .select('id, title, client_id, client:profiles!jobs_client_id_fkey(email, full_name)')
      .eq('status', 'delivery')
      .lt('updated_at', threeDaysAgo)

    for (const rj of (readyJobs || [])) {
      const { data: pendingMs } = await supabase.from('milestones').select('id').eq('job_id', rj.id).neq('status', 'approved')
      if (pendingMs && pendingMs.length === 0) {
        const client = Array.isArray(rj.client) ? rj.client[0] : rj.client
        if (client?.email) {
          await fetch(siteUrl + '/api/email', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ type:'signoff_reminder', to: client.email, name: client.full_name, job_title: rj.title, cta_url: siteUrl + '/signoff?job_id=' + rj.id }) }).catch(() => {})
          remindersFired++
        }
      }
    }

    // ── Re-engagement — no activity for 14 days ──────────────────────────────
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, last_sign_in_at')
      .lt('last_sign_in_at', fourteenDaysAgo)
      .in('role', ['client', 'tradie'])
      .not('email', 'is', null)

    for (const u of (inactiveUsers || [])) {
      await fetch(siteUrl + '/api/email', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'reengagement', to: u.email, full_name: u.full_name, role: u.role }) }).catch(() => {})
      remindersFired++
    }

    // Release the cron lock
    await supabase.from('cron_locks').delete().eq('key', lockKey)

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
