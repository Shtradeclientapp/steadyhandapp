'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { id: 'legislation',  label: 'Legislation',        icon: '⚖️',  color: '#2E6A8F', prompt: 'Australia building trades construction legislation updates 2024 2025 Home Building Contracts Act NSW Home Building Act VIC Domestic Building Contracts Act QLD QBCC Act SA Building Work Contractors Act' },
  { id: 'warranty',     label: 'Warranty & Defects', icon: '🛡️',  color: '#2E7D60', prompt: 'Australia building defects warranty disputes tribunal SAT NCAT VCAT QCAT homeowner tradie contractor 2024 2025 structural defects workmanship claims' },
  { id: 'materials',    label: 'Building Materials', icon: '🧱',  color: '#C07830', prompt: 'Australia building materials product liability defects recalls cladding waterproofing roofing tiles concrete 2024 2025 ACCC standards compliance' },
  { id: 'fairwork',     label: 'Fair Work',           icon: '🤝',  color: '#6B4FA8', prompt: 'Fair Work Australia contractor employee misclassification trade workers 2024 2025 rulings decisions High Court gig economy' },
  { id: 'precedents',   label: 'Legal Precedents',   icon: '🔍',  color: '#9B6B9B', prompt: 'Australia court tribunal notable decisions building contractor disputes payment defects warranty SAT NCAT VCAT 2024 2025' },
  { id: 'licensing',    label: 'Licensing & Compliance', icon: '📋', color: '#D4522A', prompt: 'Australia trade contractor licence registration requirements changes 2024 2025 electrician plumber builder tiler painter state regulators DMIRS NSW Fair Trading VBA QBCC' },
]

const PINNED_ITEMS: any[] = [
  { id: 'pin-1', category: 'legislation', title: 'Home Building Contracts Act 1991 (WA) — written contract threshold', summary: 'Contracts for residential building work over $7,500 in WA must be in writing. Failure to comply gives the homeowner rights to withhold payment. The scope agreement on Steadyhand satisfies this requirement.', date: '2024-01-01', source: 'WA Government', url: 'https://www.commerce.wa.gov.au', pinned: true },
  { id: 'pin-2', category: 'warranty', title: 'Statutory warranty periods by state — what tradies and homeowners need to know', summary: 'Structural defect liability runs 6 years (WA, NSW, QLD), 10 years (VIC, TAS, ACT), or 5 years (SA) from completion — regardless of what the contract says. These rights cannot be reduced by agreement.', date: '2024-06-01', source: 'State building commissions', url: 'https://www.abcb.gov.au', pinned: true },
  { id: 'pin-3', category: 'fairwork', title: 'Employee vs Contractor: High Court clarification', summary: 'CFMEU v Personnel Contracting [2022] HCA 1 continues to reshape how trade businesses structure subcontractor arrangements. Key test: written terms of the contract govern the relationship.', date: '2022-02-09', source: 'High Court of Australia', url: 'https://www.hcourt.gov.au', pinned: true },
  { id: 'pin-4', category: 'materials', title: 'ACCC building product safety alerts — cladding and waterproofing', summary: 'Ongoing ACCC monitoring of non-conforming building products including composite cladding, waterproofing membranes, and structural fixings. Tradies who install non-conforming products may face liability even if supplied by the client.', date: '2024-09-01', source: 'ACCC', url: 'https://www.accc.gov.au', pinned: true },
  { id: 'pin-5', category: 'precedents', title: 'Written scope agreements as primary evidence in tribunal disputes', summary: 'SAT, NCAT, and VCAT consistently treat signed written agreements as the primary evidence of what was agreed. Verbal arrangements, even corroborated by witnesses, rarely prevail against a signed document.', date: '2024-03-01', source: 'State tribunals', url: 'https://www.sat.justice.wa.gov.au', pinned: true },
]

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCached(key: string) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

function setCache(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

async function fetchIntelligence(category: any) {
  const cacheKey = 'sh_obs_' + category.id
  const cached = getCached(cacheKey)
  if (cached) return cached
  try {
    const response = await fetch('/api/observatory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Find 4 important recent developments for Australian trade professionals, homeowners, and building industry participants related to: ${category.prompt}. Include developments from any Australian state or territory. Focus on practical implications.`,
      }),
    })
    const data = await response.json()
    const result = (data.items || []).map((i: any) => ({ ...i, category: category.id }))
    setCache('sh_obs_' + category.id, result)
    return result
  } catch { return [] }
}

function SignificanceBadge({ level }: { level: string }) {
  const map: any = { high: { bg: 'rgba(212,82,42,0.12)', color: '#D4522A', label: '● High' }, medium: { bg: 'rgba(192,120,48,0.12)', color: '#C07830', label: '◐ Medium' }, low: { bg: 'rgba(46,107,143,0.1)', color: '#2E6A8F', label: '○ Low' } }
  const s = map[level] || map.low
  return <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: s.bg, color: s.color }}>{s.label}</span>
}

function IntelCard({ item, categoryColor, pinned }: any) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div onClick={() => setExpanded(v => !v)} style={{ background: pinned ? 'rgba(28,43,50,0.04)' : 'white', border: `1px solid ${pinned ? categoryColor + '40' : 'rgba(28,43,50,0.08)'}`, borderLeft: `3px solid ${categoryColor}`, borderRadius: '8px', padding: '14px 16px', cursor: 'pointer', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
            {pinned && <span style={{ fontSize: '10px', fontWeight: 700, color: categoryColor }}>📌 Pinned</span>}
            {item.significance && <SignificanceBadge level={item.significance} />}
            <span style={{ fontSize: '11px', color: '#9AA5AA' }}>{item.date}</span>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A', margin: '0 0 4px', lineHeight: 1.4 }}>{item.title}</p>
          {expanded ? (
            <>
              <p style={{ fontSize: '12px', color: '#4A5E64', margin: '6px 0 8px', lineHeight: 1.6 }}>{item.summary}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#9AA5AA' }}>{item.source}</span>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e: any) => e.stopPropagation()} style={{ fontSize: '11px', color: categoryColor, textDecoration: 'none', fontWeight: 500 }}>View source →</a>}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '12px', color: '#7A9098', margin: 0, lineHeight: 1.5 }}>{item.summary?.slice(0, 120)}...</p>
          )}
        </div>
        <span style={{ fontSize: '14px', opacity: 0.4, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[1,2,3].map(i => <div key={i} style={{ height:'72px', borderRadius:'8px', marginBottom:'8px', background:'linear-gradient(90deg,#E8F0EE 25%,#D8E8E4 50%,#E8F0EE 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />)}
    </div>
  )
}

function CategoryPanel({ category, pinnedItems, refreshKey }: any) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    setLoading(true)
    setItems([])
    setError(null)
    fetchIntelligence(category).then(result => { setItems(result); setLoading(false) }).catch(() => { setError('Could not load — please try again.'); setLoading(false) })
  }, [category.id, refreshKey])

  const allItems = [...pinnedItems, ...items]
  return (
    <div>
      {loading && <Skeleton />}
      {error && <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', padding:'12px 14px', marginBottom:'12px' }}><p style={{ fontSize:'13px', color:'#D4522A', margin:0 }}>{error}</p></div>}
      {!loading && allItems.map(item => <IntelCard key={item.id} item={item} categoryColor={category.color} pinned={item.pinned} />)}
    </div>
  )
}

// ── WA Live Benchmarks (from job_analytics) ──────────────────────────────────
function WABenchmarks() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('job_analytics')
      .select('trade_category, days_delivery, warranty_issues_count, variation_count, final_scope_value')
      .not('signoff_completed_at', 'is', null)
      .then(({ data }) => {
        if (!data || data.length < 3) { setLoading(false); return }

        // Compute anonymised aggregates
        const withDelivery = data.filter(r => r.days_delivery > 0)
        const avgDelivery = withDelivery.length > 0
          ? Math.round(withDelivery.reduce((s, r) => s + r.days_delivery, 0) / withDelivery.length)
          : null

        const warrantyRate = data.length > 0
          ? Math.round((data.filter(r => r.warranty_issues_count > 0).length / data.length) * 100)
          : null

        const avgVariations = data.length > 0
          ? (data.reduce((s, r) => s + (r.variation_count || 0), 0) / data.length).toFixed(1)
          : null

        const avgScope = data.filter(r => r.final_scope_value > 0).length > 0
          ? Math.round(data.filter(r => r.final_scope_value > 0).reduce((s, r) => s + r.final_scope_value, 0) / data.filter(r => r.final_scope_value > 0).length)
          : null

        // Top trade categories
        const catCount: Record<string, number> = {}
        data.forEach(r => { if (r.trade_category) catCount[r.trade_category] = (catCount[r.trade_category] || 0) + 1 })
        const topCats = Object.entries(catCount).sort(([,a],[,b]) => b - a).slice(0, 3)

        setStats({ avgDelivery, warrantyRate, avgVariations, avgScope, topCats, total: data.length })
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div style={{ background:'white', borderRadius:'10px', padding:'18px', border:'1px solid rgba(28,43,50,0.08)' }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[1,2,3].map(i => <div key={i} style={{ height:'32px', borderRadius:'6px', marginBottom:'8px', background:'linear-gradient(90deg,#E8F0EE 25%,#D8E8E4 50%,#E8F0EE 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />)}
    </div>
  )

  if (!stats) return (
    <div style={{ background:'white', borderRadius:'10px', padding:'18px', border:'1px solid rgba(28,43,50,0.08)' }}>
      <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#9AA5AA', margin:'0 0 10px' }}>WA Benchmarks</p>
      <p style={{ fontSize:'12px', color:'#9AA5AA', margin:0, lineHeight:1.6 }}>Benchmarks will appear once more jobs complete through Steadyhand.</p>
    </div>
  )

  return (
    <div style={{ background:'white', borderRadius:'10px', padding:'18px', border:'1px solid rgba(28,43,50,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#9AA5AA', margin:0 }}>WA Live Benchmarks</p>
        <span style={{ fontSize:'10px', color:'#9AA5AA', background:'rgba(28,43,50,0.06)', padding:'2px 8px', borderRadius:'20px' }}>{stats.total} jobs</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
        {stats.avgDelivery && (
          <div style={{ background:'#F4F8F7', borderRadius:'8px', padding:'10px 12px' }}>
            <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 3px' }}>Avg delivery time</p>
            <p style={{ fontSize:'18px', fontWeight:700, color:'#0A0A0A', margin:'0 0 1px' }}>{stats.avgDelivery} days</p>
            <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>from first milestone to signoff</p>
          </div>
        )}
        {stats.warrantyRate !== null && (
          <div style={{ background:'#F4F8F7', borderRadius:'8px', padding:'10px 12px' }}>
            <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 3px' }}>Warranty claim rate</p>
            <p style={{ fontSize:'18px', fontWeight:700, color:'#0A0A0A', margin:'0 0 1px' }}>{stats.warrantyRate}%</p>
            <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>of completed jobs</p>
          </div>
        )}
        {stats.avgVariations && (
          <div style={{ background:'#F4F8F7', borderRadius:'8px', padding:'10px 12px' }}>
            <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 3px' }}>Avg variations per job</p>
            <p style={{ fontSize:'18px', fontWeight:700, color:'#0A0A0A', margin:'0 0 1px' }}>{stats.avgVariations}</p>
            <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>scope changes after agreement</p>
          </div>
        )}
        {stats.topCats.length > 0 && (
          <div style={{ background:'#F4F8F7', borderRadius:'8px', padding:'10px 12px' }}>
            <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 8px' }}>Top trades on platform</p>
            {stats.topCats.map(([cat, count]: [string, number]) => (
              <div key={cat} style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>{cat}</p>
                <p style={{ fontSize:'12px', color:'#9AA5AA', margin:0 }}>{count} jobs</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <p style={{ fontSize:'10px', color:'#C8D5D2', margin:'12px 0 0', lineHeight:1.5 }}>Anonymised · Steadyhand platform data · WA only</p>
    </div>
  )
}

export function ObservatoryPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [refreshKey, setRefreshKey] = useState(0)
  const pinnedForCategory = PINNED_ITEMS.filter(p => p.category === activeCategory.id)

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Stay up-to-date</p>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap' as const, gap:'12px' }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-aboreto, Georgia, serif)', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'3px', margin:'0 0 8px' }}>STEADYHAND TRADE OBSERVATORY</h1>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0, maxWidth:'500px', lineHeight:1.6 }}>Live intelligence on legislation, warranty rulings, building material alerts, Fair Work decisions, and legal precedents affecting Australian trade professionals and homeowners.</p>
            </div>
            <button type="button" onClick={() => setRefreshKey(k => k+1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(216,228,225,0.7)', padding:'8px 16px', borderRadius:'7px', fontSize:'12px', cursor:'pointer' }}>↻ Refresh</button>
          </div>
        </div>
      </div>
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', overflowX:'auto' as const }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', display:'flex' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} type="button" onClick={() => setActiveCategory(cat)} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'6px', padding:'14px 18px', border:'none', borderBottom: activeCategory.id===cat.id ? `2px solid ${cat.color}` : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'12px', fontWeight: activeCategory.id===cat.id ? 600 : 400, color: activeCategory.id===cat.id ? '#0A0A0A' : '#7A9098', whiteSpace:'nowrap' as const }}>
              <span>{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'24px' }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h2 style={{ fontSize:'15px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{activeCategory.icon} {activeCategory.label}</h2>
              <span style={{ fontSize:'11px', color:'#9AA5AA' }}>AI + curated</span>
            </div>
            <CategoryPanel category={activeCategory} pinnedItems={pinnedForCategory} refreshKey={refreshKey} />
          </div>
          <div>
            <div style={{ background:'#0A0A0A', borderRadius:'10px', padding:'18px', marginBottom:'16px' }}>
              <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', margin:'0 0 12px' }}>About</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', lineHeight:1.7, margin:'0 0 12px' }}>The Steadyhand Trade Observatory tracks legislation, tribunal decisions, warranty rulings, building material alerts, and legal precedents across all Australian states. It serves as a practical resource for homeowners, trade businesses, property managers, and anyone navigating the residential building and trade services landscape.</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', lineHeight:1.7, margin:'0 0 12px' }}>The tracker is updated regularly as new legislation, decisions, and alerts emerge. Content is sourced from state building commissions, the Fair Work Commission, ACCC, and Australian courts and tribunals. Always refer to the linked source materials for authoritative information.</p>
              <a href="mailto:info@steadyhanddigital.com" style={{ fontSize:'12px', color:'#D4522A', textDecoration:'none', fontWeight:500 }}>info@steadyhanddigital.com →</a>
            </div>
            <div style={{ background:'white', borderRadius:'10px', padding:'18px', border:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#9AA5AA', margin:'0 0 14px' }}>Key sources</p>
              {[{ name:'Fair Work Commission', url:'https://www.fwc.gov.au' },{ name:'ACCC', url:'https://www.accc.gov.au' },{ name:'DMIRS WA', url:'https://www.dmirs.wa.gov.au' },{ name:'NSW Fair Trading', url:'https://www.fairtrading.nsw.gov.au' },{ name:'VBA Victoria', url:'https://www.vba.vic.gov.au' },{ name:'QBCC Queensland', url:'https://www.qbcc.qld.gov.au' },{ name:'SAT WA', url:'https://www.sat.justice.wa.gov.au' },{ name:'NCAT NSW', url:'https://www.ncat.nsw.gov.au' },{ name:'VCAT Victoria', url:'https://www.vcat.vic.gov.au' },{ name:'ABCB', url:'https://www.abcb.gov.au' },{ name:'SafeWork Australia', url:'https://www.safeworkaustralia.gov.au' }].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display:'block', fontSize:'12px', color:'#2E6A8F', textDecoration:'none', marginBottom:'8px', fontWeight:500 }}>{s.name} ↗</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ObservatoryWidget() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    fetchIntelligence(cat).then(result => {
      setItems(result.slice(0,3).map((i: any) => ({ ...i, categoryLabel: cat.label, categoryColor: cat.color, categoryIcon: cat.icon })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ background:'white', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)', padding:'16px', height:'140px' }} />
  if (!items.length) return null
  const active = items[activeIdx]

  return (
    <div style={{ background:'white', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)', overflow:'hidden' }}>
      <div style={{ background:'#0A0A0A', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.5)', fontWeight:500 }}>{active.categoryIcon} Steadyhand AU Trade Intelligence</span>
        <a href="/observatory" style={{ fontSize:'11px', color:'#D4522A', textDecoration:'none', fontWeight:500 }}>View all →</a>
      </div>
      <div style={{ padding:'14px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
        <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'6px', flexWrap:'wrap' as const }}>
          <span style={{ fontSize:'10px', fontWeight:600, color:active.categoryColor, background:active.categoryColor+'15', padding:'2px 8px', borderRadius:'20px' }}>{active.categoryLabel}</span>
          {active.significance && <SignificanceBadge level={active.significance} />}
        </div>
        <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px', lineHeight:1.4 }}>{active.title}</p>
        <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 8px', lineHeight:1.5 }}>{active.summary?.slice(0,120)}...</p>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:'11px', color:'#9AA5AA' }}>{active.source} · {active.date}</span>
          {active.url && <a href={active.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px', color:active.categoryColor, textDecoration:'none', fontWeight:500 }}>Source ↗</a>}
        </div>
      </div>
      <div style={{ padding:'10px 14px', display:'flex', gap:'6px', justifyContent:'center', alignItems:'center', flexWrap:'nowrap' as const }}>
        {items.map((_,i) => <button key={i} type="button" onClick={() => setActiveIdx(i)} style={{ width: i===activeIdx?'20px':'6px', height:'6px', borderRadius:'3px', border:'none', background: i===activeIdx?'#D4522A':'rgba(28,43,50,0.15)', cursor:'pointer', padding:0, transition:'all 0.2s', flexShrink:0 }} />)}
      </div>
    </div>
  )
}

export default ObservatoryPage

// ══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE CAROUSEL — auto-advancing, full-width feature section
// ══════════════════════════════════════════════════════════════════════════════
export function ObservatoryCarousel() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5).slice(0, 3)

    // Render pinned items immediately — zero wait
    const pinnedAsItems = PINNED_ITEMS.slice(0, 3).map((p: any) => ({
      ...p,
      categoryLabel: 'WA Update',
      categoryColor: '#2E6A8F',
      categoryIcon: '📋',
    }))

    // Check cache first
    const cachedItems = shuffled.flatMap(cat => {
      const cached = getCached('sh_obs_' + cat.id)
      if (!cached) return []
      return cached.slice(0, 2).map((i: any) => ({
        ...i,
        categoryLabel: cat.label,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
      }))
    }).slice(0, 5)

    // Show immediately — cached AI items if available, otherwise pinned items
    setItems(cachedItems.length >= 2 ? cachedItems : pinnedAsItems)
    setLoading(false)

    // Fetch AI content in background without blocking
    if (cachedItems.length < 2) {
      const firstCat = shuffled[0]
      Promise.resolve(fetchIntelligence(firstCat)).then((items: any[]) => {
        const aiItems = items.slice(0, 5).map((i: any) => ({
          ...i,
          categoryLabel: firstCat.label,
          categoryColor: firstCat.color,
          categoryIcon: firstCat.icon,
        }))
        if (aiItems.length > 0) setItems(aiItems)
        shuffled.slice(1).forEach(cat => fetchIntelligence(cat))
      }).catch(() => {})
    } else {
      shuffled.forEach(cat => { if (!getCached('sh_obs_' + cat.id)) fetchIntelligence(cat) })
    }
  }, [])

  // Auto-advance every 5s
  useEffect(() => {
    if (paused || items.length === 0) return
    const t = setTimeout(() => setActiveIdx(i => (i + 1) % items.length), 5000)
    return () => clearTimeout(t)
  }, [activeIdx, paused, items.length])

  if (loading) return (
    <div style={{ background:'#0A0A0A', padding:'64px 32px' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto' }}>
        <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        <div style={{ height:'16px', width:'200px', borderRadius:'4px', background:'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', marginBottom:'32px' }} />
        <div style={{ height:'120px', borderRadius:'12px', background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      </div>
    </div>
  )

  if (!items.length) return null

  const active = items[activeIdx]

  return (
    <div style={{ background:'#0A0A0A', padding:'64px 0' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 32px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'32px', flexWrap:'wrap' as const, gap:'12px' }}>
          <div>
            <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.3)', marginBottom:'8px' }}>Steadyhand AU Trade Intelligence</p>
            <h2 style={{ fontFamily:'var(--font-aboreto, Georgia, serif)', fontSize:'clamp(20px,2.5vw,26px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:0 }}>STEADYHAND TRADE OBSERVATORY</h2>
          </div>
          <a href="/observatory" style={{ fontSize:'13px', color:'#D4522A', textDecoration:'none', fontWeight:500, border:'1px solid rgba(212,82,42,0.3)', padding:'8px 16px', borderRadius:'7px' }}>
            View full observatory →
          </a>
        </div>

        {/* Main carousel card */}
        <div className="observatory-grid" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'24px', alignItems:'start' }}>

          {/* Active item */}
          <a href="/observatory" style={{ textDecoration:'none', display:'block' }}>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderLeft:`3px solid ${active.categoryColor}`, borderRadius:'12px', padding:'28px 32px', minHeight:'160px', transition:'background 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px', flexWrap:'wrap' as const }}>
                <span style={{ fontSize:'18px' }}>{active.categoryIcon}</span>
                <span style={{ fontSize:'11px', fontWeight:600, color:active.categoryColor, background:active.categoryColor + '20', padding:'3px 10px', borderRadius:'20px', letterSpacing:'0.5px' }}>{active.categoryLabel}</span>
                {active.significance && (
                  <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'20px', background:'rgba(255,255,255,0.06)', color:'rgba(216,228,225,0.5)' }}>
                    {active.significance === 'high' ? '● High significance' : active.significance === 'medium' ? '◐ Medium' : '○ Low'}
                  </span>
                )}
                <span style={{ fontSize:'11px', color:'rgba(216,228,225,0.3)', marginLeft:'auto' }}>{active.date}</span>
              </div>
              <p style={{ fontSize:'17px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:'0 0 10px', lineHeight:1.4 }}>{active.title}</p>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', margin:'0 0 16px', lineHeight:1.7 }}>{active.summary}</p>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)' }}>{active.source}</span>
                <span style={{ fontSize:'12px', color:'#D4522A', fontWeight:500 }}>Read more →</span>
              </div>
            </div>
          </a>

          {/* Item list */}
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {items.map((item, i) => (
              <button key={i} type="button" onClick={() => setActiveIdx(i)}
                style={{ background: i === activeIdx ? 'rgba(255,255,255,0.06)' : 'transparent', border:`1px solid ${i === activeIdx ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`, borderLeft:`2px solid ${i === activeIdx ? item.categoryColor : 'transparent'}`, borderRadius:'8px', padding:'12px 14px', cursor:'pointer', textAlign:'left' as const, transition:'all 0.15s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                  <span style={{ fontSize:'12px' }}>{item.categoryIcon}</span>
                  <span style={{ fontSize:'10px', color:item.categoryColor, fontWeight:600 }}>{item.categoryLabel}</span>
                </div>
                <p style={{ fontSize:'12px', color: i === activeIdx ? 'rgba(216,228,225,0.8)' : 'rgba(216,228,225,0.4)', margin:0, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>{item.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:'6px', justifyContent:'center', alignItems:'center', marginTop:'24px', flexWrap:'nowrap' as const }}>
          {items.map((_, i) => (
            <button key={i} type="button" onClick={() => setActiveIdx(i)}
              style={{ width: i === activeIdx ? '24px' : '6px', height:'4px', borderRadius:'2px', border:'none', background: i === activeIdx ? '#D4522A' : 'rgba(255,255,255,0.15)', cursor:'pointer', padding:0, transition:'all 0.3s', flexShrink:0 }} />
          ))}
        </div>

      </div>
    </div>
  )
}
