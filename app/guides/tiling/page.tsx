import Link from 'next/link'
export const metadata = { title:'Tiler Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does tiling cost in Perth and WA? 2025 pricing for floor and wall tiling, bathrooms and outdoor areas with WA-specific factors.' }
export default function TilingGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px' }}><Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link><Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link></div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Tiling</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}><span style={{ fontSize:'32px' }}>🪟</span><h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px, 5vw, 32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>TILER COSTS IN WA</h1></div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for floor and wall tiling across Perth and regional WA — and why the same job can vary by 60% depending on substrate, waterproofing and tile selection.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(155,107,155,0.08)', borderBottom:'1px solid rgba(155,107,155,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#9B6B9B', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p></div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Floor tiling (labour only)', range:'$45–$85/m²', note:'Standard format, good substrate' },
              { item:'Floor tiling (supply & lay)', range:'$80–$160/m²', note:'Includes mid-range tile' },
              { item:'Wall tiling (labour only)', range:'$55–$100/m²', note:'Bathroom walls' },
              { item:'Large format tiles (>600mm)', range:'+$20–$40/m²', note:'Premium on standard rates' },
              { item:'Waterproofing (bathroom)', range:'$400–$900', note:'Wet area membrane' },
              { item:'Tile removal', range:'$15–$30/m²', note:'Before re-tiling' },
              { item:'Outdoor/alfresco tiling', range:'$60–$120/m²', note:'Slip rating and substrate prep' },
              { item:'Pool surrounds', range:'$80–$150/m²', note:'Wet area, non-slip, drainage' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#9B6B9B', margin:'0 0 2px' }}>{r.range}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p></div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'Substrate condition', detail:'The single biggest variable in a tiling quote is what is under the existing tiles or floor. In Perth bathrooms — particularly homes built in the 1970s–1990s in areas like Karrinyup, Dianella and Belmont — the substrate beneath old tiles is often degraded compressed fibre cement (called "compressed sheet" or "Hardiflex"). Tiling over a poor substrate results in cracked tiles within months. A good tiler will insist on replacement, which adds $15–$30/m² but is unavoidable. Beware of anyone who does not mention it.' },
              { factor:'Waterproofing in wet areas', detail:'Since 2004, the WA Building Code requires proper waterproofing membranes in all wet areas. Any bathroom retile should include a waterproofing membrane applied and cured before tiling begins. This costs $400–$900 for a standard bathroom and is non-negotiable. Tilers who quote without including waterproofing are either excluding it deliberately (and leaving you exposed to water damage) or not aware of the requirement — neither is acceptable.' },
              { factor:'Large format tile premium', detail:'Tiles over 600mm — a popular choice in modern Perth homes — require more skill to lay flat (lippage is unforgiving at scale), heavier adhesive beds and more waste allowance at cuts. Expect to add $20–$40/m² on top of standard rates. In Perth\'s new build suburbs — Ellenbrook, Baldivis, Byford — large format is now standard, so most tilers are experienced with it.' },
              { factor:'Perth\'s outdoor lifestyle premium', detail:'Alfresco areas, pool surrounds and outdoor kitchens are extremely common in WA, and outdoor tiling is more demanding than indoor work. Tiles must be rated for slip resistance (P4 or P5 for pool areas under AS 4586), drainage must be planned into the layout, and the substrate must handle temperature expansion. Budget separately for outdoor work — it is not the same job as indoor tiling.' },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #9B6B9B', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>WA LICENSING REQUIREMENTS</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>Tiling itself does not require a specific trade licence in WA, but any associated waterproofing in wet areas must be applied by — or under supervision of — a licensed waterproofer where the work is done as part of a regulated building project. For domestic renovations, a registered building contractor should oversee the work. Always ask for evidence of waterproofing experience and ask to see previous work. The waterproofing membrane must comply with AS 3740.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p></div>
          <div style={{ padding:'16px 20px' }}>
            {['What is the condition of the substrate — does it need replacing before tiling?','Will waterproofing be included and which membrane product will be used?','What is the minimum cure time before tiling begins?','How do you handle large format tiles — what is your lippage tolerance?','What is your waste allowance for cuts and how is this reflected in the tile quantity?','Do you supply the tiles or do I purchase separately?','How do you handle the transition between tiled and non-tiled areas?','What slip rating are the outdoor/pool tiles and do they meet AS 4586?'].map((q,i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i < 7 ? '1px solid rgba(28,43,50,0.06)':'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['No mention of substrate inspection before quoting','Waterproofing not included in bathroom quotes — or quoted at suspiciously low cost','No discussion of wet area compliance (AS 3740)','Unwilling to provide references or photos of previous work','Price per m² that seems too good to be true — usually means no waterproofing or poor substrate prep'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i < 4 ? '8px':0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA TILERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your tiling job on Steadyhand. The scope agreement documents substrate condition, waterproofing spec and tile format — protecting you if anything goes wrong.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your tiling job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p>
      </div>
    </div>
  )
}
