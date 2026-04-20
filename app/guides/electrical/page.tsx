import Link from 'next/link'
export const metadata = { title:'Electrician Cost Guide WA 2025 — Perth & Regional Pricing | Steadyhand', description:'How much does an electrician cost in Perth and WA? Honest 2025 pricing for switchboards, power points, lighting, solar and safety inspections with WA-specific factors.' }
export default function ElectricalGuide() {
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
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'12px' }}>Cost guides / Electrical</Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
            <span style={{ fontSize:'32px' }}>⚡</span>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px, 5vw, 32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:0 }}>ELECTRICIAN COSTS IN WA</h1>
          </div>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.75', maxWidth:'580px', margin:0 }}>2025 pricing for electrical work across Perth and regional Western Australia — with the factors that determine whether your job is at the low or high end of the range.</p>
        </div>
      </div>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(192,120,48,0.08)', borderBottom:'1px solid rgba(192,120,48,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#C07830', letterSpacing:'0.5px', margin:0 }}>TYPICAL PRICE RANGES — PERTH METRO 2025</p>
          </div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { item:'Call-out / first hour', range:'$120–$200', note:'Plus travel in outer suburbs' },
              { item:'Hourly rate (after first hour)', range:'$80–$140/hr', note:'Licensed electrician' },
              { item:'Power point installation', range:'$80–$180', note:'Per point, depending on access' },
              { item:'Downlight installation', range:'$40–$90', note:'Per light, existing wiring' },
              { item:'Switchboard upgrade', range:'$1,200–$3,500', note:'Safety switch and circuit breakers' },
              { item:'Split system connection', range:'$250–$450', note:'Electrical connection only' },
              { item:'EV charger installation', range:'$800–$2,000', note:'Including switchboard upgrade if needed' },
              { item:'Solar system connection', range:'$400–$900', note:'Grid connection and metering' },
              { item:'Safety inspection / RCD test', range:'$150–$350', note:'Full property' },
              { item:'After-hours call-out', range:'+50–100%', note:'On top of standard rates' },
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
          <div style={{ background:'#0A0A0A', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT DRIVES THE PRICE IN WA</p>
          </div>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              { factor:'Access and roof space', detail:'Older Perth homes — particularly fibro and brick homes built pre-1980 in suburbs like Fremantle, East Perth and Vic Park — often have limited roof cavity access. Running new circuits in these homes takes significantly longer and costs more than in a new build. Regional homes in Bunbury, Geraldton and the Kimberley face similar constraints plus additional travel costs.' },
              { factor:'Distance from the CBD and regional premiums', detail:'Electricians travelling to outer suburbs like Ellenbrook, Baldivis and Byford factor in 45-60 minutes of travel at $100-$140/hr. Regional WA carries a further premium of 20-40%. In resource towns like Karratha, Port Hedland and Broome, electricians are in high demand and rates can be 50-80% above Perth metro.' },
              { factor:'Age of your switchboard', detail:"Homes built before the early 1990s often have ceramic fuse boards rather than safety switches. Almost any significant electrical work will prompt the electrician to recommend a switchboard upgrade. Budget $1,200-$2,500 if your home still has ceramic fuses. This is particularly common in Perth's older inner suburbs and in regional towns with older housing stock." },
              { factor:"Perth's solar boom", detail:'Perth has among the highest rooftop solar penetration in the world. During peak periods, electricians are extremely busy and wait times extend. Book early — particularly before summer when demand spikes across Perth metro and coastal regional towns like Busselton and Mandurah.' },
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
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 10px' }}>All electrical work in Western Australia must be performed by a licensed electrical contractor holding a current Electrical Contractor Licence issued by EnergySafety WA. After completing work, the electrician must issue a Certificate of Compliance — never accept completed electrical work without one.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>Verify a licence at energysafety.wa.gov.au. Cash-only electrical work with no paperwork is illegal in WA and voids your home insurance.</p>
        </div>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ background:'rgba(46,125,96,0.08)', borderBottom:'1px solid rgba(46,125,96,0.2)', padding:'14px 20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#2E7D60', letterSpacing:'0.5px', margin:0 }}>WHAT TO ASK AT THE CONSULT</p>
          </div>
          <div style={{ padding:'16px 20px' }}>
            {['Is your Electrical Contractor Licence current? Can I see the number?','Will you issue a Certificate of Compliance on completion?','Does my switchboard need upgrading to do this work safely?','Are there any access issues that will affect the price?','What assumptions is your quote based on?','What is included in the call-out fee and when does hourly billing start?','How do you handle variations if something unexpected is found?','Are you familiar with the specific requirements for solar and EV charger work in WA?'].map((q, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderBottom: i < 7 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#2E7D60', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{q}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>RED FLAGS</p>
          {['No Electrical Contractor Licence number provided','Quote with no mention of a Certificate of Compliance','Significantly lower price than other quotes with no explanation','Reluctance to put the scope in writing before starting work','No ABN or cash-only payment requested'].map((f, i) => (
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom: i < 4 ? '8px' : 0 }}>
              <span style={{ color:'#D4522A', flexShrink:0, marginTop:'2px' }}>⚠</span>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'28px', textAlign:'center' as const }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 8px' }}>GET QUOTES FROM VERIFIED WA ELECTRICIANS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', margin:'0 0 18px', maxWidth:'440px', marginLeft:'auto', marginRight:'auto' }}>Post your electrical job on Steadyhand. You get a signed scope agreement, milestone payments and a Certificate of Compliance filed against the job record.</p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Post your electrical job →</Link>
        </div>
        <div style={{ marginTop:'24px' }}>
          <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'10px' }}>Related guides</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
            {[{href:'/guides/air-conditioning',label:'Air conditioning'},{href:'/guides/bathroom-renovation',label:'Bathroom renovation'},{href:'/guides/plumbing',label:'Plumbing and gas'}].map(l => (
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
