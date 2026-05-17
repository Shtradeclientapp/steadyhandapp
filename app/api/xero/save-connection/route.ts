import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const serverClient = createServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const user_id = user.id

  const accessToken = request.cookies.get('xero_access_token')?.value
  const refreshToken = request.cookies.get('xero_refresh_token')?.value
  const tenantId = request.cookies.get('xero_tenant_id')?.value
  const tenantName = request.cookies.get('xero_tenant_name')?.value
  const expiresAt = request.cookies.get('xero_expires_at')?.value

  if (!accessToken || !refreshToken || !tenantId) {
    return NextResponse.json({ error: 'Missing token data' }, { status: 400 })
  }

  await supabase.from('xero_connections').upsert({
    user_id,
    tenant_id: tenantId,
    tenant_name: tenantName || 'My Xero',
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt || new Date(Date.now() + 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,tenant_id' })

  const response = NextResponse.json({ success: true })
  response.cookies.delete('xero_access_token')
  response.cookies.delete('xero_refresh_token')
  response.cookies.delete('xero_tenant_id')
  response.cookies.delete('xero_tenant_name')
  response.cookies.delete('xero_expires_at')
  return response
}
