import Link from 'next/link'
export const metadata = { title:'Painter Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does painting cost in Perth and WA? 2025 pricing for interior and exterior painting with WA-specific climate and surface prep factors.' }
export default function PaintingGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}><Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link><Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link></div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Painting</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}><span style={{ fontSize:'32px' }}>🖌️</span><h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>PAINTER COSTS IN WA</h1></div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for interior and exterior painting across Perth and regional WA — and why Perth's UV intensity and coastal salt air make surface prep the most important line item in any painting quote.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(212,82,42,0.08)', borderBottom:'1px solid rgba(212,82,42,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p></div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Interior walls (per m²)', range:'$12–$25/m²', note:'2 coats, good condition' },
              { item:'Interior full repaint (3br home)', range:'$4,500–$9,000', note:'Walls, ceilings, trims' },
              { item:'Exterior repaint (single storey)', range:'$4,000–$10,000', note:'Prep, prime, 2 coats' },
              { item:'Exterior repaint (double storey)', range:'$7,000–$18,000', note:'Includes scaffolding' },
              { item:'Roof painting (tiles)', range:'$2,500–$6,000', note:'Clean, prime, coat' },
              { item:'Deck/timber staining', range:'$15–$35/m²', note:'Strip, sand, 2 coats' },
              { item:'Fence painting (per linear m)', range:'$15–$35/lm', note:'Both sides, timber' },
              { item:'Feature wall / special finish', range:'+$300–$800', note:'Per wall, premium product' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#D4522A', margin:'0 0 2px' }}>{r.range}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p></div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'Surface preparation — the most underquoted item', detail:'Perth painters consistently identify surface prep as the biggest cause of painting failures and quote disputes. Exterior surfaces in Perth face extreme UV, coastal salt air (particularly within 5km of the coast in suburbs like Cottesloe, Scarborough, City Beach and Hillarys) and thermal expansion from hot summers. Prep should include pressure washing, scraping, sanding, filling, spot priming and a full prime coat on bare surfaces. A quote that skips prep to hit a low price number will result in peeling paint within 2–3 years. Always ask what is included in prep.' },
              { factor:'Perth\'s UV and heat', detail:'Perth receives more UV radiation than almost any other major city in the world. Exterior paint in direct north or west-facing aspects in Perth typically needs repainting every 8–12 years with quality products, or as few as 5 years with budget paint. The difference in product cost between a premium exterior paint (Dulux Weathershield, Solver Permalite) and a budget line is $50–$80 per 10L — a rounding error on a $7,000 job but it doubles the life of the paint. Always ask which product is being quoted.' },
              { factor:'Coastal salt air', detail:'Properties within 1–2km of the coast in Perth — Fremantle, North Fremantle, Cottesloe, Swanbourne, Scarborough, Trigg, Sorrento — need products specifically formulated for salt-air exposure. Standard exterior paint fails faster in these environments. Ask your painter specifically about their product selection for coastal properties.' },
              { factor:'Rendered vs brick homes', detail:'Painted brick homes are common in older Perth suburbs — Midland, Bassendean, Maylands, South Perth. Rendered homes in newer suburbs — Canning Vale, Harrisdale, Wellard — typically have a smooth, easier-to-paint surface. Brick-painted homes require significantly more time and product due to the porous surface texture. Expect 20–30% higher rates for painted brick vs rendered.' },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #D4522A', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>WA LICENSING REQUIREMENTS</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>Residential painting in WA does not require a specific trade licence, but any painter working on a domestic building project with a value over $20,000 should hold a Building Service (Contractor) registration with the Building and Energy division of DMIRS. For smaller jobs, check the painter has public liability insurance (minimum $5M recommended) and can provide a written quote and warranty.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>Lead paint is present in many Perth homes built before 1970. Sanding or scraping lead paint without proper containment is hazardous. Ask your painter if they have lead paint awareness training for older homes — particularly those in heritage suburbs like Subiaco, Fremantle and Guildford.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p></div>
          <div style={{ padding:'16px 20px' }}>
            {['What does your prep process involve — pressure wash, sand, fill, prime?','Which paint product and brand are you quoting? Is it appropriate for coastal/UV exposure?','How many coats are included in the quote?','Do you have public liability insurance? Can I see the certificate?','How do you handle lead paint if found during prep?','Is scaffolding included for double-storey or hard-to-reach areas?','What warranty do you offer on your workmanship?','Will you provide a written scope before starting?'].map((q,i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i<7?'1px solid rgba(28,43,50,0.06)':'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['Quote that makes no mention of surface preparation','No specification of paint brand or product type','Significantly lower price than other quotes with no explanation','Reluctance to provide a written scope of works','No public liability insurance'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i<4?'8px':0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA PAINTERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your painting job on Steadyhand. The scope agreement locks in product specification, prep requirements and coat count — so there are no surprises.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your painting job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}><p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p></div>
    </div>
  )
}
