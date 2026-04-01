import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FROM = 'Steadyhand <onboarding@resend.dev>'

export async function POST(request: NextRequest) {
  try {
    const { type, job_id, milestone_id, issue_id } = await request.json()

    if (type === 'tradie_selected') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id)
        .single()

      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      await resend.emails.send({
        from: FROM,
        to: job.tradie.profile.email,
        subject: 'You have been selected for a job on Steadyhand',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <h1 style="font-size:24px;color:#1C2B32;letter-spacing:2px;">STEADYHAND</h1>
            <p style="color:#4A5E64;">Hi ${job.tradie.profile.full_name},</p>
            <p style="color:#4A5E64;">You have been selected by <strong>${job.client.full_name}</strong> for the following job:</p>
            <div style="background:#F4F8F7;border-left:3px solid #D4522A;padding:16px;margin:20px 0;border-radius:6px;">
              <h2 style="font-size:18px;color:#1C2B32;margin:0 0 8px;">${job.title}</h2>
              <p style="color:#4A5E64;margin:0 0 4px;">${job.trade_category} · ${job.suburb}</p>
              <p style="color:#4A5E64;margin:0;">${job.description}</p>
            </div>
            <p style="color:#4A5E64;">The client has been notified and will draft a scope agreement shortly. You will need to review and sign the scope before work begins.</p>
            <a href="https://steadyhandapp.vercel.app/tradie/dashboard" style="display:inline-block;background:#1C2B32;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View job on Steadyhand</a>
            <p style="color:#7A9098;font-size:12px;margin-top:32px;">Steadyhand · Western Australia</p>
          </div>
        `
      })
    }

    if (type === 'milestone_submitted') {
      const { data: milestone } = await supabase
        .from('milestones')
        .select('*, job:jobs(*, client:profiles!jobs_client_id_fkey(email, full_name), tradie:tradie_profiles(business_name))')
        .eq('id', milestone_id)
        .single()

      if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

      await resend.emails.send({
        from: FROM,
        to: milestone.job.client.email,
        subject: 'Milestone ready for your approval — ' + milestone.label,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">mkdir -p app/api/email
cat > app/api/email/route.ts << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FROM = 'Steadyhand <onboarding@resend.dev>'

export async function POST(request: NextRequest) {
  try {
    const { type, job_id, milestone_id, issue_id } = await request.json()

    if (type === 'tradie_selected') {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', job_id)
        .single()

      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      await resend.emails.send({
        from: FROM,
        to: job.tradie.profile.email,
        subject: 'You have been selected for a job on Steadyhand',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <h1 style="font-size:24px;color:#1C2B32;letter-spacing:2px;">STEADYHAND</h1>
            <p style="color:#4A5E64;">Hi ${job.tradie.profile.full_name},</p>
            <p style="color:#4A5E64;">You have been selected by <strong>${job.client.full_name}</strong> for the following job:</p>
            <div style="background:#F4F8F7;border-left:3px solid #D4522A;padding:16px;margin:20px 0;border-radius:6px;">
              <h2 style="font-size:18px;color:#1C2B32;margin:0 0 8px;">${job.title}</h2>
              <p style="color:#4A5E64;margin:0 0 4px;">${job.trade_category} · ${job.suburb}</p>
              <p style="color:#4A5E64;margin:0;">${job.description}</p>
            </div>
            <p style="color:#4A5E64;">The client has been notified and will draft a scope agreement shortly. You will need to review and sign the scope before work begins.</p>
            <a href="https://steadyhandapp.vercel.app/tradie/dashboard" style="display:inline-block;background:#1C2B32;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View job on Steadyhand</a>
            <p style="color:#7A9098;font-size:12px;margin-top:32px;">Steadyhand · Western Australia</p>
          </div>
        `
      })
    }

    if (type === 'milestone_submitted') {
      const { data: milestone } = await supabase
        .from('milestones')
        .select('*, job:jobs(*, client:profiles!jobs_client_id_fkey(email, full_name), tradie:tradie_profiles(business_name))')
        .eq('id', milestone_id)
        .single()

      if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

      await resend.emails.send({
        from: FROM,
        to: milestone.job.client.email,
        subject: 'Milestone ready for your approval — ' + milestone.label,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <h1 style="font-size:24px;color:#1C2B32;letter-spacing:2px;">STEADYHAND</h1>
            <p style="color:#4A5E64;">Hi ${milestone.job.client.full_name},</p>
            <p style="color:#4A5E64;"><strong>${milestone.job.tradie.business_name}</strong> has marked a milestone as complete on your job:</p>
            <div style="background:#F4F8F7;border-left:3px solid #C07830;padding:16px;margin:20px 0;border-radius:6px;">
              <h2 style="font-size:18px;color:#1C2B32;margin:0 0 8px;">${milestone.label}</h2>
              <p style="color:#4A5E64;margin:0;">${milestone.description}</p>
              <p style="color:#4A5E64;margin:8px 0 0;">${milestone.percent}% of total project</p>
            </div>
            <p style="color:#4A5E64;">Please review and approve this milestone to release the payment for this stage.</p>
            <a href="https://steadyhandapp.vercel.app/delivery" style="display:inline-block;background:#C07830;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Review milestone</a>
            <p style="color:#7A9098;font-size:12px;margin-top:32px;">Steadyhand · Western Australia</p>
          </div>
        `
      })
    }

    if (type === 'warranty_issue') {
      const { data: issue } = await supabase
        .from('warranty_issues')
        .select('*, job:jobs(*, tradie:tradie_profiles(*, profile:profiles(email, full_name)), client:profiles!jobs_client_id_fkey(full_name))')
        .eq('id', issue_id)
        .single()

      if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

      const severityColor: Record<string, string> = {
        minor: '#7A9098', moderate: '#C07830', serious: '#D4522A', critical: '#6B4FA8'
      }

      await resend.emails.send({
        from: FROM,
        to: issue.job.tradie.profile.email,
        subject: 'Warranty issue logged — ' + issue.title,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <h1 style="font-size:24px;color:#1C2B32;letter-spacing:2px;">STEADYHAND</h1>
            <p style="color:#4A5E64;">Hi ${issue.job.tradie.profile.full_name},</p>
            <p style="color:#4A5E64;"><strong>${issue.job.client.full_name}</strong> has logged a warranty issue on your completed job:</p>
            <div style="background:#F4F8F7;border-left:3px solid ${severityColor[issue.severity] || '#D4522A'};padding:16px;margin:20px 0;border-radius:6px;">
              <h2 style="font-size:18px;color:#1C2B32;margin:0 0 8px;">${issue.title}</h2>
              <p style="color:#4A5E64;margin:0 0 8px;">${issue.description}</p>
              <p style="color:${severityColor[issue.severity] || '#D4522A'};margin:0;font-weight:500;text-transform:capitalize;">Severity: ${issue.severity}</p>
            </div>
            <p style="color:#4A5E64;">You must respond within <strong>5 business days</strong> under the Steadyhand warranty terms. Failure to respond may result in Steadyhand mediating the issue.</p>
            <a href="https://steadyhandapp.vercel.app/tradie/dashboard" style="display:inline-block;background:#D4522A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View warranty issue</a>
            <p style="color:#7A9098;font-size:12px;margin-top:32px;">Steadyhand · Western Australia</p>
          </div>
        `
      })
    }

    return NextResponse.json({ sent: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
