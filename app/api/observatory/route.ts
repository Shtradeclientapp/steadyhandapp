import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are an Australian trade industry intelligence analyst. Return ONLY a JSON array of 4 recent intelligence items. Each item must have: id (string), title (string max 80 chars), summary (string max 200 chars), date (YYYY-MM-DD), source (string), url (string), significance ("high"|"medium"|"low"). Return ONLY the JSON array, no markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'
    const items = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
