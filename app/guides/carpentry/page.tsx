import Link from 'next/link'
export const metadata = { title:'Carpenter Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does a carpenter cost in Perth? 2025 pricing for decking, pergolas, framing and joinery with WA outdoor lifestyle factors.' }
export default function CarpentryGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}><Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link><Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link></div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}><div style={{ maxWidth:'760px', margin:'0 auto' }}>
        <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Carpentry</Link>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}><span style={{ fontSize:'32px' }}>🪵</span><h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>CARPENTER COSTS IN WA</h1></div>
        <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for carpentry and joinery in Perth — decking, pergolas, alfresco structures and timber work in WA's outdoor-focused lifestyle.</p>
      </div></div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(192,120,48,0.08)', borderBottom:'1px solid rgba(192,120,48,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#C07830', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p></div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Carpenter hourly rate', range:'$70–$120/hr', note:'Licensed, experienced' },
              { item:'Timber deck (per m²)', range:'$300–$600/m²', note:'Hardwood, supply and install' },
              { item:'Composite decking (per m²)', range:'$350–$700/m²', note:'Trex/Modwood, supply and install' },
              { item:'Pergola (freestanding)', range:'$4,000–$12,000', note:'Timber, 4m x 4m approx' },
              { item:'Alfresco structure', range:'$6,000–$20,000', note:'Attached, roof sheeted, structural' },
              { item:'Garden shed installation', range:'$500–$1,500', note:'Kit assembly, concrete base extra' },
              { item:'Door hanging (per door)', range:'$150–$350', note:'Internal, includes hardware' },
              { item:'Custom joinery (per day)', range:'$600–$1,000', note:'Day rate, materials extra' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#C07830', margin:'0 0 2px' }}>{r.range}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p></div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'Timber selection for WA conditions', detail:'Perth\'s UV intensity, termite pressure and summer heat make timber selection critical for outdoor structures. Jarrah and Kwila (Merbau) are the dominant hardwood choices for Perth decks — both are durable but Kwila is significantly cheaper due to local supply of jarrah becoming limited and expensive. Composite decking (Trex, Modwood) has grown rapidly in Perth due to its termite resistance and low maintenance requirements. Pine is not suitable for ground-contact applications in WA due to termite risk — any carpenter suggesting pine posts in contact with soil in Perth should be questioned.' },
              { factor:'Termite risk in Perth', detail:'Perth has significant termite pressure — particularly in sandy soils in suburbs from the Hills down to the coast. Any timber structure requires either naturally termite-resistant species (jarrah, redgum) or H2 or H3 treated pine for above-ground applications. Ground contact timber must be H4 or H5 treated or naturally durable. A carpenter who does not discuss termite treatment for a deck or pergola in Perth is either inexperienced or cutting costs on materials.' },
              { factor:'Building permits for structures', detail:'Structures over a certain size in WA require a Building Permit from your local council. A freestanding pergola or alfresco structure over 10m² in most Perth councils requires a permit. The permit process typically costs $300–$800 and takes 2–6 weeks. Your carpenter should know the thresholds and advise you — not leave you to find out after the structure is built that it is unpermitted.' },
              { factor:'Perth\'s alfresco demand', detail:'Covered outdoor entertaining areas (alfresco, patio, pergola) are the most requested residential addition in Perth. Demand is consistently high, particularly in the September–November spring lead-up to summer. Experienced pergola and alfresco builders book out 6–12 weeks ahead. Do not expect to get a job done in November if you only start quoting in October.' },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #C07830', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>WA LICENSING REQUIREMENTS</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>Carpenters undertaking structural work in WA must hold a Building Service (Tradesperson) — Carpentry registration from Building and Energy. Any works forming part of a regulated building project (most residential structures) must be supervised or carried out by a registered building service provider.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>For structures requiring a Building Permit, the contractor must be registered. Verify registration at buildingandenergywa.com.au. Always confirm who is responsible for obtaining the Building Permit — the homeowner or the contractor.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p></div>
          <div style={{ padding:'16px 20px' }}>
            {['What timber species are you specifying and why is it appropriate for this application in Perth?','Is the timber termite resistant or H3/H4 treated — which standard applies?','Does this structure require a Building Permit and who will obtain it?','Are you a registered Building Service provider?','What is the maintenance requirement for this timber/composite over 10 years?','What is your warranty on the structure and the finish?','Can you provide references for similar work in Perth with photos?','Is the concrete footings work included in your scope?'].map((q,i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i<7?'1px solid rgba(28,43,50,0.06)':'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['Pine posts in ground contact without termite treatment specification','No mention of termite treatment for any timber structure','Structure requiring a permit being quoted without permit discussion','Unregistered contractor for structural work','No species or treatment specification in the quote — leaves room for substitution'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i<4?'8px':0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA CARPENTERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your carpentry job on Steadyhand — scope documents timber species, treatment standard, permit responsibility and warranty terms before work begins.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your carpentry job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}><p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p></div>
    </div>
  )
}
