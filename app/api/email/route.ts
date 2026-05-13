import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const FROM = 'Steadyhand <noreply@steadyhandtrade.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.steadyhandtrade.app'
const TEST_REDIRECT = 'info@steadyhanddigital.com'

// Redirect test tradie emails to a single inbox for easier testing
function resolveRecipient(email: string, subject: string): { to: string; subject: string } {
  if (email?.endsWith('@steadyhandtest.com')) {
    return { to: TEST_REDIRECT, subject: `[To: ${email}] ${subject}` }
  }
  return { to: email, subject }
}

// ── Brand template ────────────────────────────────────────────────────────────
function wrap(body: string, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Steadyhand</title>
</head>
<body style="margin:0;padding:0;background:#C8D5D2;font-family:Georgia,serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#C8D5D2;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

      <!-- Header -->
      <tr><td style="background:#0A0A0A;padding:28px 36px;border-radius:12px 12px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;color:rgba(216,228,225,0.4);text-transform:uppercase;font-family:Georgia,serif;">Trade platform</p>
              <h1 style="margin:0;font-size:26px;letter-spacing:4px;color:rgba(216,228,225,0.92);font-family:Georgia,serif;font-weight:400;">STEADYHAND</h1>
            </td>
            <td align="right">
              <span style="display:inline-block;width:36px;height:36px;background:#D4522A;border-radius:50%;"></span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#E8F0EE;padding:32px 36px;">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#0A0A0A;padding:20px 36px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 4px;font-size:11px;color:rgba(216,228,225,0.4);font-family:Georgia,serif;">Steadyhand · Western Australia</p>
        <p style="margin:0;font-size:11px;color:rgba(216,228,225,0.25);font-family:Georgia,serif;">You are receiving this because you have an active job on Steadyhand.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function greeting(name: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#0A0A0A;font-family:Georgia,serif;">Hi ${name},</p>`
}

function para(text: string) {
  return `<p style="margin:0 0 14px;font-size:14px;color:#4A5E64;line-height:1.7;font-family:Georgia,serif;">${text}</p>`
}

function jobCard(title: string, category: string, suburb: string, accentColor: string, extra = '') {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F8F7;border-left:3px solid ${accentColor};border-radius:6px;margin:20px 0;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#0A0A0A;font-family:Georgia,serif;">${title}</p>
      <p style="margin:0;font-size:13px;color:#7A9098;font-family:Georgia,serif;">${category} · ${suburb}</p>
      ${extra}
    </td></tr>
  </table>`
}

function btn(href: string, label: string, color = '#0A0A0A') {
  return `<table cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
    <tr><td style="background:${color};border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:white;text-decoration:none;font-family:Georgia,serif;letter-spacing:0.3px;">${label} →</a>
    </td></tr>
  </table>`
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td style="border-top:1px solid rgba(28,43,50,0.1);"></td></tr>
  </table>`
}

function stageTag(label: string, color: string) {
  return `<span style="display:inline-block;font-size:11px;padding:3px 10px;border-radius:100px;background:${color}18;border:1px solid ${color}40;color:${color};font-family:Georgia,serif;letter-spacing:0.3px;">${label}</span>`
}

// ── Handlers ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, job_id, milestone_id, issue_id } = body

    // ── Tradie selected ───────────────────────────────────────────────────────
    if (type === 'tradie_selected') {
      const { tradie_id } = body
      const { data: job } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      // Look up tradie directly from tradie_id passed in body
      const { data: tradieProf } = tradie_id ? await supabase
        .from('tradie_profiles')
        .select('*, profile:profiles(email, full_name)')
        .eq('id', tradie_id).single() : { data: null }
      const tradieEmail = tradieProf?.profile?.email
      const tradieName = tradieProf?.profile?.full_name || 'there'
      const html = wrap(
        greeting(tradieName) +
        para(`<strong>${job.client.full_name}</strong> has selected you for a job on Steadyhand.`) +
        jobCard(job.title, job.trade_category, job.suburb, '#D4522A',
          `<p style="margin:8px 0 0;font-size:13px;color:#4A5E64;font-family:Georgia,serif;line-height:1.6;">${job.description || ''}</p>`) +
        para('The next step is the consult — a site visit where you and the client see the job together. After that, you will submit your quote and both parties will sign a scope agreement before work begins.') +
        btn(APP_URL + '/tradie/job?job_id=' + job_id, 'View this job request →', '#D4522A'),
        `${job.client.full_name} has selected you for a job`
      )
      if (tradieEmail) await resend.emails.send({ from: FROM, ...resolveRecipient(tradieEmail, `${job.client.full_name} selected you for a job — ${job.title}`), html })
    }

    // ── Milestone submitted ───────────────────────────────────────────────────
    if (type === 'milestone_submitted') {
      const { data: milestone } = await supabase
        .from('milestones')
        .select('*, job:jobs(*, client:profiles!jobs_client_id_fkey(email, full_name), tradie:tradie_profiles(business_name))')
        .eq('id', milestone_id).single()
      if (milestone?.job?.client?.email) {
        const clientName = milestone.job.client.full_name
        const html = wrap(
          greeting(clientName) +
          para(`<strong>${milestone.job.tradie?.business_name || 'Your tradie'}</strong> has submitted a milestone for your approval on the following job:`) +
          jobCard(milestone.job.title, milestone.job.trade_category, milestone.job.suburb, '#C07830',
            `<p style="margin:8px 0 0;font-size:13px;color:#0A0A0A;font-family:Georgia,serif;"><strong>Milestone:</strong> ${milestone.label}</p>${milestone.amount > 0 ? `<p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#2E7D60;font-family:Georgia,serif;">$${Number(milestone.amount).toLocaleString()} AUD</p>` : ''}`) +
          para('Review the completed work and approve the milestone to release payment. If you have any concerns, you can flag an issue from the delivery page before approving.') +
          btn(APP_URL + '/delivery', 'Review and approve milestone', '#2E7D60'),
          `Milestone ready for your approval — ${milestone.label}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(milestone.job.client.email, `Milestone ready for approval — ${milestone.job.title}`), html })
      }
    }

    // ── Warranty issue ────────────────────────────────────────────────────────
    if (type === 'warranty_expiring') {
      const { to, job_title, days_left, cta_url } = body
      if (!to) return NextResponse.json({ error: 'to required' }, { status: 400 })
      await resend.emails.send({
        from: FROM, ...resolveRecipient(to, 'Your workmanship warranty expires in ' + days_left + ' day' + (days_left === 1 ? '' : 's')),
        html: wrap(
          para('Your Steadyhand workmanship warranty for <strong>' + job_title + '</strong> expires in <strong>' + days_left + ' day' + (days_left === 1 ? '' : 's') + '</strong>.') +
          para('If you have noticed any defects in the work, log them now to create a timestamped record before your warranty period closes. Remember — your statutory rights under the Home Building Contracts Act 1991 (WA) continue for 6 years for structural defects regardless of this contractual warranty period.') +
          btn(cta_url || APP_URL + '/warranty', 'Check your warranty record →', '#2E7D60')
        ),
      })
      return NextResponse.json({ sent: true })
    }

    if (type === 'warranty_overdue') {
      const { to, subject, job_title, issue_title, response_due_at } = body
      if (!to) return NextResponse.json({ error: 'to required' }, { status: 400 })
      await resend.emails.send({
        from: FROM, ...resolveRecipient(to, subject || 'Warranty response overdue'),
        html: wrap(
          para('A warranty issue requires your immediate response. The response deadline has passed.') +
          jobCard(job_title, 'Warranty issue', '', '#D4522A') +
          para('<strong>Issue:</strong> ' + issue_title) +
          para('<strong>Response was due:</strong> ' + new Date(response_due_at).toLocaleDateString('en-AU')) +
          para('Failure to respond may result in a complaint to Building and Energy WA or the State Administrative Tribunal.') +
          btn(APP_URL + '/warranty', 'Respond now →', '#D4522A')
        ),
      })
      return NextResponse.json({ sent: true })
    }

    if (type === 'warranty_overdue_client') {
      const { to, subject, job_title, issue_title, cta_url } = body
      if (!to) return NextResponse.json({ error: 'to required' }, { status: 400 })
      await resend.emails.send({
        from: FROM, ...resolveRecipient(to, subject || 'Your warranty issue has not received a response'),
        html: wrap(
          para('The tradie has not responded to your warranty issue within the required timeframe.') +
          jobCard(job_title, 'Warranty issue', '', '#C07830') +
          para('<strong>Issue:</strong> ' + issue_title) +
          para('You may escalate this matter to Building and Energy WA (building.wa.gov.au) or the State Administrative Tribunal. Your Steadyhand compliance record is your evidence.') +
          btn(cta_url || APP_URL + '/warranty', 'View your warranty record →', '#2E7D60')
        ),
      })
      return NextResponse.json({ sent: true })
    }

        if (type === 'warranty_issue') {
      const { data: issue } = await supabase
        .from('warranty_issues')
        .select('*, job:jobs(*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name))')
        .eq('id', issue_id).single()
      if (issue?.job?.tradie?.profile?.email) {
        const tradieName = issue.job.tradie.profile.full_name || 'there'
        const html = wrap(
          greeting(tradieName) +
          para(`<strong>${issue.job.client.full_name}</strong> has logged a warranty issue on a job you completed:`) +
          jobCard(issue.job.title, issue.job.trade_category, issue.job.suburb, '#D4522A',
            `<p style="margin:8px 0 0;font-size:13px;color:#0A0A0A;font-family:Georgia,serif;"><strong>Issue:</strong> ${issue.title}</p><p style="margin:4px 0 0;font-size:13px;color:#4A5E64;font-family:Georgia,serif;">${issue.description || ''}</p>`) +
          para('You have 5 business days to respond. Log in to review the issue and provide a response or arrange a time to return to site.') +
          btn(APP_URL + '/tradie/dashboard', 'View warranty issue', '#D4522A'),
          `Warranty issue logged — ${issue.title}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(issue.job.tradie.profile.email, `Warranty issue raised — ${issue.job.title}`), html })
      }
    }

    // ── Scope updated ─────────────────────────────────────────────────────────
    if (type === 'scope_updated') {
      const reqBody = body
      const { updated_by } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (job) {
        const recipientEmail = updated_by === 'tradie' ? job.client?.email : job.tradie?.profile?.email
        const recipientName = updated_by === 'tradie' ? job.client?.full_name : job.tradie?.profile?.full_name
        const editorName = updated_by === 'tradie' ? job.tradie?.business_name : job.client?.full_name
        if (recipientEmail) {
          const html = wrap(
            greeting(recipientName) +
            para(`<strong>${editorName}</strong> has updated the scope agreement for your job. Please review the changes and add your signature when you are ready.`) +
            jobCard(job.title, job.trade_category, job.suburb, '#6B4FA8') +
            para('Note: any previous signatures have been cleared. Both parties will need to re-sign the updated scope.') +
            btn(APP_URL + '/agreement', 'Review scope agreement', '#6B4FA8'),
            `Scope agreement updated — review required`
          )
          await resend.emails.send({ from: FROM, ...resolveRecipient(recipientEmail, `Scope agreement updated — ${job.title}`), html })
        }
      }
    }

    // ── Quote declined ────────────────────────────────────────────────────────
    if (type === 'quote_declined_others') {
      // Notify all tradies who submitted quotes but were not selected
      const { data: job } = await supabase
        .from('jobs')
        .select('title, trade_category, suburb, client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      const clientName = (Array.isArray(job?.client) ? job.client[0] : job?.client)?.full_name || 'The homeowner'
      const { data: declinedQRs } = await supabase
        .from('quote_requests')
        .select('tradie:tradie_profiles(profile:profiles(email, full_name), business_name)')
        .eq('job_id', job_id)
        .eq('qr_status', 'declined')
        .neq('tradie_id', body.accepted_tradie_id)
      for (const qr of (declinedQRs || [])) {
        const t = Array.isArray(qr.tradie) ? qr.tradie[0] : qr.tradie
        const email = t?.profile?.email
        if (!email) continue
        const html = wrap(
          greeting(t?.business_name || 'there') +
          para(`Thank you for submitting a quote for <strong>${job?.title || 'this job'}</strong>. ${clientName} has decided to proceed with another tradie.`) +
          para('This is no match for your skills — every job is different. Your Steadyhand profile and Dialogue Rating carry forward to your next opportunity.') +
          btn(APP_URL + '/tradie/dashboard', 'View your dashboard →', '#1C2B32'),
          'Quote outcome — ' + (job?.title || 'job update')
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(email, `Quote outcome — ${job?.title || 'your quote'}`), html })
      }
      return NextResponse.json({ sent: true })
    }

        if (type === 'quote_declined') {
      const { tradie_id } = body
      const { data: job } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      const { data: tradieProf } = tradie_id ? await supabase
        .from('tradie_profiles').select('business_name, profile:profiles(full_name)')
        .eq('id', tradie_id).single() : { data: null }
      if (job?.client?.email) {
        const tradieName = (tradieProf as any)?.business_name || 'A tradie'
        const html = wrap(
          greeting(job.client.full_name || 'there') +
          para(`<strong>${tradieName}</strong> is unable to take on your job at this time and has declined the request.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#7A9098') +
          para('You can invite other tradies from your shortlist or search the directory for alternatives.') +
          btn(APP_URL + '/shortlist?job_id=' + job_id, 'Back to shortlist', '#2E6A8F'),
          `Tradie unavailable — ${job.title}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.client.email, `Tradie unavailable — ${job.title}`), html })
      }
    }

    // ── Quote updated ─────────────────────────────────────────────────────────
    if (type === 'quote_updated') {
      const reqBody = body
      const { version } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (job?.tradie?.profile?.email) {
        const html = wrap(
          greeting(job.tradie.profile.full_name || 'there') +
          para(`<strong>${job.client.full_name}</strong> has requested changes to your quote${version ? ` (v${version})` : ''} for the following job:`) +
          jobCard(job.title, job.trade_category, job.suburb, '#C07830') +
          para('Review the client\'s feedback and update your quote when you are ready. Clear communication at this stage leads to a stronger scope agreement.') +
          btn(APP_URL + '/tradie/job?id=' + job_id, 'Review and update quote', '#C07830'),
          `Quote revision requested on ${job.title}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.tradie.profile.email, `Quote revision requested — ${job.title}`), html })
      }
    }

    // ── Consult notes shared ──────────────────────────────────────────────────
    if (type === 'assessment_shared') {
      const reqBody = body
      const { shared_by } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (job) {
        const recipientEmail = shared_by === 'tradie' ? job.client?.email : job.tradie?.profile?.email
        const recipientName = shared_by === 'tradie' ? job.client?.full_name : job.tradie?.profile?.full_name
        const sharerName = shared_by === 'tradie' ? job.tradie?.business_name : job.client?.full_name
        if (recipientEmail) {
          const html = wrap(
            greeting(recipientName) +
            para(`<strong>${sharerName}</strong> has shared their consult notes for the following job. Please review and acknowledge them when you are ready.`) +
            jobCard(job.title, job.trade_category, job.suburb, '#9B6B9B') +
            para('Both parties sharing and acknowledging consult notes creates a clear record of what was discussed before quoting began. This protects you both if the scope is ever disputed.') +
            btn(APP_URL + '/consult', 'Review consult notes', '#9B6B9B'),
            `${sharerName} shared their consult notes`
          )
          await resend.emails.send({ from: FROM, ...resolveRecipient(recipientEmail, `Consult notes shared — ${job.title}`), html })
        }
      }
    }


    // ── Consult reminder ──────────────────────────────────────────────────────
    if (type === 'consult_reminder') {
      const reqBody = body
      const { remind_party } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      const recipientEmail = remind_party === 'tradie' ? job.tradie?.profile?.email : job.client?.email
      const recipientName = remind_party === 'tradie' ? job.tradie?.profile?.full_name : job.client?.full_name
      const otherName = remind_party === 'tradie' ? job.client?.full_name : job.tradie?.business_name

      const html = wrap(
        greeting(recipientName) +
        para(`A gentle reminder that <strong>${otherName}</strong> is waiting for you to share your consult notes for the following job:`) +
        jobCard(job.title, job.trade_category, job.suburb, '#9B6B9B') +
        para('Sharing your notes before quoting begins creates a clear record that protects both parties. It only takes a few minutes.') +
        btn(APP_URL + '/consult', 'Share your consult notes', '#9B6B9B'),
        `Reminder: consult notes needed on ${job.title}`
      )
      await resend.emails.send({ from: FROM, ...resolveRecipient(recipientEmail, `Reminder: consult notes needed — ${job.title}`), html })
    }

    // ── Contribution received ─────────────────────────────────────────────────
    if (type === 'contribution_received') {
      const reqBody = body
      const { amount, message } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      const html = wrap(
        greeting(job.tradie.profile.full_name || 'there') +
        para(`<strong>${job.client.full_name}</strong> has added a voluntary contribution to recognise your work on the following job:`) +
        jobCard(job.title, job.trade_category, job.suburb, '#2E7D60',
          `<p style="margin:10px 0 0;font-size:22px;font-weight:600;color:#2E7D60;font-family:Georgia,serif;">$${amount} AUD</p>` +
          (message ? `<p style="margin:8px 0 0;font-size:13px;color:#4A5E64;font-family:Georgia,serif;font-style:italic;">"${message}"</p>` : '')) +
        para('This contribution has been sent directly to your Stripe account with no platform fee deducted. It reflects the quality of your communication and service throughout this job.') +
        btn(APP_URL + '/tradie/dashboard', 'View your dashboard', '#2E7D60'),
        `${job.client.full_name} added a contribution to your job`
      )
      await resend.emails.send({ from: FROM, ...resolveRecipient(job.tradie.profile.email, `Contribution received — ${job.title}`), html })
    }

    // ── Ready for sign-off ────────────────────────────────────────────────────
    if (type === 'ready_for_signoff') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (job?.client?.email) {
        const html = wrap(
          greeting(job.client.full_name) +
          para(`All milestones on your job with <strong>${job.tradie?.business_name || 'your tradie'}</strong> have been approved. You can now complete the sign-off and begin your warranty period.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#2E7D60') +
          para('Sign-off confirms the job is complete and starts the clock on your warranty. Once signed off, any issues can be logged through Steadyhand during the warranty period.') +
          btn(APP_URL + '/signoff', 'Sign off and start warranty', '#2E7D60'),
          `All milestones approved — ready to sign off`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.client.email, `Ready to sign off — ${job.title}`), html })
      }
    }

    // ── Job signed off ────────────────────────────────────────────────────────
    if (type === 'job_signed_off') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      if (job?.tradie?.profile?.email) {
        const tradieName = job.tradie.profile.full_name || 'there'
        const html = wrap(
          greeting(tradieName) +
          para(`<strong>${job.client.full_name}</strong> has signed off on the completed work. Your warranty period has now started.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#2E7D60') +
          para('If any warranty issues are raised during the warranty period, you will be notified and will have 5 business days to respond. Your Dialogue Rating for this job has been recorded.') +
          btn(APP_URL + '/tradie/dashboard', 'View your dashboard', '#0A0A0A'),
          `${job.client.full_name} has signed off on the job`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.tradie.profile.email, `Job signed off — ${job.title}`), html })
      }
    }

    // ── Quote submitted ───────────────────────────────────────────────────────
    if (type === 'quote_submitted') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (job?.client?.email) {
        const html = wrap(
          greeting(job.client.full_name) +
          para(`<strong>${job.tradie?.business_name || 'Your tradie'}</strong> has submitted a quote for your job.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#C07830') +
          para('Review the quote carefully — check the line items, timeline and assumptions. If you have questions or want changes, you can request a revision before accepting.') +
          btn(APP_URL + '/quotes', 'Review the quote', '#C07830'),
          `${job.tradie?.business_name} has submitted a quote`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.client.email, `New quote received — ${job.title}`), html })
      }
    }

    // ── Scope signed ──────────────────────────────────────────────────────────
    if (type === 'scope_signed') {
      const reqBody = body
      const { signed_by } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (job) {
        const notifyEmail = signed_by === 'tradie' ? job.client?.email : job.tradie?.profile?.email
        const notifyName = signed_by === 'tradie' ? job.client?.full_name : job.tradie?.profile?.full_name
        const signerName = signed_by === 'tradie' ? job.tradie?.business_name : job.client?.full_name
        const isFullySigned = job.scope_agreements?.[0]?.client_signed_at && job.scope_agreements?.[0]?.tradie_signed_at
        if (notifyEmail) {
          const html = wrap(
            greeting(notifyName) +
            para(`<strong>${signerName}</strong> has signed the scope agreement for your job. ${isFullySigned ? 'Both parties have now signed — work can begin.' : 'Your signature is now needed to proceed.'}`) +
            jobCard(job.title, job.trade_category, job.suburb, '#6B4FA8') +
            (isFullySigned
              ? para('The scope is fully signed and locked. Milestones have been set and work can now begin. You will be notified at each milestone for approval.')
              : para('Review the scope carefully before signing. Once both parties have signed, the agreement is locked and milestones will be activated.')) +
            btn(APP_URL + '/agreement', isFullySigned ? 'View signed agreement' : 'Review and sign', '#6B4FA8'),
            isFullySigned ? `Scope agreement fully signed` : `${signerName} has signed — your turn`
          )
          await resend.emails.send({ from: FROM, ...resolveRecipient(notifyEmail, isFullySigned ? `Scope fully signed — ${job.title}` : `${signerName} has signed — ${job.title}`), html })
        }
      }
    }

    // ── Milestone approved (tradie notification) ──────────────────────────────
    if (type === 'milestone_approved') {
      const { data: milestone } = await supabase
        .from('milestones')
        .select('*, job:jobs(*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name))')
        .eq('id', milestone_id).single()
      if (milestone?.job?.tradie?.profile?.email) {
        const tradieName = milestone.job.tradie.profile.full_name || 'there'
        const held = milestone.payment_held
        const html = wrap(
          greeting(tradieName) +
          para(`<strong>${milestone.job.client.full_name}</strong> has approved the milestone <strong>${milestone.label}</strong> on the following job:`) +
          jobCard(milestone.job.title, milestone.job.trade_category, milestone.job.suburb, '#2E7D60',
            held
              ? `<p style="margin:8px 0 0;font-size:13px;color:#C07830;font-family:Georgia,serif;">⏸ Work approved — payment is being held in Steadyhand pending final settlement.</p>`
              : `<p style="margin:8px 0 0;font-size:13px;color:#2E7D60;font-family:Georgia,serif;">✓ Payment released to your account.</p>`) +
          btn(APP_URL + '/tradie/dashboard', 'View your dashboard', '#0A0A0A'),
          held ? `Milestone approved — payment held` : `Milestone approved — payment released`
        )
        await resend.emails.send({ from: FROM, to: milestone.job.tradie.profile.email, subject: held ? `Milestone approved, payment held — ${milestone.job.title}` : `Milestone approved — ${milestone.job.title}`, html })
      }
    }

    // ── Scope ready (notify tradie to draft scope) ───────────────────────────
    if (type === 'scope_ready') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      if (job?.tradie?.profile?.email) {
        const tradieName = job.tradie.profile.full_name || 'there'
        const html = wrap(
          greeting(tradieName) +
          para(`<strong>${job.client.full_name}</strong> has accepted your quote and is waiting for the scope agreement. Please log in and draft the scope so work can begin.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#6B4FA8') +
          para('The scope defines what is included, the payment milestones and warranty terms. Your client will review and sign once you submit.') +
          btn(APP_URL + '/agreement?job_id=' + job_id, 'Draft scope agreement', '#6B4FA8'),
          `${job.client.full_name} accepted your quote — scope needed`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.tradie.profile.email, `Scope agreement needed — ${job.title}`), html })
      }
    }


    // ── Assess reminder (renamed from assess_reminder → consult_reminder alias) ─
    if (type === 'assess_reminder') {
      const reqBody = body
      const { remind_party } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const recipientEmail = remind_party === 'tradie' ? job.tradie?.profile?.email : job.client?.email
      const recipientName = remind_party === 'tradie' ? job.tradie?.profile?.full_name : job.client?.full_name
      const otherName = remind_party === 'tradie' ? job.client?.full_name : job.tradie?.business_name
      if (recipientEmail) {
        const html = wrap(
          greeting(recipientName) +
          para(`A reminder that <strong>${otherName}</strong> is waiting for your consult notes on the following job:`) +
          jobCard(job.title, job.trade_category, job.suburb, '#9B6B9B') +
          btn(APP_URL + '/consult', 'Share your consult notes', '#9B6B9B'),
          `Reminder: consult notes needed`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(recipientEmail, `Reminder: consult notes needed — ${job.title}`), html })
      }
    }

    // ── Direct tradie invite (external — not on platform) ───────────────────────
    if (type === 'tradie_invite') {
      const { email, business_name, personal_message } = body
      if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
      const { data: job } = await supabase
        .from('jobs')
        .select('title, trade_category, suburb, client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const clientData = Array.isArray(job.client) ? job.client[0] : job.client
      const clientName = clientData?.full_name || 'A homeowner'
      const signupUrl = APP_URL + '/join?role=tradie&job_id=' + job_id + '&ref=tradie_invite'
      const html = wrap(
        greeting(business_name || 'there') +
        para(`<strong>${clientName}</strong> would like to invite you to submit an estimate for a job on Steadyhand.`) +
        jobCard(job.title, job.trade_category, job.suburb, '#2E6A8F') +
        (personal_message ? para(`<em>"${personal_message}"</em>`) : '') +
        para('Steadyhand is a trade services platform that manages the full job pipeline — from estimate through to sign-off and warranty. To respond to this invitation, create your free tradie account below.') +
        btn(signupUrl, 'View job and create your account →', '#D4522A'),
        `${clientName} has invited you to quote on Steadyhand`
      )
      await resend.emails.send({ from: FROM, ...resolveRecipient(email, `${clientName} has invited you to quote — ${job.title}`), html,
      })
    }

    // ── Admin broadcast ─────────────────────────────────────────────
    // ── Quote accepted (notify tradie) ──────────────────────────────────────
    if (type === 'quote_accepted') {
      const { tradie_id } = body
      const { data: job } = await supabase.from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      const { data: tradieProf } = tradie_id ? await supabase.from('tradie_profiles')
        .select('*, profile:profiles(email, full_name)').eq('id', tradie_id).single() : { data: null }
      if (job && tradieProf?.profile?.email) {
        const html = wrap(
          greeting(tradieProf.profile.full_name || 'there') +
          para(`<strong>${job.client?.full_name}</strong> has accepted your quote for <strong>${job.title}</strong>. The next step is to draft the scope agreement before work begins.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#2E7D60') +
          btn(APP_URL + '/agreement?job_id=' + job_id, 'Draft scope agreement →', '#2E7D60'),
          `Your quote was accepted — ${job.title}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(tradieProf.profile.email, `Quote accepted — ${job.title}`), html })
      }
    }

    // ── Consult complete (notify both parties vault is filing) ────────────────
    if (type === 'consult_complete') {
      const { data: job } = await supabase.from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email), tradie:tradie_profiles(*, profile:profiles(email, full_name))')
        .eq('id', job_id).single()
      if (job?.client?.email) {
        const clientHtml = wrap(
          greeting(job.client.full_name || 'there') +
          para(`Both you and ${job.tradie?.business_name || 'your tradie'} have acknowledged the consult notes for <strong>${job.title}</strong>. The record has been filed to your Document Vault.`) +
          btn(APP_URL + '/vault', 'View Document Vault →', '#9B6B9B'),
          `Consult record filed — ${job.title}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.client.email, `Consult record filed — ${job.title}`), html: clientHtml })
      }
      if (job?.tradie?.profile?.email) {
        const tradieHtml = wrap(
          greeting(job.tradie.profile.full_name || 'there') +
          para(`Both parties have acknowledged the consult notes for <strong>${job.title}</strong>. The record has been filed to the Document Vault. You can now submit your quote.`) +
          btn(APP_URL + '/tradie/dashboard', 'Go to dashboard →', '#9B6B9B'),
          `Consult record filed — ${job.title}`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.tradie.profile.email, `Consult record filed — ${job.title}`), html: tradieHtml })
      }
    }

    // ── Job cancelled (notify tradies with quote requests) ────────────────────
    if (type === 'job_cancelled') {
      const { data: job } = await supabase.from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      const { data: qrs } = await supabase.from('quote_requests')
        .select('tradie:tradie_profiles(*, profile:profiles(email, full_name))')
        .eq('job_id', job_id)
      for (const qr of (qrs || [])) {
        const email = (qr.tradie as any)?.profile?.email
        const name = (qr.tradie as any)?.profile?.full_name || 'there'
        if (email) {
          const html = wrap(
            greeting(name) +
            para(`The job <strong>${job?.title}</strong> in ${job?.suburb} has been cancelled by the client. No further action is required.`),
            `Job cancelled — ${job?.title}`
          )
          await resend.emails.send({ from: FROM, ...resolveRecipient(email, `Job cancelled — ${job?.title}`), html })
        }
      }
    }

    // ── OB final inspection (notify client all jobs at sign-off) ─────────────
    if (type === 'ob_final_inspection') {
      const { data: job } = await supabase.from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email), diy_project:diy_projects(title)')
        .eq('id', job_id).single()
      if (job?.client?.email) {
        const html = wrap(
          greeting(job.client.full_name || 'there') +
          para(`All jobs in your project <strong>${job.diy_project?.title || 'your project'}</strong> have reached sign-off stage. You can now review and complete the final inspection.`) +
          btn(APP_URL + '/diy', 'View project →', '#D4522A'),
          `All jobs ready for final inspection`
        )
        await resend.emails.send({ from: FROM, ...resolveRecipient(job.client.email, `All jobs ready for final inspection — ${job.diy_project?.title || ''}`), html })
      }
    }

    if (type === 'admin_broadcast') {
      const { subject, body: msgBody, recipients } = body
      if (!subject || !msgBody || !recipients?.length) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }
      const nl = String.fromCharCode(10)
      const htmlBody = wrap(para(String(msgBody).split(nl).join('<br/>')), String(subject))
      const results = await Promise.allSettled(
        (recipients as string[]).map((email: string) =>
          resend.emails.send({ from: FROM, ...resolveRecipient(email, String(subject)), html: htmlBody })
        )
      )
      const sent = results.filter(r => r.status === 'fulfilled').length
      return NextResponse.json({ sent, total: recipients.length })
    }

    return NextResponse.json({ sent: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
