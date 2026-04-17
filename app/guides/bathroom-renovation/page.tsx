import Link from 'next/link'
export const metadata = { title:'Bathroom Renovation Cost Guide WA 2025 | Steadyhand', description:'How much does a bathroom renovation cost in Perth? 2025 pricing covering tiling, plumbing, electrical and full renovation costs.' }
export default function BathroomGuide() {
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
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Bathroom renovation</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
            <span style={{ fontSize:'32px' }}>🚿</span>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>BATHROOM RENOVATION COSTS IN WA</h1>
          </div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for full bathroom renovations in Perth — the most multi-trade job in any home, and the one where scope clarity matters most.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#6B4FA8', letterSpacing:'0.5px', margin:'0 0 10px' }}>WHY BATHROOM RENOVATIONS ARE COMPLEX</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>A bathroom renovation requires a tiler, plumber, electrician and often a carpenter — all coordinating in sequence. The most common cause of budget blowouts is poor coordination and undiscovered problems revealed during demolition. A detailed scope agreement before work starts is your only protection against mid-job price increases.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(107,79,168,0.08)', borderBottom:'1px solid rgba(107,79,168,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#6B4FA8', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p>
          </div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Budget renovation', range:'$12,000–$18,000', note:'Basic fixtures, keep layout' },
              { item:'Mid-range renovation', range:'$18,000–$28,000', note:'Quality fixtures, minor layout changes' },
              { item:'Premium renovation', range:'$28,000–$50,000+', note:'Designer fixtures, full layout change' },
              { item:'Ensuite (small)', range:'$10,000–$20,000', note:'Keep layout, quality finishes' },
              { item:'Demolition (labour)', range:'$800–$2,500', note:'Strip to frame' },
              { item:'Waterproofing', range:'$600–$1,200', note:'Wet area membrane' },
              { item:'Tiling labour', range:'$2,500–$6,000', note:'Floor and walls' },
              { item:'Plumbing labour', range:'$2,500–$5,500', note:'Fixtures and connections' },
              { item:'Electrical labour', range:'$800–$2,000', note:'Lighting, exhaust, heated towel rail' },
              { item:'Vanity installation', range:'$400–$1,200', note:'Supply extra' },
            ].map(r => (
              <div key={r.item} style={{ background:'rgba(28,43,50,0.03)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{r.item}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#6B4FA8', margin:'0 0 2px' }}>{r.range}</p>
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
              { factor:'What you find behind the walls', detail:'The most common bathroom renovation problem in Perth is discovering the original waterproofing — or lack of it — once demolition begins. Homes built between 1960 and 1995 in suburbs like Noranda, Balga, Girrawheen and Gosnells often have no waterproofing membrane at all. When found, the scope expands — substrate repair, membrane application and re-tiling. Include a provisional sum for substrate repair in the scope agreement before work starts.' },
              { factor:'Layout changes multiply cost', detail:'Moving the toilet, shower or bath requires relocating plumbing waste lines — in a slab home this means cutting and re-routing concrete. This alone adds $2,000–$5,000. Budget carefully for any layout changes and always get a plumber to assess feasibility before committing to a design that moves fixtures.' },
              { factor:'Trade sequencing in Perth heat', detail:"Perth's summer heat affects waterproofing membranes and adhesives — both have temperature application ranges. Tiling too soon after waterproofing in 38°C heat leads to adhesion failures. Professional Perth tilers schedule bathroom work for early morning and avoid tiling in direct afternoon sun in summer." },
              { factor:'Fixture and tile quality variance', detail:'The same bathroom renovation can vary by $8,000–$15,000 based purely on fixture and tile selection. A Reece or Tradelink mid-range package costs $3,000–$5,000 in fixtures. Imported European brands run $8,000–$20,000. The labour to install them is identical. Be clear on your product budget before the consult.' },
            ].map(f => (
              <div key={f.factor} style={{ borderLeft:'3px solid #6B4FA8', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.factor}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>WA LICENSING AND COMPLIANCE</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 8px' }}>The plumber must hold a WA Plumbing Contractor Licence and issue a Form 5 Certificate of Compliance. The electrician must hold a WA Electrical Contractor Licence and issue a Certificate of Compliance. Waterproofing must comply with AS 3740. A Building Permit may be required for larger renovation projects.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p>
          </div>
          <div style={{ padding:'16px 20px' }}>
            {[
              'What provisional sum is included for substrate repair on demolition?',
              'Does the quote include waterproofing — which product and to which standard?',
              'Who manages trade sequencing and what is the schedule?',
              'Will the plumber provide a Form 5 and the electrician a Certificate of Compliance?',
              'What happens to the price if we find degraded substrate or missing waterproofing?',
              'Can I see examples of previous bathroom work in Perth homes of similar age?',
              'What is the payment schedule — are milestones tied to defined completion stages?',
              'Is the layout change feasible without cutting the slab?',
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
            'No provisional sum for unexpected substrate damage',
            'Waterproofing not explicitly included or described',
            'No mention of compliance certificates from plumber and electrician',
            'Payment structure front-loaded — large payments before milestones complete',
            'Scope does not specify fixture brands or allowances',
          ].map((f, i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i < 4 ? '8px' : 0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>PLAN YOUR BATHROOM RENOVATION ON STEADYHAND</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'480px', marginLeft:'auto', marginRight:'auto' }}>Bathroom renovations are where scope disputes happen most. Steadyhand locks in the scope, provisional sums, payment milestones and compliance requirements before the first tile is broken.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your bathroom renovation →</Link>
        </div>
        <div style={{ marginTop:'24px' }}>
          <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'10px' }}>Related guides</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
            {[{href:'/guides/tiling',label:'Tiling'},{href:'/guides/plumbing',label:'Plumbing'},{href:'/guides/electrical',label:'Electrical'}].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize:'13px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'6px 14px', textDecoration:'none' }}>{l.label} →</Link>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · WA Trade Cost Guides · Prices are indicative 2025 ranges. Always obtain multiple quotes.</p>
      </div>
    </div>
  )
}
