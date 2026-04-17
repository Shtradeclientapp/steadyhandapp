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
      <tr><td style="background:#1C2B32;padding:28px 36px;border-radius:12px 12px 0 0;">
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
      <tr><td style="background:#1C2B32;padding:20px 36px;border-radius:0 0 12px 12px;">
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
  return `<p style="margin:0 0 16px;font-size:15px;color:#1C2B32;font-family:Georgia,serif;">Hi ${name},</p>`
}

function para(text: string) {
  return `<p style="margin:0 0 14px;font-size:14px;color:#4A5E64;line-height:1.7;font-family:Georgia,serif;">${text}</p>`
}

function jobCard(title: string, category: string, suburb: string, accentColor: string, extra = '') {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F8F7;border-left:3px solid ${accentColor};border-radius:6px;margin:20px 0;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1C2B32;font-family:Georgia,serif;">${title}</p>
      <p style="margin:0;font-size:13px;color:#7A9098;font-family:Georgia,serif;">${category} · ${suburb}</p>
      ${extra}
    </td></tr>
  </table>`
}

function btn(href: string, label: string, color = '#1C2B32') {
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
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      const tradieName = job.tradie?.profile?.full_name || 'there'
      const html = wrap(
        greeting(tradieName) +
        para(`<strong>${job.client.full_name}</strong> has selected you for a job on Steadyhand.`) +
        jobCard(job.title, job.trade_category, job.suburb, '#D4522A',
          `<p style="margin:8px 0 0;font-size:13px;color:#4A5E64;font-family:Georgia,serif;line-height:1.6;">${job.description || ''}</p>`) +
        para('The next step is the consult — a site visit where you and the client see the job together. After that, you will submit your quote and both parties will sign a scope agreement before work begins.') +
        btn(APP_URL + '/tradie/dashboard', 'View job on Steadyhand', '#D4522A'),
        `${job.client.full_name} has selected you for a job`
      )
      await resend.emails.send({ from: FROM, to: job.tradie.profile.email, subject: `${job.client.full_name} selected you for a job — ${job.title}`, html })
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
            `<p style="margin:8px 0 0;font-size:13px;color:#1C2B32;font-family:Georgia,serif;"><strong>Milestone:</strong> ${milestone.label}</p>${milestone.amount > 0 ? `<p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#2E7D60;font-family:Georgia,serif;">$${Number(milestone.amount).toLocaleString()} AUD</p>` : ''}`) +
          para('Review the completed work and approve the milestone to release payment. If you have any concerns, you can flag an issue from the delivery page before approving.') +
          btn(APP_URL + '/delivery', 'Review and approve milestone', '#2E7D60'),
          `Milestone ready for your approval — ${milestone.label}`
        )
        await resend.emails.send({ from: FROM, to: milestone.job.client.email, subject: `Milestone ready for approval — ${milestone.job.title}`, html })
      }
    }

    // ── Warranty issue ────────────────────────────────────────────────────────
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
            `<p style="margin:8px 0 0;font-size:13px;color:#1C2B32;font-family:Georgia,serif;"><strong>Issue:</strong> ${issue.title}</p><p style="margin:4px 0 0;font-size:13px;color:#4A5E64;font-family:Georgia,serif;">${issue.description || ''}</p>`) +
          para('You have 5 business days to respond. Log in to review the issue and provide a response or arrange a time to return to site.') +
          btn(APP_URL + '/tradie/dashboard', 'View warranty issue', '#D4522A'),
          `Warranty issue logged — ${issue.title}`
        )
        await resend.emails.send({ from: FROM, to: issue.job.tradie.profile.email, subject: `Warranty issue raised — ${issue.job.title}`, html })
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
          await resend.emails.send({ from: FROM, to: recipientEmail, subject: `Scope agreement updated — ${job.title}`, html })
        }
      }
    }

    // ── Quote declined ────────────────────────────────────────────────────────
    if (type === 'quote_declined') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', job_id).single()
      if (job?.tradie?.profile?.email) {
        const tradieName = job.tradie.profile.full_name || 'there'
        const html = wrap(
          greeting(tradieName) +
          para(`<strong>${job.client.full_name}</strong> has decided not to proceed with your quote for the following job:`) +
          jobCard(job.title, job.trade_category, job.suburb, '#7A9098') +
          para('This is part of the process — clients sometimes go in a different direction. Your Dialogue Rating reflects the quality of your communication throughout, regardless of the outcome.') +
          btn(APP_URL + '/tradie/dashboard', 'Back to your dashboard', '#1C2B32'),
          `Quote not accepted on ${job.title}`
        )
        await resend.emails.send({ from: FROM, to: job.tradie.profile.email, subject: `Quote not accepted — ${job.title}`, html })
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
        await resend.emails.send({ from: FROM, to: job.tradie.profile.email, subject: `Quote revision requested — ${job.title}`, html })
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
          await resend.emails.send({ from: FROM, to: recipientEmail, subject: `Consult notes shared — ${job.title}`, html })
        }
      }
    }

    // ── Quote requests sent ───────────────────────────────────────────────────
    if (type === 'quote_requests_sent') {
      const reqBody = body
      const { qr_ids } = reqBody
      const { data: job } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id).single()
      const { data: qrs } = await supabase
        .from('quote_requests')
        .select('*, tradie:tradie_profiles(business_name, profile:profiles(email, full_name))')
        .in('id', qr_ids || [])

      if (job?.client?.email) {
        const tradieNames = (qrs || []).map((qr: any) => qr.tradie?.business_name || qr.tradie?.profile?.full_name).filter(Boolean)
        const html = wrap(
          greeting(job.client.full_name) +
          para(`You have sent quote requests to ${tradieNames.length} tradie${tradieNames.length !== 1 ? 's' : ''}: <strong>${tradieNames.join(', ')}</strong>.`) +
          jobCard(job.title, job.trade_category, job.suburb, '#9B6B9B') +
          para('Each tradie will be in touch to arrange a site visit. The consult is where they assess the job in person before quoting. You will be notified when quotes are submitted.') +
          btn(APP_URL + '/consult', 'Track your job progress', '#1C2B32'),
          `Quote requests sent to ${tradieNames.length} tradie${tradieNames.length !== 1 ? 's' : ''}`
        )
        await resend.emails.send({ from: FROM, to: job.client.email, subject: `Quote requests sent — ${job.title}`, html })
      }

      for (const qr of (qrs || [])) {
        const tradieEmail = (qr.tradie as any)?.profile?.email
        const tradieName = (qr.tradie as any)?.profile?.full_name || (qr.tradie as any)?.business_name
        if (tradieEmail) {
          const html = wrap(
            greeting(tradieName) +
            para(`<strong>${job?.client?.full_name}</strong> has sent you a quote request on Steadyhand.`) +
            jobCard(job?.title || '', job?.trade_category || '', job?.suburb || '', '#9B6B9B',
              `<p style="margin:8px 0 0;font-size:13px;color:#4A5E64;font-family:Georgia,serif;line-height:1.6;">${job?.description || ''}</p>`) +
            para('To get started, propose a time for a site visit. After the consult, record your observations and submit your quote. Clear communication at this stage builds your Dialogue Rating.') +
            btn(APP_URL + '/tradie/dashboard', 'View job and propose a time', '#9B6B9B'),
            `New quote request from ${job?.client?.full_name}`
          )
          await resend.emails.send({ from: FROM, to: tradieEmail, subject: `New quote request — ${job?.title}`, html })
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
      await resend.emails.send({ from: FROM, to: recipientEmail, subject: `Reminder: consult notes needed — ${job.title}`, html })
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
      await resend.emails.send({ from: FROM, to: job.tradie.profile.email, subject: `Contribution received — ${job.title}`, html })
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
        await resend.emails.send({ from: FROM, to: job.client.email, subject: `Ready to sign off — ${job.title}`, html })
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
          btn(APP_URL + '/tradie/dashboard', 'View your dashboard', '#1C2B32'),
          `${job.client.full_name} has signed off on the job`
        )
        await resend.emails.send({ from: FROM, to: job.tradie.profile.email, subject: `Job signed off — ${job.title}`, html })
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
        await resend.emails.send({ from: FROM, to: job.client.email, subject: `New quote received — ${job.title}`, html })
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
            para(`<strong>${signerName}</strong> has signed the scope agreement for your job. ${isFullySigned ? 'Both parties have now signed — work can begin.' : 'Your signature is now needed to proceed.'}`),
            jobCard(job.title, job.trade_category, job.suburb, '#6B4FA8') +
            (isFullySigned
              ? para('The scope is fully signed and locked. Milestones have been set and work can now begin. You will be notified at each milestone for approval.')
              : para('Review the scope carefully before signing. Once both parties have signed, the agreement is locked and milestones will be activated.')) +
            btn(APP_URL + '/agreement', isFullySigned ? 'View signed agreement' : 'Review and sign', '#6B4FA8'),
            isFullySigned ? `Scope agreement fully signed` : `${signerName} has signed — your turn`
          )
          await resend.emails.send({ from: FROM, to: notifyEmail, subject: isFullySigned ? `Scope fully signed — ${job.title}` : `${signerName} has signed — ${job.title}`, html })
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
          btn(APP_URL + '/tradie/dashboard', 'View your dashboard', '#1C2B32'),
          held ? `Milestone approved — payment held` : `Milestone approved — payment released`
        )
        await resend.emails.send({ from: FROM, to: milestone.job.tradie.profile.email, subject: held ? `Milestone approved, payment held — ${milestone.job.title}` : `Milestone approved — ${milestone.job.title}`, html })
      }
    }

    return NextResponse.json({ sent: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
