import Link from 'next/link'

export const metadata = {
  title: 'WA Trade Cost Guides 2025 — Steadyhand',
  description: 'Honest cost guides for home trades in Western Australia. Perth and regional WA pricing, what drives costs up or down, what to ask at the consult, and WA licensing requirements.',
}

const GUIDES = [
  { slug:'electrical', label:'Electrical', icon:'⚡', range:'$80–$180/hr', desc:'Switchboard upgrades, power points, lighting, solar connections and safety inspections across Perth and regional WA.', color:'#C07830' },
  { slug:'plumbing', label:'Plumbing & Gas', icon:'🔧', range:'$90–$200/hr', desc:'Hot water systems, pipe repairs, bathroom fit-outs, gas fitting and drainage. WA plumbers must hold a WA Plumbing licence.', color:'#2E6A8F' },
  { slug:'tiling', label:'Tiling', icon:'🪟', range:'$45–$120/m²', desc:'Floor and wall tiling for bathrooms, kitchens and outdoor areas. Price varies significantly with substrate, waterproofing and tile format.', color:'#9B6B9B' },
  { slug:'painting', label:'Painting', icon:'🖌️', range:'$20–$45/m²', desc:'Interior and exterior painting in Perth. Climate, surface prep and product quality drive significant variation in quotes.', color:'#D4522A' },
  { slug:'roofing', label:'Roofing', icon:'🏠', range:'$50–$120/m²', desc:'Colorbond, tile and flat roof systems. WA\'s UV intensity and coastal salt air demand quality materials and experienced installation.', color:'#2E7D60' },
  { slug:'concreting', label:'Concreting & Paving', icon:'🧱', range:'$60–$130/m²', desc:'Driveways, slabs, paths and exposed aggregate. Perth\'s sandy soils affect preparation requirements significantly.', color:'#7A9098' },
  { slug:'air-conditioning', label:'Air Conditioning', icon:'❄️', range:'$1,200–$4,500', desc:'Split system supply and install across Perth. WA\'s extreme summer heat makes sizing and brand selection critical.', color:'#2E6A8F' },
  { slug:'carpentry', label:'Carpentry & Joinery', icon:'🪵', range:'$60–$120/hr', desc:'Decking, pergolas, doors, frames and custom joinery. Perth\'s outdoor lifestyle drives high demand for decking and alfresco work.', color:'#C07830' },
  { slug:'landscaping', label:'Landscaping', icon:'🌿', range:'$50–$150/hr', desc:'Garden design, reticulation, turf and hardscape. WA water restrictions and summer heat shape every landscaping decision.', color:'#2E7D60' },
  { slug:'bathroom-renovation', label:'Bathroom Renovation', icon:'🚿', range:'$12,000–$35,000', desc:'Full bathroom renovations in Perth. Involves multiple trades — tiler, plumber, electrician — and scope clarity is essential.', color:'#6B4FA8' },
]

export default function GuidesPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      {/* Nav */}
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
          <Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.6)', textDecoration:'none' }}>Cost guides</Link>
          <Link href="/login" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background:'#0A0A0A', padding:'48px 24px 40px' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.35)', marginBottom:'8px' }}>Western Australia · 2025</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(24px, 5vw, 38px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:'0 0 14px', lineHeight:'1.2' }}>
            WA TRADE COST GUIDES
          </h1>
          <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.5)', lineHeight:'1.75', maxWidth:'600px', margin:'0 0 20px' }}>
            Honest pricing guides for home trades in Perth and regional Western Australia. Not national averages — real WA rates, with the factors that drive costs up or down, and what to ask at the consult.
          </p>
          <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' as const }}>
            {['Perth metro rates', 'Regional WA premiums', 'WA licensing requirements', 'Consult checklists'].map(tag => (
              <span key={tag} style={{ fontSize:'12px', color:'rgba(216,228,225,0.5)', display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#D4522A', flexShrink:0, display:'inline-block' }} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Guide cards */}
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'14px', marginBottom:'40px' }}>
          {GUIDES.map(g => (
            <Link key={g.slug} href={'/guides/' + g.slug} style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', height:'100%', cursor:'pointer', transition:'box-shadow 0.15s' }}>
                <div style={{ background:'#0A0A0A', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'22px' }}>{g.icon}</span>
                  <span style={{ fontSize:'13px', fontWeight:600, color:g.color }}>{g.range}</span>
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 6px' }}>{g.label.toUpperCase()}</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', margin:'0 0 12px' }}>{g.desc}</p>
                  <p style={{ fontSize:'12px', color:g.color, margin:0, fontWeight:500 }}>Read guide →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background:'#0A0A0A', borderRadius:'16px', padding:'32px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 10px' }}>READY TO GET A QUOTE?</p>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.7', margin:'0 0 20px', maxWidth:'480px', marginLeft:'auto', marginRight:'auto' }}>
            Post your job on Steadyhand and receive quotes from verified WA tradies — with a signed scope agreement, milestone payments and a warranty record built in.
          </p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'13px 28px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>
            Post a job →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:'#0A0A0A', padding:'24px', textAlign:'center' as const, marginTop:'24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.25)', margin:0 }}>Steadyhand · Western Australia · Prices are indicative ranges based on 2025 WA market rates. Always obtain multiple quotes.</p>
      </div>
    </div>
  )
}
