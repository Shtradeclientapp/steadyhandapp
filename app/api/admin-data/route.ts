import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    // Verify requester is admin
    const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user_id).single()
    if (!prof?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const [{ data: tradies }, { data: clients }, { data: jobs }] = await Promise.all([
      supabase.from('tradie_profiles').select('*, profile:profiles(id, full_name, email, is_admin, created_at)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, admin_notes').eq('role', 'client').order('created_at', { ascending: false }),
      supabase.from('jobs').select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name, email)').order('created_at', { ascending: false }).limit(200),
    ])

    return NextResponse.json({ tradies, clients, jobs })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
