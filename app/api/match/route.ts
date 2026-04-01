import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  return NextResponse.json({ status: 'match route working' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id } = body

    if (!job_id) {
      return NextResponse.json({ error: 'job_id required' }, { status: 400 })
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found: ' + jobError?.message }, { status: 404 })
    }

    const { data: tradies } = await supabase
      .from('tradie_profiles')
      .select('*, profile:profiles(*)')
      .eq('subscription_active', true)
      .contains('trade_categories', [job.trade_category])

    if (!tradies || tradies.length === 0) {
      return NextResponse.json({ error: 'No eligible tradies found' }, { status: 404 })
    }

    const candidates = tradies.slice(0, 10)

    const descriptions = candidates.map((t: any, i: number) =>
      `Tradie ${i + 1}: ID: ${t.id}, Business: ${t.business_name}, Categories: ${t.trade_categories.join(', ')}, Areas: ${t.service_areas.join(', ')}, Rating: ${t.rating_avg}/5, Jobs: ${t.jobs_completed}, Licence: ${t.licence_verified}, Insurance: ${t.insurance_verified}, Bio: ${t.bio || 'none'}`
    ).join('\n')

    const prompt = `You are the AI matching engine for Steadyhand, a trades platform in Western Australia.

Job: ${job.title}
Category: ${job.trade_category}
Location: ${job.suburb}, WA
Description: ${job.description}
Budget: ${job.budget_range || 'not specified'}
Warranty: ${job.warranty_period} days

Tradies:
${descriptions}

Score each tradie 0-100 on: category match (40%), location fit (20%), track record (20%), verification (10%), engagement (10%).

Return ONLY this JSON format, no markdown:
{"results":[{"tradie_id":"<uuid>","score":<number>,"reasoning":"<2-3 sentences>","rank":<number>}]}

Return top 4 tradies sort