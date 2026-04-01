import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    if (jobError) {
      return NextResponse.json({ error: 'DB error: ' + jobError.message }, { status: 500 })
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found for id: ' + job_id }, { status: 404 })
    }

    const { data: tradies } = await supabase
      .from('tradie_profiles')
      .select('*, profile:profiles(*)')
      .eq('subscription_active', true)
      .contains('trade_categories', [job.trade_category])

    if (!tradies || tradies.length === 0) {
      return NextResponse.json({ error: 'No eligible tradies found for category: ' + job.trade_category }, { status: 404 })
    }

    const candidates = tradies.slice(0, 10)

    const tradieDescriptions = candidates.map((t: any, i: number) => `
Tradie ${i + 1}:
- ID: ${t.id}
- Business: ${t.business_name}
- Categories: ${t.trade_categories.join(', ')}
- Service areas: ${t.service_areas.join(', ')}
- Rating: ${t.rating_avg}/5 (${t.jobs_completed} jobs completed)
- Licence verified: ${t.licence_verified}
- Insurance verified: ${t.insurance_verified}
- Bio: ${t.bio || 'not provided'}
    `.trim()).join('\n\n')

    const prompt = `You are the AI matching engine for Steadyhand, a trades platform in Western Australia.

A client has posted the following job request:
- Title: ${job.title}
- Trade category: ${job.trade_category}
- Location: ${job.suburb}, WA
- Description: ${job.description}
- Property type: ${job.property_type || 'not specified'}
- Budget: ${job.budget_range || 'not specified'}
- Warranty period: ${job.warranty_period} days

Here are the eligible tradies:

${tradieDescriptions}

Score each tradie from 0-100 based on:
1. Category match and specialisation relevance (40%)
2. Location proximity and service area fit (20%)
3. Rating and completed jobs track record (20%)
4. Verification status (licence + insurance) (10%)
5. Response time and engagement signals (10%)

Return ONLY valid JSON with no markdown or commentary:
{
  "results": [
    {
      "tradie_id": "<uuid>",
      "score": <0-100>,
      "reasoning": "<2-3 sentence explanation for the client>",
      "rank": <1-5>
    }
  ]
}

Return the top 4 tradies only sorted by score descending.`

    const message = await anthropic.messages.create({
      model: 'claude-sonne