import Link from 'next/link'
export const metadata = { title:'Roofing Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does roofing cost in Perth and WA? 2025 pricing for Colorbond, tile and flat roofs with WA-specific UV and coastal factors.' }
export default function RoofingGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}><Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link><Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link></div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Roofing</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}><span style={{ fontSize:'32px' }}>🏠</span><h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>ROOFING COSTS IN WA</h1></div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for roof replacement, repairs and restoration across Perth and regional WA — with the WA-specific factors that make roofing here different from the eastern states.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p></div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Colorbond re-roof (per m²)', range:'$60–$110/m²', note:'Supply and install, single storey' },
              { item:'Tile re-roof (per m²)', range:'$50–$90/m²', note:'Concrete tile, supply and install' },
              { item:'Flat roof membrane', range:'$80–$150/m²', note:'Torch-on or TPO membrane' },
              { item:'Roof restoration (paint/seal)', range:'$2,500–$6,000', note:'Clean, seal, paint — no replacement' },
              { item:'Gutter replacement (per lm)', range:'$35–$70/lm', note:'Colorbond, supply and install' },
              { item:'Leak repair', range:'$200–$800', note:'Diagnosis and fix, single location' },
              { item:'Fascia/soffit replacement', range:'$40–$80/lm', note:'Timber or aluminium' },
              { item:'Valley replacement', range:'$150–$400/valley', note:'Lead or Colorbond' },
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
              { factor:'WA\'s UV and thermal cycling', detail:'Perth\'s roof surfaces experience some of the most extreme UV exposure in the world, combined with summer temperatures that push roof surface temps above 70°C and cool winter nights. This thermal cycling is brutal on tile bedding mortar, ridge capping, roof membranes and lead flashing. Budget for ridge capping replacement and repointing on any roof over 20 years old — in Perth suburbs like Dianella, Morley and Bentley where post-war tile roofs are common, this is almost always needed.' },
              { factor:'Colorbond vs tile — the WA preference', detail:'Western Australia has a higher proportion of Colorbond roofs than any other state — driven by the perceived low maintenance, lighter weight and better performance in bushfire-prone areas. Colorbond is now the dominant choice in new builds from Alkimos to Byford. Tile roofs are still common in older inner suburbs and the Hills. A Colorbond re-roof over an existing tile roof requires structural assessment — the existing frame may need reinforcing as Colorbond is lighter but the installation process is different.' },
              { factor:'Coastal corrosion', detail:'Properties within 1km of the ocean — Cottesloe, Scarborough, Trigg, North Fremantle — require roofing products specifically rated for marine environments. Colorbond offers a "Coastal" and "Ultra" range for these applications. Standard Colorbond will corrode prematurely in high-salt-air environments. Ask your roofer specifically about the product specification for your location.' },
              { factor:'Regional WA and cyclone rating', detail:'Properties in the Pilbara, Kimberley and Mid-West (Geraldton north) fall within Cyclone Wind Region C and D under AS 1170. Roofing in these areas requires cyclone-rated fixings, tested products and in many cases engineering certification. Broome, Port Hedland and Karratha roofing is a specialist market — expect 40–80% higher rates than Perth and significant lead times for materials.' },
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
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>Roof work in WA above a value threshold requires a Building Service (Contractor) or Building Service (Tradesperson) registration. Any roofing contractor working on a home must hold current public liability insurance. Roofing work that affects waterproofing or structural elements must comply with the National Construction Code and relevant Australian Standards.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>Always ask for a written warranty — both on materials (typically 10–25 years from the manufacturer for Colorbond) and on workmanship (minimum 5 years is reasonable to request). The workmanship warranty is only as good as the contractor still being in business to honour it.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}><p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p></div>
          <div style={{ padding:'16px 20px' }}>
            {['Do you hold a Building Service registration and public liability insurance?','What product are you quoting — Colorbond Coastal/Ultra for properties near the coast?','Does the quote include ridge capping replacement and repointing?','Does the existing frame need any reinforcing or repairs?','What workmanship warranty do you provide, and in writing?','Is the quote for full replacement or restoration — what is the expected life difference?','For regional properties: is the product cyclone-rated for this wind zone?','Will you inspect the roof space for any damage before quoting?'].map((q,i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i<7?'1px solid rgba(28,43,50,0.06)':'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['Quote provided without a physical roof inspection','Standard Colorbond quoted for a property within 1km of the coast','No mention of ridge capping condition on an older tile roof','No workmanship warranty offered in writing','Significantly cheaper than other quotes with no explanation of scope differences'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i<4?'8px':0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA ROOFERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your roofing job on Steadyhand. The scope agreement documents product specification, warranty terms and workmanship commitments before work begins.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your roofing job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}><p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p></div>
    </div>
  )
}
