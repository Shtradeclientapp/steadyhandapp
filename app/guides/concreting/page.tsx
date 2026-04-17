import Link from 'next/link'
export const metadata = { title:'Concreting Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does concreting cost in Perth? 2025 pricing for driveways, slabs and paths with WA sandy soil and climate factors.' }
export default function ConcretingGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}><Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link><Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link></div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}><div style={{ maxWidth:'760px', margin:'0 auto' }}>
        <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Concreting</Link>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}><span style={{ fontSize:'32px' }}>🧱</span><h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>CONCRETING COSTS IN WA</h1></div>
        <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for driveways, slabs, paths and exposed aggregate in Perth — and why Perth's sandy soils are the single biggest factor in every concrete job.</p>
      </div></div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(122,144,152,0.1)', borderBottom:'1px solid rgba(122,144,152,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#4A5E64', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p></div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Plain concrete (per m²)', range:'$60–$90/m²', note:'100mm slab, mesh reinforced' },
              { item:'Exposed aggregate (per m²)', range:'$80–$130/m²', note:'Standard aggregate, seeded' },
              { item:'Coloured concrete (per m²)', range:'$75–$110/m²', note:'Oxide coloured, sealed' },
              { item:'Honed/polished concrete', range:'$90–$150/m²', note:'Grind and polish, outdoor' },
              { item:'Concrete driveway (double)', range:'$5,000–$12,000', note:'~60m², plain or aggregate' },
              { item:'House slab (per m²)', range:'$100–$160/m²', note:'Engineer designed, post-tension' },
              { item:'Concrete path (per lm)', range:'$80–$150/lm', note:'1m wide, 75mm thick' },
              { item:'Concrete removal (per m²)', range:'$30–$60/m²', note:'Break out and remove' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#4A5E64', margin:'0 0 2px' }}>{r.range}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p></div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'Perth\'s sandy soils — the defining challenge', detail:'The vast majority of Perth is built on sandy, free-draining soil — the Swan Coastal Plain. This affects concrete work in two critical ways. First, sand requires compaction and in many cases lime stabilisation before a concrete slab is poured — the cost of this preparation is sometimes excluded from low quotes and revealed only during the job. Second, sand allows good drainage, which is beneficial for concrete longevity, but tree roots in sandy soil travel significant distances and can undermine slabs over time. Always ask what subgrade preparation is included.' },
              { factor:'Cracking risk in Perth\'s climate', detail:'Perth\'s temperature swings — cold mornings and very hot afternoons in summer — create thermal movement in concrete. Control joints (saw cuts) at regular intervals are essential to manage cracking, and they must be placed before the concrete has cured to be effective. A concreter who does not discuss control joint placement before pouring is cutting corners. This is particularly relevant for large areas like driveways and alfresco slabs.' },
              { factor:'Exposed aggregate — Perth\'s dominant choice', detail:'Exposed aggregate driveways and paths are the dominant choice in Perth residential construction — more so than any other Australian state. The local aggregate varieties (Donnybrook stone, pink quartz, river pebble) vary in availability and price. Local aggregates sourced from the Swan Valley or Gingin are cheaper than imported stone. Ask specifically what aggregate is being used and where it is sourced.' },
              { factor:'Access and pump requirements', detail:'Many Perth homes in established suburbs — Applecross, Como, Mount Pleasant, Floreat — have limited vehicle access to rear areas. Concrete pumping (an additional $500–$1,500) is often required for rear slabs, pathways through narrow gates or elevated alfresco areas. Always check whether pumping is included in the quote or is an additional cost.' },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #7A9098', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p></div>
          <div style={{ padding:'16px 20px' }}>
            {['What subgrade preparation is included — compaction, lime stabilisation, base course?','Where is this concrete being pumped from and is pump access required?','What control joint spacing and depth are you specifying?','What aggregate is being used and where is it sourced?','What thickness and reinforcement — mesh, reo bar or post-tension?','What is your sealer recommendation for this application and climate?','Does the quote include form work, stripping and all disposal?','What is your warranty on the finished surface?'].map((q,i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i<7?'1px solid rgba(28,43,50,0.06)':'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['No mention of subgrade preparation or compaction','Control joints not discussed before pour','Pump costs excluded from quote and revealed later','No specification of concrete strength (MPa) or reinforcement type','Quote with no site visit in a tight-access property'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i<4?'8px':0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA CONCRETERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your concreting job on Steadyhand — scope locks in subgrade prep, aggregate spec, thickness and control joint detail before the truck arrives.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your concreting job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}><p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p></div>
    </div>
  )
}
