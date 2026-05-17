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
  if (!user) return NextResponse.json({ connected: false }, { status: 401 })
  const { data } = await supabase.from('xero_connections').select('tenant_name, expires_at').eq('user_id', user.id).single()
  if (!data) return NextResponse.json({ connected: false })
  return NextResponse.json({ connected: true, tenant_name: data.tenant_name, expires_at: data.expires_at })
}
