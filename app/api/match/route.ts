import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const body = await request.json()
    const { job_id } = body
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    const { data: allJobs } = await supabase.from('jobs').select('id,title').limit(5)
    const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', job_id).single()
    if (jobError || !job) return NextResponse.json({ error: 'Job not found', job_id_received: job_id, db_error: jobError?.message, all_jobs: allJobs }, { status: 404 })

    const { data: tradies } = await supabase
      .from('tradie_profiles')
      .select('*, profile:profiles(*)')
      .eq('subscription_active', true)
      .eq('licence_verified', true)
      .contains('trade_categories', [job.trade_category])
      .not('business_name', 'is', null)
      .not('bio', 'is', null)
    if (!tradies || tradies.length === 0) return NextResponse.json({ error: 'No tradies found for: ' + job.trade_category }, { status: 404 })

    const candidates = tradies.slice(0, 10)
    const descriptions = candidates.map((t: any, i: number) => 'Tradie ' + (i+1) + ': ID: ' + t.id + ', Business: ' + t.business_name + ', Rating: ' + t.rating_avg + ', Bio: ' + (t.bio || 'none')).join('\n')
    const tradieDescriptions = (tradies || []).map((t: any) => {
      const trustNote = t.trust_score_composite ? ' Trust score: ' + t.trust_score_composite + '/100.' : ''
      const ratingNote = t.rating_avg ? ' Rating: ' + Number(t.rating_avg).toFixed(1) + '/5 from ' + t.jobs_completed + ' jobs.' : ''
      return t.id + ': ' + t.business_name + ' — ' + (t.bio || 'No bio') + ratingNote + trustNote
    }).join('\n')
    const promptText = 'You are the AI matching engine for Steadyhand WA.\n\nJob: ' + job.title + '\nCategory: ' + job.trade_category + '\nLocation: ' + job.suburb + '\nDescription: ' + job.description + '\n\nTradies:\n' + tradieDescriptions + '\n\nScore each tradie 0-100 based on category fit, location, experience, rating and Dialogue Rating. Dialogue Rating reflects quality of past client communication and should influence your ranking. Return ONLY this JSON:\n{"results":[{"tradie_id":"<uuid>","score":<number>,"reasoning":"<2 sentences>","rank":<number>}]}\n\nTop 4 only.'

    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages: [{ role: 'user', content: promptText }] })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
   let parsed: any
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (e) {
      return NextResponse.json({ error: 'Bad AI response: ' + raw.slice(0, 200) }, { status: 500 })
    }

    const rows = parsed.results.map((r: any) => ({ job_id, tradie_id: r.tradie_id, ai_score: r.score, ai_reasoning: r.reasoning, rank: r.rank, status: 'pending' }))
    await supabase.from('shortlist').upsert(rows, { onConflict: 'job_id,tradie_id' })
    await supabase.from('jobs').update({ status: 'shortlisted' }).eq('id', job_id)
    const enriched = parsed.results.map((r: any) => ({ ...r, tradie: candidates.find((t: any) => t.id === r.tradie_id) }))
    return NextResponse.json({ shortlist: enriched })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Matching failed' }, { status: 500 })
  }
}