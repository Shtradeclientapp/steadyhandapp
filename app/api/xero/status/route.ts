import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ connected: false })
  const { data } = await supabase.from('xero_connections').select('tenant_name, expires_at').eq('user_id', user_id).single()
  if (!data) return NextResponse.json({ connected: false })
  return NextResponse.json({ connected: true, tenant_name: data.tenant_name, expires_at: data.expires_at })
}
