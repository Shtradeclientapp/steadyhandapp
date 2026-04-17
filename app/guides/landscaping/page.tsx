import Link from 'next/link'
export const metadata = { title:'Landscaping Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does landscaping cost in Perth? 2025 pricing for gardens, reticulation, turf and hardscape with WA water restrictions and climate guidance.' }
export default function LandscapingGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}><Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link><Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link></div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}><div style={{ maxWidth:'760px', margin:'0 auto' }}>
        <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Landscaping</Link>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}><span style={{ fontSize:'32px' }}>🌿</span><h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>LANDSCAPING COSTS IN WA</h1></div>
        <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for garden design, reticulation, turf and hardscape in Perth — shaped entirely by WA's water restrictions, sandy soils and extreme summer heat.</p>
      </div></div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p></div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Landscaper hourly rate', range:'$55–$110/hr', note:'Experienced, licensed' },
              { item:'Garden design (small)', range:'$500–$1,500', note:'Plans and plant schedule' },
              { item:'Turf supply and lay (per m²)', range:'$18–$35/m²', note:'Sir Walter/Kikuyu, prep included' },
              { item:'Reticulation (new install)', range:'$2,500–$6,000', note:'Standard 600m² block' },
              { item:'Reticulation (service/upgrade)', range:'$400–$1,500', note:'Controller, heads, repairs' },
              { item:'Garden bed establishment', range:'$40–$80/m²', note:'Soil prep, mulch, plants' },
              { item:'Retaining wall (limestone)', range:'$250–$450/lm', note:'Per linear metre, 600mm high' },
              { item:'Synthetic turf (per m²)', range:'$60–$100/m²', note:'Supply and install, good grade' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#2E7D60', margin:'0 0 2px' }}>{r.range}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p></div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'WA water restrictions — the defining constraint', detail:'Perth operates under permanent Water Wise Rules from the Water Corporation. Sprinklers and reticulation can only operate on assigned watering days (typically 2 days per week in summer) and not between 9am and 6pm. Any landscaping design that does not account for this will fail. A good Perth landscaper designs for water-efficient species, efficient emitter selection, and zones that match the watering day schedule. Ask specifically how the design accounts for WA water restrictions.' },
              { factor:'Sandy soil amendments', detail:'Perth\'s sandy soils drain rapidly and hold almost no nutrients. Establishing a garden without soil amendment — composted organic matter, clay minerals (bentonite), wetting agents — almost always results in failure in summer. The soil preparation cost is often where cheaper quotes cut corners. Ask for a soil test and a specific amendment plan before any planting, particularly in newer suburbs like Baldivis, Piara Waters and Alkimos where topsoil has often been stripped during construction.' },
              { factor:'Summer heat and establishment timing', detail:'Planting in Perth summer (November–March) is high risk without significant irrigation support. Experienced Perth landscapers plan planting around the autumn window (April–June) when soils are still warm but days are cooling and rainfall begins. Jobs quoted for summer start dates are either high-risk or have a significantly higher establishment watering cost built in. Ask about the proposed planting schedule and how establishment will be managed.' },
              { factor:'Reticulation and water efficiency', detail:'Reticulation in Perth is subject to strict requirements. Controllers must comply with WA water restrictions settings. Sprinkler head selection (fixed versus rotary) has a significant impact on water use — rotary heads apply water more slowly and suit sandy soils better. A well-designed reticulation system in Perth should include rain sensors (required by law for new installations) and soil moisture sensing for efficiency. Ask what heads and controller are specified.' },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #2E7D60', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>WA LICENSING REQUIREMENTS</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>Landscaping in WA does not require a specific trade licence for most garden and soft landscaping work. However, reticulation work connecting to the mains supply must comply with Water Corporation standards, and any work near underground services requires a Dial Before You Dig check. Retaining walls over 500mm in height may require a Building Permit and engineering certification depending on your local council.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>New reticulation systems must include a rain sensor — this is required under WA Water Wise Rules. Controllers must be capable of being set to the correct watering days and times. Ask your landscaper to confirm the system will be compliant before installation begins.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p></div>
          <div style={{ padding:'16px 20px' }}>
            {['What soil amendments are included and what is the specification?','How does the design account for WA water restrictions?','What watering days will this system be set to and how much water will it use?','Is the reticulation system Water Wise Rules compliant — does it include a rain sensor?','What turf species are you recommending and why for this aspect and soil?','When do you propose to plant — and how will you manage summer establishment?','What plant species are you specifying and are they drought-tolerant for Perth conditions?','Does any retaining wall require a Building Permit or engineering certificate?'].map((q,i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i<7?'1px solid rgba(28,43,50,0.06)':'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['Design makes no reference to WA water restrictions or watering day compliance','No soil amendment plan for sandy soil — planting will fail in summer','Planting scheduled in Perth summer without irrigation establishment plan','Reticulation system without rain sensor — non-compliant with WA law','Retaining wall over 500mm proposed without permit discussion'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i<4?'8px':0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA LANDSCAPERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your landscaping job on Steadyhand — scope locks in soil amendment spec, plant schedule, water compliance and reticulation detail before the first shovel hits the ground.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your landscaping job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}><p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p></div>
    </div>
  )
}
