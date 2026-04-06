import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ suggestions: [] })

  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(regions)&components=country:au&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ suggestions: [], error: data.status })
    }
    const suggestions = (data.predictions || [])
      .map((p: any) => p.structured_formatting?.main_text || p.description)
      .filter(Boolean)
      .slice(0, 5)
    return NextResponse.json({ suggestions })
  } catch (e) {
    return NextResponse.json({ suggestions: [] })
  }
}
