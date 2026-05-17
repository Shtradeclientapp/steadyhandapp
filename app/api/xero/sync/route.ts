import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function refreshXeroToken(userId: string, refreshToken: string) {
  const tokenRes = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(process.env.XERO_CLIENT_ID + ':' + process.env.XERO_CLIENT_SECRET).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  const tokens = await tokenRes.json()
  if (!tokens.access_token) throw new Error('Token refresh failed')
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await supabase.from('xero_connections').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || refreshToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
  return tokens.access_token
}

export async function POST(request: NextRequest) {
  try {
    const serverClient = createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { job_id, action } = await request.json()
    const user_id = user.id
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    // Get Xero connection
    const { data: conn } = await supabase.from('xero_connections').select('*').eq('user_id', user_id).single()
    if (!conn) return NextResponse.json({ error: 'Xero not connected' }, { status: 400 })

    // Refresh token if expired
    let accessToken = conn.access_token
    if (new Date(conn.expires_at) < new Date()) {
      accessToken = await refreshXeroToken(user_id, conn.refresh_token)
    }

    // Get job + quote + client details
    const { data: job } = await supabase
      .from('jobs')
      .select('*, client:profiles!jobs_client_id_fkey(full_name, email), quotes(*)')
      .eq('id', job_id)
      .single()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const quote = job.quotes?.sort((a: any, b: any) => b.version - a.version)[0]
    if (!quote) return NextResponse.json({ error: 'No quote found' }, { status: 404 })

    const headers = {
      'Authorization': 'Bearer ' + accessToken,
      'Xero-tenant-id': conn.tenant_id,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Ensure contact exists in Xero
    const contactName = job.client?.full_name || 'Steadyhand Client'
    const contactEmail = job.client?.email || ''
    const contactRes = await fetch('https://api.xero.com/api.xro/2.0/Contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Contacts: [{
          Name: contactName,
          EmailAddress: contactEmail,
        }]
      })
    })
    const contactData = await contactRes.json()
    const contactId = contactData.Contacts?.[0]?.ContactID

    // Build line items from quote breakdown
    const breakdown = quote.breakdown || []
    const lineItems = breakdown.length > 0
      ? breakdown.map((b: any) => ({
          Description: b.label,
          Quantity: 1,
          UnitAmount: Number(b.amount),
          AccountCode: '200',
          TaxType: 'OUTPUT',
        }))
      : [{
          Description: job.title,
          Quantity: 1,
          UnitAmount: Number(quote.total_price),
          AccountCode: '200',
          TaxType: 'OUTPUT',
        }]

    // Create invoice
    const invoiceRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Invoices: [{
          Type: 'ACCREC',
          Contact: { ContactID: contactId },
          LineItems: lineItems,
          Date: new Date().toISOString().split('T')[0],
          DueDate: quote.estimated_start
            ? new Date(quote.estimated_start).toISOString().split('T')[0]
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Reference: 'SH-' + job_id.substring(0, 8).toUpperCase(),
          Status: 'DRAFT',
          LineAmountTypes: 'INCLUSIVE',
        }]
      })
    })

    const invoiceData = await invoiceRes.json()
    const invoice = invoiceData.Invoices?.[0]
    if (!invoice) return NextResponse.json({ error: 'Failed to create invoice in Xero' }, { status: 500 })

    // Save Xero invoice ID to job
    await supabase.from('jobs').update({ xero_invoice_id: invoice.InvoiceID }).eq('id', job_id)

    return NextResponse.json({
      success: true,
      invoice_id: invoice.InvoiceID,
      invoice_number: invoice.InvoiceNumber,
    })

  } catch (err: any) {
    console.error('Xero sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
