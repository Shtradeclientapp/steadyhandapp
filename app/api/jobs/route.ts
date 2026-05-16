import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, milestones(*)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    const supabase = createClient()
    let user = null

    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    } else {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised — please sign in again' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title, description, trade_category, suburb, state,
      property_type, urgency, budget_range,
      warranty_period, preferred_start,
      org_id, property_id
    } = body

    if (!title || !description || !trade_category || !suburb) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: job, error } = await serviceClient
      .from('jobs')
      .insert({
        client_id: user.id,
        title,
        description,
        trade_category,
        suburb,
        state: state || 'WA',
        property_type,
        urgency,
        budget_range,
        warranty_period: warranty_period || 90,
        preferred_start,
        status: 'matching',
        org_id: org_id || null,
        property_id: property_id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Score request completeness
    if (process.env.NEXT_PUBLIC_APP_URL) await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'score_stage', stage: 'request', job_id: job.id }),
    }).catch(() => {})

    return NextResponse.json({ job }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}