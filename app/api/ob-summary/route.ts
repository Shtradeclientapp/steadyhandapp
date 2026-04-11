import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { description, address, title } = await request.json()

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are helping a Western Australian owner-builder write a project plan summary for their Building Commission permit application.

Project name: ${title || 'Residential project'}
Site address: ${address || 'WA residential property'}
Owner's description: ${description}

Write a clear, professional project plan summary (3-4 paragraphs, approx 200-250 words) suitable for submission to the WA Building Commission as part of an owner-builder permit application.

The summary should cover:
1. Nature and scope of the proposed works
2. Construction method and materials (where known)
3. Trades to be engaged (electrical, plumbing, etc.)
4. Approximate timeline and sequence

Write in plain, professional English. First person ("I propose to..."). Do not include headings. Do not include the project name or address as a header — go straight into the description.`
      }]
    })

    const summary = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ summary })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
