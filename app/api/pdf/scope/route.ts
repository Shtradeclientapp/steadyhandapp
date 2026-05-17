import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')
  if (!jobId) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select('*, scope_agreements(*), milestones(*), client:profiles!jobs_client_id_fkey(full_name, email), tradie:tradie_profiles(business_name, licence_number, abn, phone, profile:profiles(email))')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const scope = Array.isArray(job.scope_agreements) ? job.scope_agreements[0] : job.scope_agreements
  if (!scope) return NextResponse.json({ error: 'No scope agreement found' }, { status: 404 })

  const fullyExecuted = scope.client_signed_at && scope.tradie_signed_at
  const auditLog: any[] = scope.audit_log || []
  const shortId = jobId.slice(0, 8).toUpperCase()

  const STATE_TZ: Record<string, string> = {
    WA: 'Australia/Perth', NSW: 'Australia/Sydney', VIC: 'Australia/Melbourne',
    QLD: 'Australia/Brisbane', SA: 'Australia/Adelaide', TAS: 'Australia/Hobart',
    ACT: 'Australia/Sydney', NT: 'Australia/Darwin',
  }
  const tz = STATE_TZ[job.state || ''] || 'Australia/Sydney'
  const tzAbbr = new Intl.DateTimeFormat('en-AU', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || ''

  const fmt = (d: string | null) => d
    ? new Date(d).toLocaleString('en-AU', { timeZone: tz, dateStyle: 'long', timeStyle: 'short' })
    : 'Not signed'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Scope Agreement SH-${shortId} — Steadyhand</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#1c2b32;padding:48px;max-width:800px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #0a0a0a}
  .logo{font-size:22px;font-weight:700;letter-spacing:2px;color:#d4522a}
  .badge{padding:6px 14px;border-radius:4px;font-size:11px;font-weight:700;background:${fullyExecuted ? '#e8f4f0' : '#fdf0ed'};color:${fullyExecuted ? '#2e7d60' : '#d4522a'};border:1px solid ${fullyExecuted ? '#2e7d60' : '#d4522a'}}
  .section{margin-bottom:24px}
  .section-title{font-size:10px;font-weight:700;color:#7a9098;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e8f0ee}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .label{font-size:10px;color:#7a9098;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
  .value{font-size:13px;color:#0a0a0a}
  .body-text{background:#f4f8f7;border:1px solid #e8f0ee;border-radius:6px;padding:16px;line-height:1.7;white-space:pre-wrap}
  .sig{background:#f4f8f7;border:1px solid #e8f0ee;border-radius:6px;padding:16px;margin-bottom:12px}
  .sig-name{font-size:15px;font-weight:700;color:#0a0a0a;margin-bottom:4px}
  .sig-detail{font-size:11px;color:#4a5e64;margin-bottom:2px}
  .signed{color:#2e7d60;font-weight:600}
  .unsigned{color:#d4522a}
  .audit{background:#0a0a0a;border-radius:6px;padding:20px;margin-top:28px}
  .audit-title{font-size:10px;color:rgba(216,228,225,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px}
  .audit-entry{border-top:1px solid rgba(255,255,255,0.08);padding:10px 0}
  .audit-event{font-size:12px;color:rgba(216,228,225,0.85);font-weight:600;margin-bottom:4px}
  .audit-detail{font-size:11px;color:rgba(216,228,225,0.4);margin-bottom:2px}
  .eta{margin-top:24px;padding:16px;border:1px solid #e8f0ee;border-radius:6px;background:#f4f8f7}
  .eta-title{font-size:10px;font-weight:700;color:#2e7d60;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
  .eta-text{font-size:11px;color:#4a5e64;line-height:1.7}
  .footer{font-size:10px;color:#7a9098;text-align:center;margin-top:20px}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">STEADYHAND</div>
    <div style="font-size:11px;color:#7a9098;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Scope Agreement — Electronically Executed</div>
  </div>
  <div class="badge">${fullyExecuted ? '✓ FULLY EXECUTED' : scope.client_signed_at || scope.tradie_signed_at ? 'PARTIALLY SIGNED' : 'DRAFT'}</div>
</div>

<div class="section">
  <div style="font-size:20px;font-weight:700;color:#0a0a0a;margin-bottom:6px">${job.title || 'Scope Agreement'}</div>
  <div style="font-size:12px;color:#7a9098">Record ID: SH-${shortId} &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-AU', { timeZone: tz })}</div>
</div>

<div class="section">
  <div class="section-title">Parties</div>
  <div class="grid">
    <div>
      <div class="label">Client</div>
      <div class="value">${job.client?.full_name || 'Unknown'}</div>
      <div style="font-size:11px;color:#7a9098">${job.client?.email || ''}</div>
    </div>
    <div>
      <div class="label">Trade Business</div>
      <div class="value">${job.tradie?.business_name || 'Unknown'}</div>
      ${job.tradie?.licence_number ? `<div style="font-size:11px;color:#7a9098">Licence: ${job.tradie.licence_number}</div>` : ''}
      ${job.tradie?.abn ? `<div style="font-size:11px;color:#7a9098">ABN: ${job.tradie.abn}</div>` : ''}
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Job Details</div>
  <div class="grid">
    <div><div class="label">Location</div><div class="value">${[job.suburb, job.state].filter(Boolean).join(', ') || 'Not specified'}</div></div>
    <div><div class="label">Agreed Total</div><div class="value">${scope.quote_total ? '$' + Number(scope.quote_total).toLocaleString('en-AU') : 'As per quote'}</div></div>
    <div><div class="label">Warranty Period</div><div class="value">${job.warranty_period || 90} days from signoff</div></div>
    <div><div class="label">Start Date</div><div class="value">${scope.start_date ? new Date(scope.start_date).toLocaleDateString('en-AU') : 'To be confirmed'}</div></div>
  </div>
</div>

${scope.scope_description ? `<div class="section"><div class="section-title">Scope of Work</div><div class="body-text">${scope.scope_description}</div></div>` : ''}
${scope.inclusions ? `<div class="section"><div class="section-title">Inclusions</div><div class="body-text">${scope.inclusions}</div></div>` : ''}
${scope.exclusions ? `<div class="section"><div class="section-title">Exclusions</div><div class="body-text">${scope.exclusions}</div></div>` : ''}

<div class="section">
  <div class="section-title">Electronic Signatures</div>
  <div class="sig">
    <div class="sig-name">${job.client?.full_name || 'Client'}</div>
    <div class="sig-detail">Role: Client / Principal &nbsp;|&nbsp; Email: ${job.client?.email || 'Not recorded'}</div>
    ${scope.client_signed_at
      ? `<div class="sig-detail signed">✓ Signed: ${fmt(scope.client_signed_at)} ${tzAbbr}</div>${scope.client_ip ? `<div class="sig-detail">IP: ${scope.client_ip}</div>` : ''}`
      : '<div class="sig-detail unsigned">⚠ Not yet signed</div>'}
  </div>
  <div class="sig">
    <div class="sig-name">${job.tradie?.business_name || 'Trade Business'}</div>
    <div class="sig-detail">Role: Contractor &nbsp;|&nbsp; Email: ${(job.tradie as any)?.profile?.email || 'Not recorded'}</div>
    ${scope.tradie_signed_at
      ? `<div class="sig-detail signed">✓ Signed: ${fmt(scope.tradie_signed_at)} ${tzAbbr}</div>${scope.tradie_ip ? `<div class="sig-detail">IP: ${scope.tradie_ip}</div>` : ''}`
      : '<div class="sig-detail unsigned">⚠ Not yet signed</div>'}
  </div>
</div>

${auditLog.length ? `
<div class="audit">
  <div class="audit-title">Audit Trail — Signature Events</div>
  ${auditLog.map((e: any) => `
  <div class="audit-entry">
    <div class="audit-event">${e.event === 'client_signed' ? '✓ Client signed' : '✓ Contractor signed'}</div>
    <div class="audit-detail">User: ${e.email || e.user_id}</div>
    <div class="audit-detail">Time: ${fmt(e.timestamp)} ${tzAbbr}</div>
    <div class="audit-detail">IP address: ${e.ip}</div>
    <div class="audit-detail">Device: ${(e.user_agent || '').substring(0, 80)}</div>
    <div class="audit-detail">Compliance: ${e.act_compliance || 'Electronic Transactions Act 1999 (Cth)'}</div>
  </div>`).join('')}
</div>` : ''}

<div class="eta">
  <div class="eta-title">Electronic Transactions Act Compliance</div>
  <div class="eta-text">
    This document has been executed electronically in accordance with the <em>Electronic Transactions Act 1999</em> (Cth) and the applicable state electronic transactions legislation. Each electronic signature was applied using a method that identified the signatory and indicated their intention to be bound by this agreement. The method used was reliable and appropriate given the circumstances, including the nature of the transaction and the parties involved. Both parties consented to transact electronically by using the Steadyhand platform. The signatures are attached to and logically associated with this document.<br><br>
    Steadyhand Digital Pty Ltd operates as a documentation and job management platform and is not a party to this agreement. This document and its audit trail constitute the primary evidentiary record of the parties' agreement. Steadyhand does not adjudicate disputes arising from this agreement.<br><br>
    Generated: ${new Date().toLocaleString('en-AU', { timeZone: tz, dateStyle: 'long', timeStyle: 'long' })} ${tzAbbr}
  </div>
</div>

<div class="footer">SH-${shortId} &nbsp;|&nbsp; steadyhandtrade.app &nbsp;|&nbsp; support@steadyhanddigital.com</div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="scope-agreement-SH-${shortId}.html"`,
    },
  })
}
