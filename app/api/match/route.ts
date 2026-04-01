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
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
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
      'Tradie ' + (i+1) + ': ID: ' + t.id + ', Business: ' + t.business_name + ', Categories: ' + t.trade_categories.join(', ') + ', Areas: ' + t.service_areas.join(', ') + ', Rating: ' + t.rating_avg + '/5, Jobs: ' + t.jobs_completed + ', Licence: ' + t.licence_verified + ', Insurance: ' + t.insurance_verified + ', Bio: ' + (t.bio || 'none')
    ).join('\n')

    const jobSummary = 'Job: ' + job.title + '\nCategory: ' + job.trade_category + '\nLocation: ' + job.suburb + ', WA\nDescription: ' + job.description + '\nBudget: ' + (job.budget_range || 'not specified') + '\nWarranty: ' + job.warranty_period + ' days'

    const promptText = 'You are the AI matching engine for Steadyhand, a trades platform in Western Australia.\n\n' + jobSummary + '\n\nTradies:\n' + descriptions + '\n\nScore each tradie 0-100 on: category match (40%), location fit (20%), track record (20%), verification (10%), engagement (10%).\n\nReturn ONLY this JSON, no markdown:\n{"results":[{"tradie_id":"<uuid>","score":<number>,"reasoning":"<2-3 sentences>","rank":<number>}]}\n\nReturn top 4 tradies sorted by score descending.'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: promptText }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      return NextResponse.json({ error: 'Bad AI response: ' + raw.slice(0, 200) }, { status: 500 })
    }

    const rows = parsed.results.map((r: any) => ({
      job_id,
      tradie_id: r.tradie_id,
      ai_score: r.score,
      ai_reasoning: r.reasoning,
      rank: r.rank,
      status: 'pending',
    }))

    await supabase.from('shortlist').upsert(rows, { onConflict: 'job_id,tradie_id' })
    await supabase.from('jobs').update({ status: 'shortlisted' }).eq('id', job_id)

    const enriched = parsed.results.map((r: any) => ({
      ...r,
      tradie: candidates.find((t: any) => t.id === r.tradie_id),
    }))

    return NextResponse.json({ shortlist: enriched })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Matching failed' }, { status: 500 })
  }
}
