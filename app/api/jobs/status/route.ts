import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { job_id, status, only_if_status } = await request.json()
    if (!job_id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    let query = supabase.from('jobs').update({ status }).eq('id', job_id)
    if (only_if_status) {
      query = supabase.from('jobs').update({ status }).eq('id', job_id).in('status', Array.isArray(only_if_status) ? only_if_status : [only_if_status])
    }
    const { error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
