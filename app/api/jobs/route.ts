import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('jobs')
    .select(`
      *,
      client:profiles!jobs_client_id_fkey(id, full_name, email, suburb),
      tradie:tradie_profiles(id, business_name, rating_avg),
      milestones(*)
    `)
    .order('created_at', { ascending: false })

  if (profile?.role === 'client') {
    query = query.eq('client_id', user.id)
  } else {
    // Tradie sees jobs where they are assigned or shortlisted
    query = query.eq('tradie_id', user.id)
  }

  const { data: jobs, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ jobs })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const {
    title, description, trade_category, suburb, property_type,
    urgency, budget_range, warranty_period, preferred_start
  } = body

  if (!title || !description || !trade_category || !suburb) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      client_id: user.id,
      title,
      description,
      trade_category,
      suburb,
      property_type,
      urgency,
      budget_range,
      warranty_period: warranty_period || 90,
      preferred_start,
      status: 'matching',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kick off AI matching asynchronously
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: job.id }),
  }).catch(console.error)

  return NextResponse.json({ job }, { status: 201 })
}
