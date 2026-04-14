import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (!code) {
    return NextResponse.redirect(appUrl + '/tradie/dashboard?xero=error')
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.XERO_CLIENT_ID + ':' + process.env.XERO_CLIENT_SECRET).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI!,
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokens.access_token) {
      return NextResponse.redirect(appUrl + '/tradie/dashboard?xero=error')
    }

    // Get Xero tenant/org info
    const tenantsRes = await fetch('https://api.xero.com/connections', {
      headers: { 'Authorization': 'Bearer ' + tokens.access_token },
    })
    const tenants = await tenantsRes.json()
    const tenant = tenants[0]
    if (!tenant) {
      return NextResponse.redirect(appUrl + '/tradie/dashboard?xero=error')
    }

    // Get user from cookie/session — use the state param to find user
    // We'll use the referer to find the right user redirect
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store temporarily in a cookie and redirect to a page that can get the user
    const response = NextResponse.redirect(appUrl + '/xero/connected')
    response.cookies.set('xero_access_token', tokens.access_token, { httpOnly: true, maxAge: 60 })
    response.cookies.set('xero_refresh_token', tokens.refresh_token, { httpOnly: true, maxAge: 60 })
    response.cookies.set('xero_tenant_id', tenant.tenantId, { httpOnly: true, maxAge: 60 })
    response.cookies.set('xero_tenant_name', tenant.tenantName || 'My Xero', { httpOnly: true, maxAge: 60 })
    response.cookies.set('xero_expires_at', expiresAt, { httpOnly: true, maxAge: 60 })
    return response

  } catch (err: any) {
    console.error('Xero callback error:', err)
    return NextResponse.redirect(appUrl + '/tradie/dashboard?xero=error')
  }
}
