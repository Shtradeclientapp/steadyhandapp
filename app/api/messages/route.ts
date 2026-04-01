import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const job_id = searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender:profiles(id, full_name, avatar_url, role)')
    .eq('job_id', job_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { job_id, body, ai_suggested } = await request.json()
  if (!job_id || !body) return NextResponse.json({ error: 'job_id and body required' }, { status: 400 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ job_id, sender_id: user.id, body, ai_suggested: !!ai_suggested })
    .select('*, sender:profiles(id, full_name, avatar_url, role)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message }, { status: 201 })
}

/** GET /api/messages/suggestions?job_id=xxx&role=client|tradie
 *  Returns 3 AI-suggested conversation prompts for the current stage */
export async function OPTIONS(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const job_id = searchParams.get('job_id')
  const role = searchParams.get('role') || 'client'

  const supabase = createClient()
  const { data: job } = await supabase.from('jobs').select('*').eq('id', job_id).single()
  const { data: messages } = await supabase
    .from('messages').select('body, sender_id').eq('job_id', job_id).limit(10).order('created_at', { ascending: false })

  const recentThread = messages?.map(m => m.body).join(' | ') || ''

  const prompt = `You are helping a ${role} on a trades job platform communicate clearly.

Job: ${job?.title} (${job?.trade_category}, ${job?.suburb})
Job status: ${job?.status}
Recent messages: ${recentThread || 'none yet'}

Suggest 3 short, natural message prompts the ${role} could send right now to move the job forward or clarify scope. Each should be under 12 words. Return JSON only:
{"suggestions": ["...", "...", "..."]}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{"suggestions":[]}'
  const { suggestions } = JSON.parse(raw)

  return NextResponse.json({ suggestions })
}
