import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { job_id, suggestion } = await request.json()
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    const { data: job } = await supabase.from('jobs').select('*').eq('id', job_id).single()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const promptText = 'You are a trades contract specialist for Steadyhand in Western Australia.\n\nDraft a scope of work for:\nTitle: ' + job.title + '\nTrade: ' + job.trade_category + '\nSuburb: ' + job.suburb + '\nDescription: ' + job.description + '\nProperty: ' + (job.property_type || 'residential') + '\nBudget: ' + (job.budget_range || 'to be agreed') + '\nWarranty: ' + job.warranty_period + ' days\n\nReturn ONLY valid JSON, no markdown:\n{"inclusions":["item1","item2"],"exclusions":["item1"],"milestones":[{"label":"label","percent":25,"amount":0,"description":"desc"}],"warranty_days":' + job.warranty_period + ',"total_price_estimate":0,"notes":"brief note"}\'\nRules: 3-4 milestones summing to 100%, realistic exclusions for this trade type.' + (suggestion ? '\n\nIMPORTANT: Incorporate this change request into the scope: ' + suggestion : '')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: promptText }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const scope = JSON.parse(cleaned)

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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ scope: saved, notes: scope.notes })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
