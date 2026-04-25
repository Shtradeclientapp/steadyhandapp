import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('job_id')
  if (!jobId) return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })

  const { data: job } = await serviceClient
    .from('jobs')
    .select('*, tradie:tradie_profiles(business_name, licence_number, abn, trade_categories, preferred_products), client:profiles!jobs_client_id_fkey(full_name, email)')
    .eq('id', jobId)
    .single()

  const { data: scope } = await serviceClient
    .from('scope_agreements')
    .select('inclusions, total_price, warranty_days')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: issues } = await serviceClient
    .from('warranty_issues')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const warrantyEnd = job.warranty_ends_at
    ? new Date(job.warranty_ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const signoffDate = job.signoff_at
    ? new Date(job.signoff_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const products = Array.isArray(job.tradie?.preferred_products) ? job.tradie.preferred_products : []
  const inclusions = Array.isArray(scope?.inclusions) ? scope.inclusions : []

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1C3B50; padding: 48px; line-height: 1.6; }
  .header { background: #1C3B50; color: white; padding: 28px 32px; margin: -48px -48px 32px; display: flex; justify-content: space-between; align-items: center; }
  .brand { font-size: 22px; font-weight: 700; color: #D4522A; letter-spacing: 2px; }
  .cert-title { font-size: 16px; color: rgba(216,228,225,0.8); margin-top: 4px; }
  .shield { font-size: 48px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; color: #7A9098; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #E8F0EE; padding-bottom: 4px; }
  .info-row { display: flex; gap: 8px; margin-bottom: 4px; }
  .info-label { font-weight: 600; min-width: 160px; color: #1C3B50; }
  .info-value { color: #333; }
  .warranty-banner { background: #E8F0EE; border: 2px solid #2E7D60; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .warranty-days { font-size: 32px; font-weight: 700; color: #2E7D60; }
  .warranty-label { font-size: 12px; color: #7A9098; }
  .warranty-end { text-align: right; }
  .warranty-end-date { font-size: 16px; font-weight: 600; color: #1C3B50; }
  .product-row { background: #F4F8F7; border: 1px solid #E8F0EE; border-radius: 6px; padding: 10px 14px; margin-bottom: 6px; }
  .product-name { font-weight: 600; }
  .product-meta { font-size: 11px; color: #7A9098; margin-top: 2px; }
  .issue-row { border-left: 3px solid #D4522A; padding: 8px 12px; margin-bottom: 8px; background: #FFF8F6; }
  .issue-title { font-weight: 600; }
  .issue-meta { font-size: 11px; color: #7A9098; }
  .footer { margin-top: 40px; border-top: 1px solid #E8F0EE; padding-top: 12px; font-size: 10px; color: #9AA5AA; display: flex; justify-content: space-between; }
  .disclaimer { background: #F4F8F7; border: 1px solid #E8F0EE; border-radius: 6px; padding: 12px 16px; font-size: 11px; color: #7A9098; line-height: 1.5; margin-bottom: 24px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">STEADYHAND</div>
      <div class="cert-title">Warranty Certificate</div>
    </div>
    <div class="shield">🛡</div>
  </div>

  <div class="warranty-banner">
    <div>
      <div class="warranty-days">${job.warranty_period || 90} days</div>
      <div class="warranty-label">Workmanship warranty period</div>
      <div style="font-size:12px;color:#7A9098;margin-top:4px">Commenced ${signoffDate}</div>
    </div>
    <div class="warranty-end">
      <div class="warranty-label">Warranty expires</div>
      <div class="warranty-end-date">${warrantyEnd}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Job Details</div>
    <div class="info-row"><span class="info-label">Job</span><span class="info-value">${job.title}</span></div>
    <div class="info-row"><span class="info-label">Trade category</span><span class="info-value">${job.trade_category || '—'}</span></div>
    <div class="info-row"><span class="info-label">Location</span><span class="info-value">${job.suburb || '—'}</span></div>
    <div class="info-row"><span class="info-label">Signed off</span><span class="info-value">${signoffDate}</span></div>
    ${scope?.total_price ? `<div class="info-row"><span class="info-label">Agreed price</span><span class="info-value">$${Number(scope.total_price).toLocaleString()}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Parties</div>
    <div class="info-row"><span class="info-label">Client</span><span class="info-value">${job.client?.full_name || '—'}</span></div>
    <div class="info-row"><span class="info-label">Trade business</span><span class="info-value">${job.tradie?.business_name || '—'}</span></div>
    ${job.tradie?.licence_number ? `<div class="info-row"><span class="info-label">Licence number</span><span class="info-value">${job.tradie.licence_number}</span></div>` : ''}
    ${job.tradie?.abn ? `<div class="info-row"><span class="info-label">ABN</span><span class="info-value">${job.tradie.abn}</span></div>` : ''}
  </div>

  ${inclusions.length > 0 ? `
  <div class="section">
    <div class="section-title">Work Completed</div>
    <ul style="padding-left:20px">${inclusions.map((i: string) => `<li>${i}</li>`).join('')}</ul>
  </div>` : ''}

  ${products.length > 0 ? `
  <div class="section">
    <div class="section-title">Products & Materials Installed</div>
    <p style="font-size:11px;color:#7A9098;margin-bottom:10px">The following products were declared by the tradie at the time of work. Manufacturer warranties are separate from the workmanship warranty above and are subject to the manufacturer's own terms.</p>
    ${products.map((p: any) => `
    <div class="product-row">
      <div class="product-name">${p.name || '—'}${p.brand ? ' — ' + p.brand : ''}</div>
      <div class="product-meta">${p.warranty_years ? 'Manufacturer warranty: ' + p.warranty_years + ' year' + (p.warranty_years !== '1' ? 's' : '') : 'Manufacturer warranty: not specified'}${p.notes ? ' · ' + p.notes : ''}</div>
    </div>`).join('')}
  </div>` : ''}

  ${issues && issues.length > 0 ? `
  <div class="section">
    <div class="section-title">Warranty Issues Logged</div>
    ${issues.map((iss: any) => `
    <div class="issue-row">
      <div class="issue-title">${iss.title}</div>
      <div class="issue-meta">${iss.severity} · ${iss.warranty_type || 'workmanship'} · ${new Date(iss.created_at).toLocaleDateString('en-AU')} · Status: ${iss.status}</div>
      ${iss.description ? `<div style="font-size:12px;margin-top:4px">${iss.description}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  <div class="disclaimer">
    <strong>Important:</strong> This warranty certificate covers workmanship only. Product and manufacturer warranties are governed separately by each manufacturer's terms and conditions. In the event of a dispute, this document — together with your signed scope agreement and job records stored in Steadyhand — constitutes your primary evidence for any claim. Steadyhand is a documentation and job management platform and does not adjudicate warranty disputes.
  </div>

  <div class="footer">
    <span>Steadyhand Digital Pty Ltd — steadyhandtrade.app — ${new Date().toLocaleDateString('en-AU')}</span>
    <span>Certificate ID: ${jobId.slice(0,8).toUpperCase()}</span>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="warranty-certificate-${jobId.slice(0,8)}.html"`,
    }
  })
}
