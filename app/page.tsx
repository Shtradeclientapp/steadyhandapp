'use client'
import Link from 'next/link'
import { ObservatoryCarousel } from '@/components/ui/Observatory'

export default function Home() {
  return (
    <div style={{ fontFamily:'sans-serif', color:'#0A0A0A', background:'#C8D5D2' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        .nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
        .nav-links { display: flex; gap: 28px; align-items: center; }
        .nav-buttons { display: flex; gap: 10px; align-items: center; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .mobile-nav { display: none; flex-direction: column; background: rgba(200,213,210,0.98); border-top: 1px solid rgba(28,43,50,0.1); padding: 20px; gap: 12px; }
        .hero-inner { max-width: 900px; margin: 0 auto; padding: 80px 32px 72px; text-align: center; }
        .stats-bar { max-width: 1100px; margin: 0 auto; display: flex; gap: 0; }
        .stat-item { flex: 1; padding: 20px 16px; text-align: center; border-right: 1px solid rgba(28,43,50,0.08); }
        .stat-item:last-child { border-right: none; }
        .section-inner { max-width: 1100px; margin: 0 auto; padding: 72px 32px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .values-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        .guides-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .footer-links { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
        .cta-inner { max-width: 1100px; margin: 0 auto; padding: 72px 32px; text-align: center; }
        .cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .testimonial-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-buttons { display: none !important; }
          .hamburger { display: flex !important; }
          .mobile-nav.open { display: flex !important; }
          .nav-inner { padding: 0 16px; height: 52px; }
          .hero-inner { padding: 48px 20px 56px; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .values-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .guides-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .testimonial-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .section-inner { padding: 48px 20px !important; }
          .cta-inner { padding: 48px 20px !important; }
          .cta-buttons { flex-direction: column; align-items: stretch; max-width: 320px; margin: 0 auto; }
          .cta-buttons a, .cta-buttons button { width: 100% !important; }
          .stats-bar { flex-wrap: wrap; }
          .stat-item { flex: 1 1 50%; border-right: none !important; border-bottom: 1px solid rgba(28,43,50,0.08); }
          .footer-inner { flex-direction: column; align-items: flex-start; gap: 16px; padding: 24px 20px; }
          .footer-links { gap: 12px; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background:'rgba(200,213,210,0.97)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(8px)' }}>
        <div className="nav-inner">
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', flexShrink:0 }}>STEADYHAND</div>
          <div className="nav-links">
            <a href="#how-it-works" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>How it works</a>
            <a href="#for-trade-businesses" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For tradies</a>
            <a href="/org/setup" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For property managers</a>
            <a href="#guides" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Guides</a>
          </div>
          <div className="nav-buttons">
            <Link href="/login"><button style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', color:'#4A5E64', padding:'7px 16px', borderRadius:'7px', fontSize:'13px', cursor:'pointer' }}>Log in</button></Link>
            <Link href="/signup"><button style={{ background:'#D4522A', color:'white', padding:'7px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>Get started</button></Link>
          </div>
          <button className="hamburger" onClick={() => {
            const m = document.getElementById('mobile-nav')
            if (m) m.classList.toggle('open')
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect y="4" width="22" height="2" rx="1" fill="#4A5E64"/><rect y="10" width="22" height="2" rx="1" fill="#4A5E64"/><rect y="16" width="22" height="2" rx="1" fill="#4A5E64"/></svg>
          </button>
        </div>
        <div id="mobile-nav" className="mobile-nav">
          <a href="#how-it-works" style={{ fontSize:'15px', color:'#0A0A0A', textDecoration:'none', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>How it works</a>
          <a href="#for-trade-businesses" style={{ fontSize:'15px', color:'#0A0A0A', textDecoration:'none', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>For tradies</a>
          <a href="/org/setup" style={{ fontSize:'15px', color:'#0A0A0A', textDecoration:'none', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>For property managers</a>
          <a href="#guides" style={{ fontSize:'15px', color:'#0A0A0A', textDecoration:'none', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>Guides</a>
          <div style={{ display:'flex', gap:'10px', paddingTop:'8px' }}>
            <Link href="/login" style={{ flex:1 }}><button style={{ width:'100%', background:'transparent', border:'1px solid rgba(28,43,50,0.2)', color:'#4A5E64', padding:'10px', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>Log in</button></Link>
            <Link href="/signup" style={{ flex:1 }}><button style={{ width:'100%', background:'#D4522A', color:'white', padding:'10px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>Get started</button></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background:'#0A0A0A', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(212,82,42,0.15), transparent 60%)' }} />
        <div className="hero-inner" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(216,228,225,0.08)', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'100px', padding:'6px 16px', marginBottom:'28px' }}>
            <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%', flexShrink:0 }} />
            <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', letterSpacing:'0.5px' }}>Built exclusively for Western Australia</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(26px, 5vw, 60px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', lineHeight:'1.1', margin:'0 auto 20px', maxWidth:'780px' }}>
            THE TRADES PLATFORM THAT STAYS WITH YOU
          </h1>
          <p style={{ fontSize:'clamp(15px, 2vw, 18px)', fontWeight:300, color:'rgba(216,228,225,0.55)', lineHeight:'1.7', maxWidth:'520px', margin:'0 auto 40px' }}>
            Most platforms find you a tradie and leave you to manage the rest alone. Steadyhand stays with you through every stage — so you always know what to do next.
          </p>
          <div className="cta-buttons" style={{ justifyContent:'center' }}>
            <Link href="/signup"><button style={{ background:'#D4522A', color:'white', padding:'14px 28px', borderRadius:'8px', fontSize:'15px', fontWeight:500, border:'none', cursor:'pointer', width:'100%' }}>I&apos;m a homeowner →</button></Link>
            <Link href="/signup?role=tradie"><button style={{ background:'#2E7D60', color:'white', padding:'14px 28px', borderRadius:'8px', fontSize:'15px', border:'none', cursor:'pointer', width:'100%' }}>I&apos;m a trade business →</button></Link>
            <Link href="/signup?role=org"><button style={{ background:'rgba(107,79,168,0.3)', color:'rgba(216,228,225,0.9)', padding:'14px 28px', borderRadius:'8px', fontSize:'15px', border:'1px solid rgba(107,79,168,0.4)', cursor:'pointer', width:'100%' }}>I manage properties →</button></Link>
          </div>
        </div>
      </div>

      {/* REASSURANCE BAR */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div className="stats-bar">
          {[
            { icon:'🧭', title:'Guided', label:'Through every stage' },
            { icon:'✅', title:'Verified', label:'Licence & insurance checked' },
            { icon:'✍️', title:'Protected', label:'Signed scope before work starts' },
            { icon:'💳', title:'No upfront cost', label:'Pay only when work is approved' },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <div style={{ fontSize:'22px', marginBottom:'6px' }}>{s.icon}</div>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', marginBottom:'2px' }}>{s.title}</p>
              <p style={{ fontSize:'12px', color:'#7A9098' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* OBSERVATORY TEASER */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.08)', padding:'14px 20px', display:'flex', justifyContent:'center' }}>
        <a href="/observatory" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#0A0A0A', color:'rgba(216,228,225,0.85)', textDecoration:'none', padding:'10px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, textAlign:'center' as const, lineHeight:1.4 }}>
          <span style={{ fontSize:'15px', flexShrink:0 }}>🔭</span>
          <span>Steadyhand WA Data Observatory <span style={{ color:'#D4522A' }}>→</span></span>
        </a>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background:'#C8D5D2' }} id="how-it-works">
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#2E7D60', fontWeight:500, marginBottom:'10px' }}>How it works</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,3vw,28px)', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'12px' }}>REQUEST TO WARRANTY</h2>
          <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:300, lineHeight:'1.7', maxWidth:'520px', marginBottom:'40px' }}>
            Steadyhand stays present through every stage — guiding you, protecting you, and making sure you always know what happens next.
          </p>
          <div className="steps-grid">
            {[
              { icon:'📋', phase:'Before work starts', stages:'Request · Match · Consult · Compare · Contract', body:'Find the right tradie, understand what you are being quoted, and agree on every detail before work begins. Nothing starts until both parties sign the scope.' },
              { icon:'🔧', phase:'During the job', stages:'Build', body:'Work happens in approved stages. You release payment only when each milestone is complete. Progress photos keep you informed. Scope changes are agreed in writing.' },
              { icon:'🛡', phase:'After it is done', stages:'Sign-off · Warranty', body:'A structured sign-off starts your 90-day warranty from the moment you are satisfied. Issues logged in the warranty period are tracked and responded to within SLA.' },
            ].map(s => (
              <div key={s.phase} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
                <div style={{ fontSize:'32px', marginBottom:'16px' }}>{s.icon}</div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:'8px' }}>{s.phase}</p>
                <h3 style={{ fontSize:'16px', fontWeight:600, color:'#0A0A0A', marginBottom:'8px' }}>{s.stages}</h3>
                <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GUIDES — prominent section */}
      <div style={{ background:'#0A0A0A' }} id="guides">
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', fontWeight:500, marginBottom:'10px' }}>Free resources</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,3vw,28px)', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>KNOW BEFORE YOU BUILD</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.5)', fontWeight:300, lineHeight:'1.7', maxWidth:'560px', marginBottom:'40px' }}>
            Most homeowners go into a renovation without knowing what fair pricing looks like or what WA law actually guarantees them. These guides change that.
          </p>
          <div className="guides-grid">
            {/* Warranty guide */}
            <a href="/guides/warranty-wa" style={{ textDecoration:'none', display:'block' }}>
              <div style={{ background:'rgba(46,125,96,0.12)', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'16px', padding:'32px', height:'100%', transition:'border-color 0.2s', cursor:'pointer' }}>
                <div style={{ fontSize:'36px', marginBottom:'16px' }}>🛡️</div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#2E7D60', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:'8px' }}>WA Warranty Guide</p>
                <h3 style={{ fontSize:'20px', fontWeight:600, color:'rgba(216,228,225,0.9)', marginBottom:'12px', lineHeight:'1.3' }}>What does your tradie actually owe you?</h3>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', lineHeight:'1.7', marginBottom:'20px' }}>
                  Western Australia has specific statutory warranty obligations that apply to all home building work. Most homeowners don&apos;t know what they are — or how to enforce them. This guide covers defects liability, the Home Building Contracts Act, and what to do when something goes wrong.
                </p>
                <span style={{ fontSize:'13px', color:'#2E7D60', fontWeight:600 }}>Read the WA warranty guide →</span>
              </div>
            </a>
            {/* Cost guides */}
            <a href="/guides" style={{ textDecoration:'none', display:'block' }}>
              <div style={{ background:'rgba(192,120,48,0.1)', border:'1px solid rgba(192,120,48,0.3)', borderRadius:'16px', padding:'32px', height:'100%', cursor:'pointer' }}>
                <div style={{ fontSize:'36px', marginBottom:'16px' }}>💰</div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#C07830', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:'8px' }}>WA Cost Guides</p>
                <h3 style={{ fontSize:'20px', fontWeight:600, color:'rgba(216,228,225,0.9)', marginBottom:'12px', lineHeight:'1.3' }}>What should you actually be paying?</h3>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', lineHeight:'1.7', marginBottom:'20px' }}>
                  Trade pricing in WA varies enormously — and without a benchmark, you can&apos;t tell if a quote is fair. Our cost guides cover electrical, plumbing, painting, tiling, roofing, landscaping and more, with realistic Perth metro price ranges based on actual job data.
                </p>
                <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px', marginBottom:'20px' }}>
                  {['Electrical','Plumbing','Painting','Tiling','Roofing','Landscaping'].map(t => (
                    <span key={t} style={{ fontSize:'11px', color:'rgba(216,228,225,0.6)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'100px', padding:'3px 10px' }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontSize:'13px', color:'#C07830', fontWeight:600 }}>Browse cost guides →</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* OBSERVATORY CAROUSEL */}
      <ObservatoryCarousel />

      {/* WHY DIFFERENT */}
      <div style={{ background:'#E8F0EE' }}>
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#2E6A8F', fontWeight:500, marginBottom:'10px' }}>Why Steadyhand is different</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,3vw,28px)', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT AROUND THE CLIENT</h2>
          <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:300, lineHeight:'1.7', maxWidth:'580px', marginBottom:'48px' }}>
            Every other trades platform was built around the tradie — to help them find leads. Steadyhand was built around the client.
          </p>
          <div className="values-grid">
            {[
              { icon:'🤝', title:'Trust over transactions', body:'Steadyhand earns only when work is completed and approved. We have no incentive to fill your shortlist with the highest bidder.' },
              { icon:'📋', title:'Dialogue Rating', body:'Every job includes a pre-signing Dialogue Rating across six dimensions — pricing transparency, compliance, risk, timeline and more.' },
              { icon:'🔒', title:'Your workflow respected', body:'Use Xero for invoicing or your own CRM for quoting — bring the signed document back to Steadyhand for warranty tracking.' },
              { icon:'✅', title:'Verified, not just listed', body:'Every trade business has their licence and insurance verified before they appear in any shortlist. Verification is a requirement.' },
            ].map(v => (
              <div key={v.title} style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'28px', boxShadow:'0 2px 12px rgba(28,43,50,0.04)' }}>
                <div style={{ fontSize:'28px', marginBottom:'14px' }}>{v.icon}</div>
                <h3 style={{ fontSize:'16px', fontWeight:600, color:'#0A0A0A', marginBottom:'8px' }}>{v.title}</h3>
                <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65' }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOR TRADE BUSINESSES */}
      <div style={{ background:'#0A0A0A' }} id="for-trade-businesses">
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', fontWeight:500, marginBottom:'10px' }}>For trade businesses</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,3vw,28px)', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT TO SUPPORT YOUR PRACTICE</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.5)', fontWeight:300, lineHeight:'1.7', maxWidth:'560px', marginBottom:'40px' }}>
            Steadyhand helps trade businesses become more professional, more compliant and more digitally capable — without disrupting how you already work.
          </p>
          <div className="steps-grid">
            {[
              { title:'Dialogue Rating', body:'Every job you complete builds your Dialogue Rating average. A high score signals to future clients that you engage transparently on pricing, compliance and risk — before work begins.' },
              { title:'Digital scope agreements', body:'Your scope agreement is stored permanently against every job. No more disputes over what was agreed. No more chasing signed documents.' },
              { title:'Milestone payments', body:'Payments are released by the client at each milestone through Stripe. Funds go directly to your bank account. Steadyhand takes 3.5% — only when you get paid.' },
            ].map(s => (
              <div key={s.title} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'28px' }}>
                <h3 style={{ fontSize:'17px', fontWeight:600, color:'rgba(216,228,225,0.85)', marginBottom:'10px' }}>{s.title}</h3>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.65' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ background:'#C8D5D2' }}>
        <div className="section-inner">
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(18px,2vw,22px)', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'8px', textAlign:'center' as const }}>WHAT PEOPLE SAY</h2>
          <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'32px', textAlign:'center' as const }}>From homeowners and trade businesses who have used Steadyhand</p>
          <div className="testimonial-grid">
            <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'32px', boxShadow:'0 2px 12px rgba(28,43,50,0.06)', display:'flex', flexDirection:'column' as const }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.15)', borderRadius:'6px', padding:'3px 10px', marginBottom:'20px', alignSelf:'flex-start' as const }}>
                <span style={{ fontSize:'10px', color:'#2E6A8F', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Homeowner</span>
              </div>
              <blockquote style={{ fontSize:'16px', fontStyle:'italic', fontWeight:300, color:'#0A0A0A', lineHeight:'1.75', marginBottom:'24px', flex:1 }}>
                &ldquo;The scope agreement meant there were no surprises. I knew exactly what was included and what would happen at each milestone. I felt in control for the first time hiring a tradie.&rdquo;
              </blockquote>
              <cite style={{ fontSize:'13px', color:'#7A9098', fontStyle:'normal' }}>Emma T. · Homeowner, Subiaco WA</cite>
            </div>
            <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'32px', boxShadow:'0 2px 12px rgba(28,43,50,0.06)', display:'flex', flexDirection:'column' as const }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'6px', padding:'3px 10px', marginBottom:'20px', alignSelf:'flex-start' as const }}>
                <span style={{ fontSize:'10px', color:'#D4522A', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Trade business</span>
              </div>
              <blockquote style={{ fontSize:'15px', fontStyle:'italic', fontWeight:300, color:'#0A0A0A', lineHeight:'1.75', marginBottom:'20px', flex:1 }}>
                &ldquo;Steadyhand developed sensitive ways of creating processes across worksites, office and client comms, but were also great at recognising and supporting my intuitions as an owner-operator. I recommend Steadyhand wholeheartedly.&rdquo;
              </blockquote>
              <cite style={{ fontSize:'13px', color:'#7A9098', fontStyle:'normal' }}>C Creevey · Margaret River & Busselton Regutters</cite>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background:'#0A0A0A' }}>
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', fontWeight:500, marginBottom:'10px' }}>Common questions</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,3vw,28px)', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'40px' }}>GOOD QUESTIONS.</h2>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {[
              { q:'How is Steadyhand different from other platforms?', a:'Most platforms connect you with a tradie and step back. Steadyhand stays present through every stage — the scope agreement, the milestone approvals, the warranty period. We earn only when work is completed and approved.' },
              { q:'What does the 3.5% completion fee mean?', a:'When a milestone payment is released through Steadyhand, we take 3.5%. No subscription fees, no lead fees, no upfront costs for clients. Founding member tradies pay 3% — guaranteed permanently.' },
              { q:'Do I have to use Steadyhand for payments?', a:'Milestone payments are processed through Steadyhand via Stripe. This is what makes warranty and milestone tracking work — each payment is tied to an approved stage of work.' },
              { q:'What if my tradie is not on Steadyhand?', a:'You can invite any tradie by email. They create a free account and join your job. They do not need an existing profile to be invited.' },
              { q:'Is Steadyhand available outside Western Australia?', a:'Not yet. We are building specifically for WA — metro Perth, the South West, and regional areas. Geographic focus means better tradie verification and a platform that understands WA compliance.' },
              { q:'What happens if something goes wrong after sign-off?', a:'Any issue logged within the warranty period is tracked against a response SLA. You have a complete documented record — signed scope, milestone photos, variation approvals — to stand on.' },
            ].map((item, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'20px 24px' }}>
                <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.85)', marginBottom:'8px' }}>{item.q}</p>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', lineHeight:'1.7' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background:'#E8F0EE' }}>
        <div className="cta-inner">
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,3vw,28px)', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT FOR WA. BUILT FOR TRUST.</h2>
          <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:300, marginBottom:'32px', maxWidth:'480px', margin:'0 auto 32px', lineHeight:'1.7' }}>
            Steadyhand is for Western Australian homeowners and trade businesses who believe that good work deserves a proper process.
          </p>
          <div className="cta-buttons">
            <Link href="/signup"><button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:500, border:'none', cursor:'pointer' }}>Start a job request</button></Link>
            <Link href="/signup?role=tradie"><button style={{ background:'#0A0A0A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'none', cursor:'pointer' }}>Get started as a tradie</button></Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#0A0A0A' }}>
        <div className="footer-inner footer-pad" style={{ padding:'32px' }}>
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.7)', letterSpacing:'2px' }}>STEADYHAND</div>
          <div className="footer-links">
            <a href="/guides/warranty-wa" style={{ fontSize:'13px', color:'#2E7D60', textDecoration:'none', fontWeight:500 }}>WA Warranty Guide</a>
            <a href="/guides" style={{ fontSize:'13px', color:'#C07830', textDecoration:'none', fontWeight:500 }}>Cost Guides</a>
            {[['How it works','#how-it-works'],['For tradies','#for-trade-businesses'],['Privacy','/privacy'],['Terms','/terms']].map(([l,href]) => (
              <a key={l} href={href} style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)' }}>© 2026 Steadyhand Digital. Western Australia.</div>
        </div>
      </div>

    </div>
  )
}
