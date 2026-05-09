import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('job_id')
  if (!jobId) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

  const { data: job } = await supabase
    .from('jobs')
    .select('*, client:profiles!jobs_client_id_fkey(full_name, email)')
    .eq('id', jobId).single()
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: qrs } = await supabase
    .from('quote_requests')
    .select('*, tradie:tradie_profiles(business_name, licence_number, trade_categories, service_areas, profile:profiles(email, full_name))')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

  const shortId = jobId.slice(0, 8).toUpperCase()
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' }) : '—'
  const accepted = (qrs || []).find((q: any) => q.qr_status === 'accepted')

  const statusColor: Record<string, string> = {
    accepted: '#2E7D60', declined: '#D4522A', pending: '#C07830', invited: '#2E6A8F', requested: '#7A9098'
  }

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Shortlist Record SH-${shortId} — Steadyhand</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#1C2B32;padding:48px;max-width:820px;margin:0 auto;line-height:1.6}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #0A0A0A}
  .logo{font-size:20px;font-weight:700;letter-spacing:2px;color:#D4522A}
  .doc-type{font-size:11px;color:#7A9098;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  .section{margin-bottom:24px}
  .section-title{font-size:10px;font-weight:700;color:#7A9098;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E8F0EE}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px}
  .label{font-size:10px;color:#7A9098;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
  .value{font-size:13px;color:#0A0A0A;font-weight:500}
  .sub{font-size:11px;color:#7A9098;margin-top:2px}
  .tradie-card{border:1px solid #E8F0EE;border-radius:8px;overflow:hidden;margin-bottom:10px}
  .tradie-header{background:#F4F8F7;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
  .tradie-body{padding:12px 16px}
  .status-badge{padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;color:white}
  .accepted-banner{background:#E8F4F0;border:2px solid #2E7D60;border-radius:8px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px}
  .notice{background:#F4F8F7;border:1px solid #E8F0EE;border-radius:6px;padding:12px 16px;font-size:11px;color:#4A5E64;line-height:1.7;margin-top:20px}
  .footer{font-size:10px;color:#9AA5AA;text-align:center;margin-top:32px;padding-top:12px;border-top:1px solid #E8F0EE}
</style></head><body>

<div class="header">
  <div>
    <div class="logo">STEADYHAND</div>
    <div class="doc-type">Shortlist Record</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:16px;font-weight:700;color:#0A0A0A;margin-bottom:6px">${job.title || 'Job'}</div>
    <span style="padding:5px 12px;border-radius:4px;font-size:11px;font-weight:700;background:#E8F0EE;color:#2E6A8F;border:1px solid #2E6A8F">${(qrs || []).length} tradie${(qrs || []).length !== 1 ? 's' : ''} invited</span>
  </div>
</div>

<div class="section">
  <div class="section-title">Job Details</div>
  <div class="grid">
    <div><div class="label">Job ID</div><div class="value">SH-${shortId}</div></div>
    <div><div class="label">Location</div><div class="value">${job.suburb || '—'}, WA</div></div>
    <div><div class="label">Trade</div><div class="value">${job.trade_category || '—'}</div></div>
    <div><div class="label">Client</div><div class="value">${job.client?.full_name || '—'}</div></div>
    <div><div class="label">Request date</div><div class="value">${fmtDate(job.created_at)}</div></div>
    <div><div class="label">Status</div><div class="value">${(job.status || '').replace(/_/g,' ')}</div></div>
  </div>
</div>

${accepted ? `
<div class="accepted-banner">
  <div style="font-size:24px">✓</div>
  <div>
    <div style="font-size:14px;font-weight:700;color:#2E7D60">${accepted.tradie?.business_name || 'Tradie'} accepted this job</div>
    <div style="font-size:12px;color:#4A5E64;margin-top:2px">Accepted ${fmtDate(accepted.updated_at || accepted.created_at)} · Proceeded to consult stage</div>
  </div>
</div>` : ''}

<div class="section">
  <div class="section-title">All Tradies Invited (${(qrs || []).length})</div>
  ${(qrs || []).map((qr: any) => `
  <div class="tradie-card">
    <div class="tradie-header">
      <div>
        <div class="value">${qr.tradie?.business_name || 'External invite'}</div>
        <div class="sub">${qr.tradie?.trade_categories?.join(', ') || '—'}</div>
      </div>
      <span class="status-badge" style="background:${statusColor[qr.qr_status || qr.status] || '#7A9098'}">${(qr.qr_status || qr.status || 'pending').toUpperCase()}</span>
    </div>
    <div class="tradie-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div><div class="label">Email</div><div class="sub">${qr.tradie?.profile?.email || qr.notes ? JSON.parse(qr.notes || '{}').email || '—' : '—'}</div></div>
        <div><div class="label">Licence</div><div class="sub">${qr.tradie?.licence_number || '—'}</div></div>
        <div><div class="label">Invited</div><div class="sub">${fmtDate(qr.requested_at || qr.created_at)}</div></div>
      </div>
      ${qr.qr_status === 'declined' ? `<div style="margin-top:8px;font-size:11px;color:#D4522A">✗ Declined — did not proceed</div>` : ''}
      ${qr.qr_status === 'accepted' ? `<div style="margin-top:8px;font-size:11px;color:#2E7D60">✓ Accepted — proceeded to consult ${fmtDate(qr.updated_at)}</div>` : ''}
    </div>
  </div>`).join('')}
</div>

<div class="notice">
  This shortlist record documents all trade businesses invited to quote on this job, their responses, and the outcome of the selection process. It is part of the complete electronic audit trail for this job. Steadyhand Digital Pty Ltd is not a party to any agreement between the parties named above.
</div>

<div class="footer">SH-${shortId} &nbsp;·&nbsp; Shortlist Record &nbsp;·&nbsp; steadyhandtrade.app &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-AU')}</div>
</body></html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="shortlist-record-SH-${shortId}.html"`,
    }
  })
}
