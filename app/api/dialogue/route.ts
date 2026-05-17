import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import * as logger from '@/lib/logger'
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || ''
    const isInternal = process.env.CRON_SECRET && authHeader === 'Bearer ' + process.env.CRON_SECRET
    let userId: string | null = null
    if (!isInternal) {
      const serverClient = createServerClient()
      const { data: { user } } = await serverClient.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      userId = user.id
      const rl = await checkRateLimit(userId, '/api/dialogue')
      if (rl.limited) return rateLimitResponse(rl.resetAt)
    }

    const { action, job_id, stage } = await request.json()

    if (action !== 'score_stage' || !job_id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Fetch job + messages
    const { data: job } = await supabase
      .from('jobs')
      .select('*, tradie:tradie_profiles(id, business_name, dialogue_score_avg, dialogue_score_history)')
      .eq('id', job_id)
      .single()

    if (!job?.tradie_id) return NextResponse.json({ ok: true, skipped: true })

    const { data: messages } = await supabase
      .from('job_messages')
      .select('body, sender_id, created_at')
      .eq('job_id', job_id)
      .order('created_at', { ascending: true })

    const transcript = (messages || []).map((m: any) => m.body).join('\n')
    if (!transcript || transcript.length < 50) return NextResponse.json({ ok: true, skipped: 'no transcript' })

    // Score with Claude
    const prompt = `You are scoring a trade dialogue for Steadyhand, an Australian trades platform.

Job: ${job.title || 'Unknown'}
Stage: ${stage}
Trade category: ${job.trade_category || 'Unknown'}

Message transcript:
${transcript.slice(0, 3000)}

Score the tradie's communication across these 6 dimensions (1-5 each):
1. pricing_transparency - Clear about costs, no hidden fees mentioned
2. compliance - Mentioned licence, insurance, permits where relevant
3. risk_communication - Flagged risks or unknowns proactively
4. timeline_clarity - Clear about schedule and availability
5. professionalism - Respectful, clear, responsive tone
6. scope_clarity - Clear about what is and isn't included

Also check:
- variation_process: Did they mention how variations/changes would be handled? (true/false)

Respond ONLY with JSON:
{
  "score": <overall 0-100>,
  "dimensions": {
    "pricing_transparency": { "score": <1-5>, "summary": "<one sentence>" },
    "compliance": { "score": <1-5>, "summary": "<one sentence>" },
    "risk_communication": { "score": <1-5>, "summary": "<one sentence>" },
    "timeline_clarity": { "score": <1-5>, "summary": "<one sentence>" },
    "professionalism": { "score": <1-5>, "summary": "<one sentence>" },
    "scope_clarity": { "score": <1-5>, "summary": "<one sentence>" },
    "variation_process": { "present": <true/false> }
  },
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = res.content[0].type === 'text' ? res.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const scored = JSON.parse(clean)

    // Build history entry
    const historyEntry = {
      job_id,
      stage,
      score: scored.score,
      dimensions: scored.dimensions,
      scored_at: new Date().toISOString(),
    }

    // Fetch existing history
    const { data: tp } = await supabase
      .from('tradie_profiles')
      .select('dialogue_score_avg, dialogue_score_history')
      .eq('id', job.tradie_id)
      .single()

    const history = Array.isArray(tp?.dialogue_score_history) ? tp.dialogue_score_history : []
    const newHistory = [...history, historyEntry].slice(-50) // keep last 50

    // Recalculate rolling average
    const avg = Math.round(newHistory.reduce((sum: number, h: any) => sum + (h.score || 0), 0) / newHistory.length)

    await supabase.from('tradie_profiles').update({
      dialogue_score_avg: avg,
      dialogue_score_history: newHistory,
    }).eq('id', job.tradie_id)

    logger.log('api/dialogue', 'scored', { job_id, stage, score: scored.score, avg, tradie_id: job.tradie_id })
    return NextResponse.json({ ok: true, score: scored.score, avg })
  } catch (e: any) {
    logger.error('api/dialogue', 'unhandled', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
