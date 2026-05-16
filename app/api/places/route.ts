import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || ''
  const type  = req.nextUrl.searchParams.get('type') || 'suburb'
  const key   = process.env.GOOGLE_PLACES_API_KEY

  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 })
  if (query.length < 2) return NextResponse.json({ suggestions: [] })

  if (type === 'suburb') {
    try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(regions)&components=country:au&key=${key}`
    const r = await fetch(url)
    const d = await r.json()
    const suggestions = (d.predictions || []).map((p: any) => p.structured_formatting?.main_text || p.description).slice(0, 6)
    return NextResponse.json({ suggestions })
    } catch { return NextResponse.json({ suggestions: [] }) }
  }

  return NextResponse.json({ suggestions: [] })
}
