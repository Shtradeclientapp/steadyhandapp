import Link from 'next/link'
export const metadata = { title:'Air Conditioning Cost Guide WA 2025 — Perth Pricing | Steadyhand', description:'How much does air conditioning cost in Perth? 2025 pricing for split system supply and install with WA-specific sizing and brand guidance.' }
export default function AirConGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link>
          <Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link>
        </div>
      </nav>
      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Air conditioning</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
            <span style={{ fontSize:'32px' }}>❄️</span>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>AIR CONDITIONING COSTS IN WA</h1>
          </div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for split system air conditioning in Perth — why sizing matters more than brand, and the installation factors unique to WA homes.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,106,143,0.08)', borderBottom:'1px solid rgba(46,106,143,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p>
          </div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'2.5kW split (small room)', range:'$1,200–$2,000', note:'Supply and install' },
              { item:'3.5kW split (medium room)', range:'$1,400–$2,400', note:'Supply and install' },
              { item:'5–6kW split (large room)', range:'$1,800–$3,200', note:'Supply and install' },
              { item:'7–8kW split (open plan)', range:'$2,200–$4,000', note:'Supply and install' },
              { item:'Multi-head system (3 zones)', range:'$5,500–$9,000', note:'Supply and install' },
              { item:'Ducted system (4br home)', range:'$8,000–$18,000', note:'Reverse cycle, supply and install' },
              { item:'Installation only (split)', range:'$400–$800', note:'Electrician labour, unit supplied' },
              { item:'Switchboard upgrade if needed', range:'$600–$1,500', note:'Additional circuit required' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#2E6A8F', margin:'0 0 2px' }}>{r.range}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p>
          </div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'Sizing for Perth — the most critical decision', detail:"Perth has extreme summer heat — days above 40°C are common in January and February — combined with cool winters. This temperature range is larger than most of Australia, and it drives hard on undersized air conditioners. A 2.5kW unit that might cool a bedroom in Sydney will struggle in a west-facing Perth bedroom in summer. Always ask for a heat load calculation for Perth conditions." },
              { factor:'Installation complexity in older homes', detail:"Perth post-war homes in suburbs like Balga, Mirrabooka and Gosnells often have limited roof space, no internal wall cavities for pipe runs, and aging switchboards needing circuit additions. Installation in these homes costs more than in a modern brick veneer home with accessible roof space. Always get a site inspection before accepting a quote." },
              { factor:'Coastal corrosion — the hidden warranty issue', detail:"Standard split system units installed within 1–2km of the coast in Cottesloe, Swanbourne, Scarborough, City Beach and Hillarys will corrode faster than their warranty period unless specifically protected. Ask about coastal or marine grade units and fin coating treatments. A corroded outdoor unit three years into a five-year warranty is a common dispute." },
              { factor:'Brand and efficiency — the long-term cost', detail:"Perth homes run air conditioning heavily — 4–5 months of cooling plus heating is common. A 1-star energy rating difference in a 5kW unit translates to roughly $150–$250 per year in electricity. Over 10 years, a higher-efficiency unit (Daikin, Mitsubishi Heavy, Fujitsu premium) can save $1,500–$2,500 versus a budget brand, even accounting for higher purchase price." },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #2E6A8F', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>WA LICENSING REQUIREMENTS</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>Air conditioning installation requires both an ARCtick refrigerant handling licence (Australian Refrigeration Council) and a WA Electrical Contractor Licence. The same person may hold both. A Certificate of Electrical Compliance must be issued on completion. Verify electrician licence at energysafety.wa.gov.au and refrigerant licence at arctick.com.au.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p>
          </div>
          <div style={{ padding:'16px 20px' }}>
            {[
              'Can you provide a heat load calculation for Perth conditions for this room?',
              'Is this unit rated for coastal environments if near the coast?',
              'What is the energy star rating and estimated annual running cost in Perth?',
              'Does my switchboard need a new circuit — is this included?',
              'Do you hold both an ARCtick licence and an Electrical Contractor Licence?',
              'Will a Certificate of Electrical Compliance be issued?',
              'What warranty do you offer on workmanship, separate from the manufacturer?',
              'What is the pipe run length and are there any access issues?',
            ].map((q, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i < 7 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {[
            'No site visit before quoting — sizing without seeing the space is guesswork',
            'Standard unit quoted for a coastal property without corrosion protection',
            'No mention of switchboard assessment',
            'Unlicensed refrigerant handling — ARCtick licence is mandatory',
            'Quote bundling everything without separating unit cost from installation',
          ].map((f, i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i < 4 ? '8px' : 0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM WA AIR CON INSTALLERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your air conditioning job on Steadyhand — scope includes unit specification, pipe run details and compliance certificates.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your air con job →</Link>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p>
      </div>
    </div>
  )
}
