import Link from 'next/link'
export const metadata = { title:'Plumber Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does a plumber cost in Perth and WA? 2025 pricing for hot water, pipe repairs, bathroom fit-outs and gas fitting with WA-specific factors.' }
export default function PlumbingGuide() {
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
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Plumbing and Gas</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
            <span style={{ fontSize:'32px' }}>🔧</span>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px, 5vw, 32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>PLUMBER COSTS IN WA</h1>
          </div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for plumbing and gas fitting across Perth and regional WA — including the hidden factors that catch homeowners off guard.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,106,143,0.08)', borderBottom:'1px solid rgba(46,106,143,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E6A8F', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p>
          </div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Call-out / first hour', range:'$150–$250', note:'Emergency call-outs higher' },
              { item:'Hourly rate', range:'$90–$180/hr', note:'Licensed plumber' },
              { item:'Tap replacement', range:'$120–$280', note:'Supply and install' },
              { item:'Toilet replacement', range:'$300–$700', note:'Supply and install' },
              { item:'Hot water system (electric)', range:'$900–$1,800', note:'Supply and install' },
              { item:'Hot water system (gas)', range:'$1,200–$2,500', note:'Continuous flow, supply and install' },
              { item:'Hot water system (heat pump)', range:'$2,500–$4,500', note:'Including rebates applied' },
              { item:'Bathroom fit-out (labour)', range:'$2,500–$6,000', note:'Plumbing labour only' },
              { item:'Gas line extension', range:'$400–$1,200', note:'Per connection point' },
              { item:'Drain unblocking', range:'$200–$600', note:'Jet blasting extra' },
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
              { factor:"Perth's hard water", detail:"Perth has some of the hardest water in Australia, particularly in southern suburbs and the Hills. Hard water accelerates the degradation of hot water systems, tap washers and shower heads. If your hot water system is over 8 years old in a hard water area, a plumber will almost always recommend replacement rather than repair. In regional WA, water quality varies significantly — Geraldton and Kalgoorlie have particularly hard water." },
              { factor:'Slab vs suspended floor', detail:"Most post-1970 Perth homes are built on concrete slabs. Running new pipes in a slab home means either trenching through concrete or running pipes through roof space. Suspended timber floor homes — common in Fremantle, Cottesloe and older Subiaco — are much easier and cheaper to replumb. Margaret River and the South West have a higher proportion of suspended floor homes than Perth metro." },
              { factor:'Gas availability across WA', detail:'Natural gas is available throughout Perth metro but not all regional areas. Bunbury and Busselton have reticulated gas. Margaret River, Esperance, Kalgoorlie and most of the Kimberley do not — LPG bottles or heat pumps are the alternative. In Broome, Karratha and Port Hedland, plumber availability is significantly constrained and rates are 30-60% higher than Perth with extended wait times.' },
              { factor:'Water Corporation requirements', detail:'Any work on the water service connection must be notified to the Water Corporation of WA. Your plumber should handle this. A Notice of Work must be lodged before most plumbing work begins, and a Certificate of Compliance (Form 5) must be issued on completion — always request the Form 5.' },
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
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>All plumbing work must be performed by a licensed plumber holding a current Plumbing Contractor Licence from Building and Energy (DMIRS). Gas fitting requires a separate Gas Fitting Licence endorsement. A Form 5 Certificate of Compliance must be issued on completion — required when you sell your home.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>Verify licences at buildingandenergywa.com.au.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p>
          </div>
          <div style={{ padding:'16px 20px' }}>
            {['What is your Plumbing Contractor Licence number?','Do you have a Gas Fitting Licence endorsement for gas work?','Will you provide a Certificate of Compliance (Form 5) on completion?','Is my water pressure adequate or does it need a pressure limiting valve?','What is the condition of my existing pipes?','Does my hot water system need replacing or can it be repaired?','Are there any access issues that will affect the price?','Will a Notice of Work be lodged before work starts?'].map((q, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i < 7 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['No Plumbing Contractor Licence number provided','Unwilling to provide a Form 5 Certificate of Compliance','Does not mention lodging a Notice of Work','Gas work quoted by someone without a Gas Fitting Licence endorsement','Unusually low quote with no explanation of scope differences'].map((f, i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i < 4 ? '8px' : 0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM VERIFIED WA PLUMBERS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your plumbing job on Steadyhand and receive quotes from licensed WA plumbers — with a signed scope agreement and Form 5 compliance tracking built in.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your plumbing job →</Link>
        </div>
        <div style={{ marginTop:'24px' }}>
          <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'10px' }}>Related guides</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
            {[{href:'/guides/bathroom-renovation',label:'Bathroom renovation'},{href:'/guides/electrical',label:'Electrical'},{href:'/guides/tiling',label:'Tiling'}].map(l => (
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
