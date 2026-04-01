import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { AIScopeResult } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { job_id } = await request.json()
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: job } = await supabase
      .from('jobs')
      .select('*, tradie:tradie_profiles(*)')
      .eq('id', job_id)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Fetch conversation thread for context
    const { data: messages } = await supabase
      .from('messages')
      .select('body, sender_id, created_at')
      .eq('job_id', job_id)
      .order('created_at', { ascending: true })
      .limit(30)

    const thread = messages?.map(m =>
      `${m.sender_id === job.client_id ? 'Client' : 'Tradie'}: ${m.body}`
    ).join('\n') || 'No messages yet.'

    const prompt = `You are a trades contract specialist for Steadyhand, a platform operating in Western Australia.

Draft a scope of work agreement for the following job:

JOB DETAILS:
- Title: ${job.title}
- Trade category: ${job.trade_category}
- Description: ${job.description}
- Suburb: ${job.suburb}, WA
- Property type: ${job.property_type || 'residential house'}
- Urgency: ${job.urgency || 'standard'}
- Client budget range: ${job.budget_range || 'to be agreed'}
- Warranty period: ${job.warranty_period} days
- Tradie business: ${job.tradie?.business_name || 'selected tradie'}

CONVERSATION THREAD (use to refine inclusions/exclusions):
${thread}

Generate a clear, fair scope agreement. Return ONLY valid JSON — no markdown, no preamble:
{
  "inclusions": ["<item 1>", "<item 2>", ...],
  "exclusions": ["<item 1>", ...],
  "milestones": [
    { "label": "<e.g. Demolition complete>", "percent": 25, "amount": 0, "description": "<what this covers>" },
    ...
  ],
  "warranty_days": ${job.warranty_period},
  "total_price_estimate": <number or null if budget not specified>,
  "notes": "<1-2 sentences of important caveats or things both parties should discuss>"
}

Rules:
- Include 3-4 milestones that match natural stages of this trade
- Percentages must sum to 100
- Exclusions should be specific to common disputes in this trade type (e.g. for plumbing: wall patching, electrical work, rubbish removal)
- amount fields should be 0 — the agreed price will be filled in by the client
- Be practical and realistic for WA residential trades`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const scope = JSON.parse(raw) as AIScopeResult

    // Save draft to database
    const { data: saved, error } = await supabase
      .from('scope_agreements')
      .upsert({
        job_id,
        drafted_by_ai: true,
        inclusions: scope.inclusions,
        exclusions: scope.exclusions,
        milestones: scope.milestones,
        warranty_days: scope.warranty_days,
        response_sla_days: 5,
        remediation_days: 14,
        total_price: scope.total_price_estimate || 0,
      }, { onConflict: 'job_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ scope: saved, notes: scope.notes })

  } catch (err) {
    console.error('Scope draft error:', err)
    return NextResponse.json({ error: 'Scope drafting failed' }, { status: 500 })
  }
}
