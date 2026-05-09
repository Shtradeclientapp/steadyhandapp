import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addBusinessDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const job_id = searchParams.get('job_id')

  const query = supabase
    .from('warranty_issues')
    .select('*')
    .order('created_at', { ascending: false })

  if (job_id) query.eq('job_id', job_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issues: data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { job_id, title, description, severity, warranty_type, product_involved } = await request.json()

  // Response due in 5 business days (not calendar days)
  const response_due_at = addBusinessDays(new Date(), 5).toISOString()

  const { data, error } = await supabase
    .from('warranty_issues')
    .insert({
      job_id,
      raised_by: user.id,
      title,
      description,
      severity: severity || 'moderate',
      warranty_type: warranty_type || 'workmanship',
      product_involved: product_involved || null,
      resolution_status: 'open',
      status: 'open',
      response_due_at,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issue: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id, status } = await request.json()
  const updates: Record<string, unknown> = { status }
  if (status === 'resolved') updates.resolved_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('warranty_issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issue: data })
}
