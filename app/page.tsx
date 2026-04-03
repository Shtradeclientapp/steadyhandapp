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
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-inner { padding: 0 16px !important; height: 52px !important; }
          .nav-buttons { display: flex !important; gap: 8px !important; align-items: center !important; }
          .nav-buttons a button { padding: 6px 12px !important; font-size: 12px !important; }
          .hero-inner { padding: 60px 24px !important; }
          .stats-bar { gap: 20px !important; }
          .stats-inner { padding: 20px !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .values-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .section-inner { padding: 48px 24px !important; }
          .testimonial-inner { padding: 48px 24px !important; }
          .cta-inner { padding: 48px 24px !important; }
          .footer-pad { padding: 24px 20px !important; }
          .footer-links { gap: 12px !important; }
        }
      `}</style>

      <nav style={{ background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div className="nav-inner">
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
          <div className="nav-links">
            <span style={{ fontSize:'13px', color:'#4A5E64' }}>For homeowners</span>
            <span style={{ fontSize:'13px', color:'#4A5E64' }}>For trade businesses</span>
            <span style={{ fontSize:'13px', color:'#4A5E64' }}>About</span>
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
            <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', letterSpacing:'0.5px' }}>Built for Western Australia</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(32px, 6vw, 68px)', color:'rgba(216,228,225,0.92)', letterSpacing:'3px', lineHeight:'1.1', marginBottom:'24px', maxWidth:'780px', margin:'0 auto 24px' }}>
            CONNECTING WESTERN AUSTRALIA'S DIGITAL AND TRADE CAPABILITIES
          </h1>
          <p style={{ fontSize:'18px', fontWeight:'300', color:'rgba(216,228,225,0.6)', lineHeight:'1.7', maxWidth:'560px', margin:'0 auto 16px' }}>
            Steadyhand structures the relationship between homeowners and trade businesses — from first quote through to signed scope, milestone delivery and warranty.
          </p>
          <p style={{ fontSize:'15px', fontWeight:'300', color:'rgba(216,228,225,0.4)', lineHeight:'1.7', maxWidth:'480px', margin:'0 auto 40px' }}>
            Good work starts with a good conversation. Steadyhand makes that conversation structured, documented and fair for both sides.
          </p>
          <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup">
              <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>Start a job request</button>
            </Link>
            <Link href="/signup">
              <button style={{ background:'transparent', color:'rgba(216,228,225,0.8)', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'1px solid rgba(216,228,225,0.2)', cursor:'pointer' }}>Join as a trade business</button>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div className="stats-bar stats-inner">
          {[
            { num:'6', label:'stages from request to warranty' },
            { num:'100%', label:'verified licence and insurance' },
            { num:'WA only', label:'regional and metro focus' },
            { num:'0', label:'lead fees or subscription traps' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#1C2B32', letterSpacing:'1px' }}>{s.num}</div>
              <div style={{ fontSize:'12px', color:'#4A5E64', marginTop:'3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-inner">
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#2E7D60', fontWeight:'500', marginBottom:'10px' }}>How it works</p>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>REQUEST TO WARRANTY</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', lineHeight:'1.7', maxWidth:'520px', marginBottom:'40px' }}>
          Every Steadyhand job follows a structured six-stage process. Each stage is documented, signed or approved before the next begins.
        </p>
        <div className="steps-grid">
          {[
            { num:'01', title:'Define your request', body:'Describe the job, set your budget range and warranty expectations. Steadyhand uses this to match you with the right trade businesses.' },
            { num:'02', title:'Compare quotes', body:'Request quotes from multiple verified tradies at once. Review them side by side and select the one that best fits your needs and budget.' },
            { num:'03', title:'Negotiate and sign the scope', body:'Both parties agree on inclusions, exclusions and milestones before work begins. The Dialogue Trust Score encourages transparent, thorough pre-work conversation.' },
            { num:'04', title:'Milestone delivery', body:'Work is approved and paid in stages. You only release payment when you are satisfied each milestone is complete.' },
            { num:'05', title:'Sign off', body:'A structured final walkthrough confirms the job is complete. Your warranty clock starts from sign-off, not invoice.' },
            { num:'06', title:'Warranty', body:'Issues logged within the warranty period are tracked against a response SLA. If the tradie does not respond, Steadyhand mediates.' },
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
        <div className="section-inner" style={{ maxWidth:'900px', margin:'0 auto', padding:'80px 48px' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'10px' }}>Why Steadyhand is different</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>A DIFFERENT KIND OF PLATFORM</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.55)', fontWeight:'300', lineHeight:'1.7', maxWidth:'560px', marginBottom:'48px' }}>
            Most trades platforms charge businesses for leads regardless of outcome — creating pressure to underprice, overpromise and move fast. Steadyhand is built on a different principle: that good work starts with a good conversation, and that both parties deserve a process that protects them.
          </p>
          <div className="values-grid">
            {[
              { icon:'🤝', title:'Trust over transactions', body:'Steadyhand earns only when work is completed and approved. Our 5% milestone fee aligns our success with yours — not with the volume of leads we sell.' },
              { icon:'📋', title:'Structured dialogue', body:'The Dialogue Trust Score analyses your pre-work conversation across six dimensions — pricing transparency, compliance, risk, timeline and more. Good conversations lead to good outcomes.' },
              { icon:'🔒', title:'Your workflow, your tools', body:'Steadyhand respects how trade businesses already operate. Use Xero for invoicing, your CRM for quoting — bring the signed document back to Steadyhand for warranty tracking.' },
              { icon:'✅', title:'Verified, not just listed', body:'Every tradie on Steadyhand has their licence and insurance verified by a human before they appear in any shortlist. Verification is not a badge — it is a requirement.' },
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

      <div style={{ background:'#E8F0EE' }}>
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
              { title:'Milestone payments', body:'Payments are released by the client at each milestone through Stripe. Funds go directly to your bank account. Steadyhand takes 5% — only when you get paid.' },
            ].map(s => (
              <div key={s.title} style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'28px', boxShadow:'0 2px 12px rgba(28,43,50,0.06)' }}>
                <h3 style={{ fontSize:'17px', fontWeight:'600', color:'#1C2B32', marginBottom:'10px' }}>{s.title}</h3>
                <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background:'#1C2B32' }}>
        <div className="testimonial-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'24px' }}>From the field</p>
          <blockquote style={{ fontSize:'20px', fontStyle:'italic', fontWeight:'300', color:'rgba(216,228,225,0.85)', lineHeight:'1.7', marginBottom:'24px' }}>
            "Steadyhand gave us a genuine pipeline of local jobs. We&apos;ve stopped chasing leads on three other platforms."
          </blockquote>
          <cite style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', fontStyle:'normal' }}>
            Chris Creevey, Re-Gutters, Margaret River
          </cite>
        </div>
      </div>

      <div className="cta-inner">
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT FOR WA. BUILT FOR TRUST.</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', marginBottom:'32px', maxWidth:'480px', margin:'0 auto 32px', lineHeight:'1.7' }}>
          Steadyhand is focused on Western Australian homeowners and trade businesses who believe that good work deserves a proper process.
        </p>
        <div className="cta-buttons">
          <Link href="/signup">
            <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>Start a job request</button>
          </Link>
          <Link href="/signup">
            <button style={{ background:'#1C2B32', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'none', cursor:'pointer' }}>Join as a trade business</button>
          </Link>
        </div>
      </div>

      <div style={{ background:'#1C2B32' }}>
        <div className="footer-inner footer-pad">
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.7)', letterSpacing:'2px' }}>STEADYHAND</div>
          <div className="footer-links">
            {['About', 'For homeowners', 'For trade businesses', 'Privacy'].map(l => (
              <span key={l} style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', cursor:'pointer' }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)' }}>2026 Steadyhand Digital. Western Australia.</div>
        </div>
      </div>

    </div>
  )
}
