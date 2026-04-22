'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { id: 'legislation',  label: 'Legislation',      icon: '⚖️',  color: '#2E6A8F', prompt: 'WA building trades construction legislation updates 2024 2025 Building Services Registration Act Home Building Contracts Act' },
  { id: 'fairwork',     label: 'Fair Work',         icon: '🤝',  color: '#2E7D60', prompt: 'Fair Work Australia contractor employee misclassification trade workers WA 2024 2025 rulings decisions' },
  { id: 'dmirs',        label: 'DMIRS',             icon: '🏛️',  color: '#6B4FA8', prompt: 'DMIRS WA Department Mines Industry Regulation Safety building contractor licence registration changes 2024 2025' },
  { id: 'awards',       label: 'Awards & EBAs',     icon: '💰',  color: '#C07830', prompt: 'WA construction building trades award rates EBA enterprise bargaining 2024 2025 wage increases' },
  { id: 'precedents',   label: 'Legal Precedents',  icon: '🔍',  color: '#9B6B9B', prompt: 'WA court tribunal notable decisions building contractor disputes payment defects 2024 2025' },
  { id: 'digital',      label: 'Digital Work Law',  icon: '💻',  color: '#D4522A', prompt: 'digital platform work gig economy Australia WA legislation regulation 2024 2025 contractor rights app-based work' },
]

const PINNED_ITEMS: any[] = [
  { id: 'pin-1', category: 'legislation', title: 'Building Services (Registration) Amendment Act 2024', summary: 'Amendments expanding contractor registration requirements for residential builders and plumbers operating in WA. New categories effective 1 July 2024.', date: '2024-07-01', source: 'WA Government', url: 'https://www.commerce.wa.gov.au', pinned: true },
  { id: 'pin-2', category: 'fairwork', title: 'Employee vs Contractor: High Court clarification', summary: 'CFMEU v Personnel Contracting [2022] HCA 1 continues to reshape how trade businesses structure subcontractor arrangements. Key test: written terms of the contract govern.', date: '2022-02-09', source: 'High Court of Australia', url: 'https://www.hcourt.gov.au', pinned: true },
]

async function fetchIntelligence(category: any) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a WA trade industry intelligence analyst. Return ONLY a JSON array of 4 recent intelligence items. Each item must have: id (string), title (string max 80 chars), summary (string max 200 chars), date (YYYY-MM-DD), source (string), url (string), significance ("high"|"medium"|"low"). Return ONLY the JSON array, no markdown.',
        messages: [{ role: 'user', content: `Find 4 important recent developments for WA trade professionals related to: ${category.prompt}` }],
      }),
    })
    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'
    return JSON.parse(text.replace(/```json|```/g, '').trim()).map((i: any) => ({ ...i, category: category.id }))
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
          <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Steadyhand Intelligence</p>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap' as const, gap:'12px' }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-aboreto, Georgia, serif)', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'3px', margin:'0 0 8px' }}>WA TRADE OBSERVATORY</h1>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0, maxWidth:'500px', lineHeight:1.6 }}>Live intelligence on legislation, Fair Work decisions, DMIRS updates, award rates and legal precedents affecting WA trade professionals.</p>
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
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', lineHeight:1.7, margin:'0 0 12px' }}>Intelligence is AI-generated and curated by the Steadyhand team. Always verify with the original source before taking legal or commercial action.</p>
              <a href="mailto:hello@steadyhandtrade.app" style={{ fontSize:'12px', color:'#D4522A', textDecoration:'none', fontWeight:500 }}>Submit an item →</a>
            </div>
            <WABenchmarks />

            <div style={{ background:'white', borderRadius:'10px', padding:'18px', border:'1px solid rgba(28,43,50,0.08)', marginTop:'16px' }}>
              <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#9AA5AA', margin:'0 0 14px' }}>Key sources</p>
              {[{ name:'DMIRS WA', url:'https://www.dmirs.wa.gov.au' },{ name:'Fair Work Commission', url:'https://www.fwc.gov.au' },{ name:'Building Commission WA', url:'https://www.buildingcommission.wa.gov.au' },{ name:'WA State Law Publisher', url:'https://www.legislation.wa.gov.au' },{ name:'SafeWork Australia', url:'https://www.safeworkaustralia.gov.au' }].map(s => (
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
        <span style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.5)', fontWeight:500 }}>{active.categoryIcon} Trade Observatory</span>
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
      <div style={{ padding:'10px 14px', display:'flex', gap:'6px', justifyContent:'center' }}>
        {items.map((_,i) => <button key={i} type="button" onClick={() => setActiveIdx(i)} style={{ width: i===activeIdx?'20px':'6px', height:'6px', borderRadius:'3px', border:'none', background: i===activeIdx?'#D4522A':'rgba(28,43,50,0.15)', cursor:'pointer', padding:0, transition:'all 0.2s' }} />)}
      </div>
    </div>
  )
}

export default ObservatoryPage
