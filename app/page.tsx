import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <style>{`
        .nav-buttons a button { padding: 7px 12px; font-size: 12px; }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; }
        .nav-links { display: flex; align-items: center; gap: 24px; }
        .hero-inner { padding: 100px 48px; }
        .stats-bar { display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; }
        .stats-inner { padding: 24px 48px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .values-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .section-inner { max-width: 900px; margin: 0 auto; padding: 80px 48px; }
        .testimonial-inner { max-width: 700px; margin: 0 auto; padding: 72px 48px; text-align: center; }
        .cta-inner { padding: 80px 48px; text-align: center; }
        .cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
        .footer-pad { padding: 32px 48px; }
        .mobile-nav { display: none; }
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-inner { padding: 0 16px !important; height: 52px !important; }
          .nav-buttons { display: flex !important; gap: 8px !important; align-items: center !important; }
          .nav-buttons a button { padding: 6px 12px !important; font-size: 12px !important; }
          .hero-inner { padding: 48px 20px !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; max-width: 320px !important; margin: 0 auto !important; }
          .hero-buttons a { width: 100% !important; }
          .hero-buttons button { width: 100% !important; text-align: center !important; }
          .stats-bar { gap: 20px !important; }
          .stats-inner { padding: 20px !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .values-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .section-inner { padding: 48px 24px !important; }
          .testimonial-inner { padding: 48px 24px !important; }
          .cta-inner { padding: 48px 24px !important; }
          .footer-pad { padding: 24px 20px !important; }
          .footer-links { gap: 12px !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>

      <nav style={{ background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div className="nav-inner">
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
          <div className="nav-links">
            <a href="#how-it-works" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For homeowners</a>
            <a href="#for-trade-businesses" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For trade businesses</a>
            <a href="#for-organisations" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For organisations</a>
            <a href="https://www.steadyhanddigital.com" target="_blank" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>About</a>
          </div>
          <div className="nav-buttons" style={{ display:'flex', gap:'10px' }}>
            <Link href="/login">
              <button style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.25)', color:'#1C2B32', padding:'8px 18px', borderRadius:'6px', fontSize:'13px', cursor:'pointer' }}>Log in</button>
            </Link>
            <Link href="/signup">
              <button style={{ background:'#1C2B32', color:'white', padding:'8px 18px', borderRadius:'6px', fontSize:'13px', cursor:'pointer', border:'none' }}>Get started</button>
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ background:'#1C2B32', position:'relative', overflow:'hidden', textAlign:'center' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(212,82,42,0.15), transparent 60%)' }} />
        <div className="hero-inner" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(216,228,225,0.08)', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'100px', padding:'6px 16px', marginBottom:'28px' }}>
            <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%', flexShrink:0 }} />
            <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', letterSpacing:'0.5px' }}>Built exclusively for Western Australia</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(28px, 5vw, 64px)', color:'rgba(216,228,225,0.92)', letterSpacing:'3px', lineHeight:'1.1', marginBottom:'24px', maxWidth:'780px', margin:'0 auto 24px' }}>
            THE TRADES PLATFORM THAT STAYS WITH YOU
          </h1>
          <p style={{ fontSize:'18px', fontWeight:'300', color:'rgba(216,228,225,0.55)', lineHeight:'1.7', maxWidth:'520px', margin:'0 auto 40px' }}>
            Most platforms find you a tradie and leave you to manage the rest alone. Steadyhand stays with you through every stage — so you always know what to do next.
          </p>
          <div className="hero-buttons" style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup">
              <button style={{ background:'#D4522A', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer' }}>
                I&apos;m a homeowner &rarr;
              </button>
            </Link>
            <Link href="/signup">
              <button style={{ background:'transparent', color:'rgba(216,228,225,0.8)', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(216,228,225,0.2)', cursor:'pointer' }}>
                I&apos;m a trade business &rarr;
              </button>
            </Link>
            <Link href="/org/setup">
              <button style={{ background:'rgba(107,79,168,0.3)', color:'rgba(216,228,225,0.9)', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(107,79,168,0.4)', cursor:'pointer' }}>
                I manage properties &rarr;
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* REASSURANCE BAR */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div className="stats-bar stats-inner">
          {[
            { icon:'🧭', title:'Guided', label:'We stay with you through every stage' },
            { icon:'✅', title:'Verified', label:"Every tradie's licence and insurance checked" },
            { icon:'✍️', title:'Protected', label:'Nothing starts until you sign the scope' },
            { icon:'💳', title:'No upfront cost', label:'You pay only when work is approved' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' as const }}>
              <div style={{ fontSize:'24px', marginBottom:'6px' }}>{s.icon}</div>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'3px' }}>{s.title}</div>
              <div style={{ fontSize:'12px', color:'#4A5E64', maxWidth:'160px', margin:'0 auto', lineHeight:'1.4' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-inner" id="how-it-works">
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#2E7D60', fontWeight:'500', marginBottom:'10px' }}>How it works</p>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>REQUEST TO WARRANTY</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', lineHeight:'1.7', maxWidth:'520px', marginBottom:'40px' }}>
          Most platforms find you a tradie and disappear. Steadyhand stays present through every stage — guiding you, protecting you, and making sure you always know what happens next.
        </p>
        <div className="steps-grid">
          {[
            { num:'01', title:'Request', body:'Describe the job, set your budget range and expectations. Steadyhand uses this to match you with the right verified trade businesses in your area.' },
            { num:'02', title:'Match', body:'Review AI-matched tradies based on category, location, experience and trust score. Request quotes from 2–4 for best results, or invite your own.' },
            { num:'03', title:'Consult', body:'Meet your tradies on site before quoting begins. Both parties document their observations — creating a shared record that protects everyone.' },
            { num:'04', title:'Compare', body:'Tradies submit detailed quotes. Review them side by side — line items, conditions and assumptions — and choose with confidence.' },
            { num:'05', title:'Contract', body:'Both parties agree on inclusions, exclusions and milestones before work begins. Nothing starts until the scope is signed by both sides.' },
            { num:'06', title:'Build', body:'Work is approved and paid in stages. You only release payment when you are satisfied each milestone is complete. The tradie is paid promptly — no chasing invoices.' },
            { num:'07', title:'Complete', body:'A structured final walkthrough confirms the job is done. Your 90-day warranty clock starts from sign-off, not invoice.' },
            { num:'08', title:'Protect', body:'Issues logged within the warranty period are tracked against a response SLA. Both parties have a complete documented record from request to warranty.' },
          ].map(s => (
            <div key={s.num} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#D4522A', letterSpacing:'1px', marginBottom:'14px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.15)', display:'inline-block', padding:'4px 10px', borderRadius:'6px' }}>{s.num}</div>
              <h3 style={{ fontSize:'17px', fontWeight:'600', color:'#1C2B32', marginBottom:'8px' }}>{s.title}</h3>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#1C2B32' }}>
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'10px' }}>Why Steadyhand is different</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>A DIFFERENT KIND OF PLATFORM</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.5)', fontWeight:'300', lineHeight:'1.7', maxWidth:'580px', marginBottom:'48px' }}>
            Every other trades platform was built around the tradie — to help them find leads. Steadyhand was built around the client. The one who needs to understand what they&apos;re agreeing to, and feel confident doing it.
          </p>
          <div className="values-grid" style={{ alignItems:'stretch' }}>
            {[
              { icon:'🤝', title:'Trust over transactions', body:'Steadyhand earns only when work is completed and approved. We have no incentive to fill your shortlist with the highest bidder or rush you through a quote.' },
              { icon:'📋', title:'Dialogue Trust Score', body:'Every job includes a pre-signing dialogue scored across six dimensions — pricing transparency, compliance, risk, timeline and more. Good conversations lead to good outcomes.' },
              { icon:'🔒', title:'Your workflow, your tools', body:'Steadyhand respects how trade businesses already operate. Use Xero for invoicing or your own CRM for quoting — bring the signed document back to Steadyhand for warranty tracking.' },
              { icon:'✅', title:'Verified, not just listed', body:'Every trade business on Steadyhand has their licence and insurance verified before they appear in any shortlist. Verification is not a badge — it is a requirement.' },
            ].map(v => (
              <div key={v.title} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'28px' }}>
                <div style={{ fontSize:'28px', marginBottom:'14px' }}>{v.icon}</div>
                <h3 style={{ fontSize:'16px', fontWeight:'600', color:'rgba(216,228,225,0.85)', marginBottom:'8px' }}>{v.title}</h3>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.65' }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background:'#E8F0EE' }} id="for-trade-businesses">
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#2E6A8F', fontWeight:'500', marginBottom:'10px' }}>For trade businesses</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT TO SUPPORT YOUR PRACTICE</h2>
          <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', lineHeight:'1.7', maxWidth:'560px', marginBottom:'40px' }}>
            Steadyhand helps trade businesses become more professional, more compliant and more digitally capable — without disrupting the way you already work.
          </p>
          <div className="steps-grid">
            {[
              { title:'Dialogue Trust Score', body:'Every job you complete builds your Dialogue Trust Score average. A high score signals to future clients that you engage transparently on pricing, compliance and risk — before work begins.' },
              { title:'Digital scope agreements', body:'Your scope agreement is stored permanently against every job. No more disputes over what was agreed. No more chasing signed documents.' },
              { title:'Milestone payments', body:'Payments are released by the client at each milestone through Stripe. Funds go directly to your bank account. Steadyhand takes 3.5% — only when you get paid.' },
            ].map(s => (
              <div key={s.title} style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'28px', boxShadow:'0 2px 12px rgba(28,43,50,0.06)' }}>
                <h3 style={{ fontSize:'17px', fontWeight:'600', color:'#1C2B32', marginBottom:'10px' }}>{s.title}</h3>
                <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background:'#E8F0EE' }}>
        <div className="section-inner" style={{ maxWidth:'900px', margin:'0 auto', padding:'64px 48px' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#7A9098', fontWeight:500, marginBottom:'32px', textAlign:'center' as const }}>From the field</p>
          <div className="values-grid" style={{ alignItems:'stretch' }}>
            <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'28px', boxShadow:'0 2px 12px rgba(28,43,50,0.06)', display:'flex', flexDirection:'column' as const }}>
              <div style={{ fontSize:'18px', marginBottom:'12px', opacity:0.3, fontFamily:'Georgia, serif', lineHeight:1 }}>&ldquo;</div>
              <blockquote style={{ fontSize:'16px', fontStyle:'italic', fontWeight:'300', color:'#1C2B32', lineHeight:'1.7', marginBottom:'20px', flex:1 }}>
                The scope agreement meant there were no surprises. I knew exactly what was included and what would happen at each milestone. I felt in control for the first time hiring a tradie.
              </blockquote>
              <div style={{ width:'32px', height:'1px', background:'rgba(212,82,42,0.4)', marginBottom:'14px' }} />
              <cite style={{ fontSize:'13px', color:'#7A9098', fontStyle:'normal', lineHeight:'1.8', display:'block' }}>
                Emma T.<br />Homeowner, Subiaco WA
              </cite>
            </div>
            <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'28px', boxShadow:'0 2px 12px rgba(28,43,50,0.06)', display:'flex', flexDirection:'column' as const }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'6px', padding:'3px 10px', marginBottom:'16px' }}>
                <span style={{ fontSize:'10px', color:'#D4522A', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Case study — Trade business</span>
              </div>
              <div style={{ fontSize:'18px', marginBottom:'12px', opacity:0.3, fontFamily:'Georgia, serif', lineHeight:1 }}>&ldquo;</div>
              <blockquote style={{ fontSize:'15px', fontStyle:'italic', fontWeight:'300', color:'#1C2B32', lineHeight:'1.7', marginBottom:'20px', flex:1 }}>
                Steadyhand oversaw a structural transformation in operations for my business over six months. That transformation took Margaret River Re-Gutters from a solid owner-operator-run business with two-to-three sub-contractors toward a small business with two teams of three workers. The roadmap Steadyhand designed for us meant the ride was controlled, data-driven and milestoned along the way. Not only did we achieve our ROI expectations, but I was able to come at my business from a new perspective &mdash; less on the tools and more in a position of strategic leadership.
              </blockquote>
              <div style={{ width:'32px', height:'1px', background:'rgba(212,82,42,0.4)', marginBottom:'14px' }} />
              <cite style={{ fontSize:'13px', color:'#7A9098', fontStyle:'normal', lineHeight:'1.8', display:'block' }}>
                Cullum Creevey<br />Small Business Owner &amp; Roofing Specialist<br />Margaret River Regutters / Busselton Regutters
              </cite>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background:'#1C2B32' }}>
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', fontWeight:500, marginBottom:'10px' }}>Common questions</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'40px' }}>GOOD QUESTIONS.</h2>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {[
              { q:'How is Steadyhand different from other platforms?', a:'Most platforms connect you with a tradie and step back. Steadyhand stays present through every stage — the scope agreement, the milestone approvals, the warranty period. We earn only when work is completed and approved, which means our interests are aligned with yours, not with the volume of leads we can sell.' },
              { q:'What does the 3.5% completion fee mean?', a:'When a milestone payment is released through Steadyhand, we take 3.5% of that payment. No subscription fees, no lead fees, no upfront costs for clients. Founding member tradies pay 3% — that rate is guaranteed permanently and never increases.' },
              { q:'Do I have to use Steadyhand for payments?', a:'Milestone payments are processed through Steadyhand via Stripe. This is what makes warranty and milestone tracking work — each payment is tied to an approved stage of work. You cannot release payment for work you have not seen.' },
              { q:'What if my tradie is not on Steadyhand?', a:'You can invite any tradie by email. They create a free account and join your job. They do not need an existing profile to be invited.' },
              { q:'Is Steadyhand available outside Western Australia?', a:'Not yet. We are building specifically for WA — metro Perth, the South West, and regional areas. Geographic focus means better tradie verification, better local matching, and a platform that understands WA compliance.' },
              { q:'What happens if something goes wrong after sign-off?', a:'Any issue logged within the warranty period is tracked against a response SLA. You have a complete documented record — signed scope, milestone photos, variation approvals — to stand on.' },
            ].map((item, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'20px 24px' }}>
                <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.85)', marginBottom:'8px' }}>{item.q}</p>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', lineHeight:'1.7', margin:0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cta-inner">
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT FOR WA. BUILT FOR TRUST.</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', marginBottom:'32px', maxWidth:'480px', margin:'0 auto 32px', lineHeight:'1.7' }}>
          Steadyhand is for Western Australian homeowners and trade businesses who believe that good work deserves a proper process.
        </p>
        <div className="cta-buttons">
          <Link href="/signup">
            <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>Start a job request</button>
          </Link>
          <Link href="/signup">
            <button style={{ background:'#1C2B32', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'none', cursor:'pointer' }}>Get started as a tradie</button>
          </Link>
        </div>
      </div>

      <div style={{ background:'#1C2B32' }}>
        <div className="footer-inner footer-pad">
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.7)', letterSpacing:'2px' }}>STEADYHAND</div>
          <div className="footer-links">
            {['About', 'For homeowners', 'For trade businesses', 'For organisations', 'Privacy'].map(l => (
              <span key={l} style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', cursor:'pointer' }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)' }}>2026 Steadyhand Digital. Western Australia.</div>
        </div>
      </div>

    </div>
  )
}
