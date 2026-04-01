import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import type { AIMatchResult, TradieProfile } from '@/types'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { job_id } = await request.json()
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Fetch candidate tradies — match on trade category and service area
    const { data: tradies, error: tradieError } = await supabase
      .from('tradie_profiles')
      .select('*, profile:profiles(*)')
      .eq('subscription_active', true)
      .contains('trade_categories', [job.trade_category])

    if (tradieError || !tradies?.length) {
      return NextResponse.json({ error: 'No eligible tradies found' }, { status: 404 })
    }

    // Filter by service area proximity (suburb match or 'Perth Metro' catch-all)
    const eligible = tradies.filter((t: TradieProfile) =>
      t.service_areas.some(area =>
        area.toLowerCase().includes(job.suburb.toLowerCase()) ||
        area.toLowerCase().includes('perth metro') ||
        job.suburb.toLowerCase().includes(area.toLowerCase())
      )
    )

    const candidates = eligible.length >= 3 ? eligible : tradies // fallback if too few

    // Build the prompt for Claude
    const tradieDescriptions = candidates.slice(0, 10).map((t: TradieProfile, i: number) => `
Tradie ${i + 1}:
- ID: ${t.id}
- Business: ${t.business_name}
- Categories: ${t.trade_categories.join(', ')}
- Service areas: ${t.service_areas.join(', ')}
- Rating: ${t.rating_avg}/5 (${t.jobs_completed} jobs completed)
- Licence verified: ${t.licence_verified}
- Insurance verified: ${t.insurance_verified}
- Response time avg: ${t.response_time_hrs ? t.response_time_hrs + ' hrs' : 'unknown'}
- Bio: ${t.bio || 'not provided'}
    `.trim()).join('\n\n')

    const prompt = `You are the AI matching engine for Steadyhand, a trades platform in Western Australia.

A client has posted the following job request:
- Title: ${job.title}
- Trade category: ${job.trade_category}
- Location: ${job.suburb}, WA
- Description: ${job.description}
- Property type: ${job.property_type || 'not specified'}
- Urgency: ${job.urgency || 'not specified'}
- Budget: ${job.budget_range || 'not specified'}
- Warranty period requested: ${job.warranty_period} days

Here are the eligible tradies:

${tradieDescriptions}

Score each tradie from 0-100 based on:
1. Category match and specialisation relevance (40%)
2. Location proximity and service area fit (20%)
3. Rating and completed jobs track record (20%)
4. Verification status (licence + insurance) (10%)
5. Response time and engagement signals (10%)

Return ONLY valid JSON in this exact format — no markdown, no commentary:
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

Return the top 4 tradies only, sorted by score descending. Rank 1 is the top recommendation.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(raw) as { results: AIMatchResult[] }

    // Store shortlist in database
    const shortlistRows = parsed.results.map(r => ({
      job_id,
      tradie_id: r.tradie_id,
      ai_score: r.score,
      ai_reasoning: r.reasoning,
      rank: r.rank,
      status: 'pending',
    }))

    await supabase.from('shortlist').upsert(shortlistRows, { onConflict: 'job_id,tradie_id' })

    // Update job status
    await supabase.from('jobs').update({ status: 'shortlisted' }).eq('id', job_id)

    // Enrich results with tradie data for the response
    const enriched = parsed.results.map(r => ({
      ...r,
      tradie: candidates.find((t: TradieProfile) => t.id === r.tradie_id),
    }))

    return NextResponse.json({ shortlist: enriched })

  } catch (err) {
    console.error('AI match error:', err)
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 })
  }
}
