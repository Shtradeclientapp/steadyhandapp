const https = require('https')
const { createClient } = require('@supabase/supabase-js')

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!GOOGLE_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Need GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SEARCHES = [
  { query: 'electrician Perth WA', category: 'Electrical', region: 'Perth Metro' },
  { query: 'plumber Perth WA', category: 'Plumbing & Gas', region: 'Perth Metro' },
  { query: 'carpenter Perth WA', category: 'Carpentry & Joinery', region: 'Perth Metro' },
  { query: 'painter Perth WA', category: 'Painting', region: 'Perth Metro' },
  { query: 'tiler Perth WA', category: 'Tiling', region: 'Perth Metro' },
  { query: 'landscaper Perth WA', category: 'Landscaping', region: 'Perth Metro' },
  { query: 'electrician Margaret River WA', category: 'Electrical', region: 'South West' },
  { query: 'plumber Margaret River WA', category: 'Plumbing & Gas', region: 'South West' },
  { query: 'carpenter Margaret River WA', category: 'Carpentry & Joinery', region: 'South West' },
  { query: 'builder Bunbury WA', category: 'Building', region: 'South West' },
  { query: 'electrician Bunbury WA', category: 'Electrical', region: 'South West' },
  { query: 'plumber Busselton WA', category: 'Plumbing & Gas', region: 'South West' },
  { query: 'carpenter Busselton WA', category: 'Carpentry & Joinery', region: 'South West' },
  { query: 'painter Mandurah WA', category: 'Painting', region: 'Perth Metro' },
  { query: 'tiler Fremantle WA', category: 'Tiling', region: 'Perth Metro' },
]

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => { resolve(JSON.parse(data)) })
    }).on('error', reject)
  })
}

function extractSuburb(address) {
  if (!address) return ''
  const parts = address.split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('WA') || trimmed.includes('Western Australia')) continue
    if (/\d{4}/.test(trimmed)) continue
    if (trimmed.length > 2 && trimmed.length < 30) return trimmed
  }
  return parts[0] ? parts[0].trim() : ''
}

async function searchPlaces(query) {
  const encoded = encodeURIComponent(query)
  const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + encoded + '&key=' + GOOGLE_KEY
  const data = await fetchJson(url)
  if (data.status !== 'OK') {
    console.log('Search failed:', query, data.status)
    return []
  }
  return data.results || []
}

async function seed() {
  console.log('Starting directory seed...')
  let total = 0
  let inserted = 0

  for (const search of SEARCHES) {
    console.log('Searching:', search.query)
    const results = await searchPlaces(search.query)
    console.log('Found', results.length, 'results')

    for (const place of results) {
      total++
      const suburb = extractSuburb(place.formatted_address)
      const record = {
        google_place_id: place.place_id,
        business_name: place.name,
        trade_category: search.category,
        suburb: suburb,
        region: search.region,
        address: place.formatted_address,
        google_rating: place.rating || null,
        review_count: place.user_ratings_total || 0,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('directory_businesses').upsert(record, { onConflict: 'google_place_id' })
      if (!error) {
        inserted++
      } else {
        console.log('Error inserting', place.name, error.message)
      }
    }
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('Done. Total:', total, 'Inserted/updated:', inserted)
}

seed().catch(console.error)
