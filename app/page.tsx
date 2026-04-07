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
            <a href="#for-homeowners" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For homeowners</a>
            <a href="#for-trade-businesses" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>For trade businesses</a>
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

      {/* HERO */}
      <div style={{ background:'#1C2B32', position:'relative', overflow:'hidden', textAlign:'center' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(212,82,42,0.15), transparent 60%)' }} />
        <div className="hero-inner" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(216,228,225,0.08)', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'100px', padding:'6px 16px', marginBottom:'28px' }}>
            <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%', flexShrink:0 }} />
            <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', letterSpacing:'0.5px' }}>Built exclusively for Western Australia</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(28px, 5vw, 64px)', color:'rgba(216,228,225,0.92)', letterSpacing:'3px', lineHeight:'1.1', marginBottom:'24px', maxWidth:'780px', margin:'0 auto 24px' }}>
            YOU SHOULDN&#39;T HAVE TO NAVIGATE THIS ALONE
          </h1>
          <p style={{ fontSize:'18px', fontWeight:'300', color:'rgba(216,228,225,0.55)', lineHeight:'1.7', maxWidth:'560px', margin:'0 auto 16px' }}>
            Hiring a tradie is one of the most stressful things a homeowner does. You don&#39;t know if the quote is fair. You don&#39;t know what you&#39;re signing. You don&#39;t know what to do if something goes wrong.
          </p>
          <p style={{ fontSize:'18px', fontWeight:'400', color:'rgba(216,228,225,0.8)', lineHeight:'1.7', maxWidth:'560px', margin:'0 auto 40px' }}>
            Steadyhand stays with you through every stage — so you always know what to do next.
          </p>
          <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup">
              <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>Start a job request</button>
            </Link>
            <Link href="/signup">
              <button style={{ background:'transparent', color:'rgba(216,228,225,0.8)', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'1px solid rgba(216,228,225,0.2)', cursor:'pointer' }}>Get started as a tradie</button>
            </Link>
          </div>
        </div>
      </div>

      {/* REASSURANCE BAR */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div className="stats-bar stats-inner">
          {[
            { num:'We guide you', label:'through every stage from request to warranty' },
            { num:'We verify', label:'every tradie's licence and insurance' },
            { num:'You decide', label:'nothing starts until you sign the scope' },
            { num:'You pay nothing', label:'upfront — only when work is approved' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#D4522A', letterSpacing:'0.5px', marginBottom:'4px' }}>{s.num}</div>
              <div style={{ fontSize:'12px', color:'#4A5E64', marginTop:'3px', maxWidth:'180px', margin:'0 auto' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WHO THIS IS FOR */}
      <div className="section-inner" id="for-homeowners">
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#2E7D60', fontWeight:'500', marginBottom:'10px' }}>Who Steadyhand is for</p>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>IF ANY OF THIS SOUNDS FAMILIAR</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', lineHeight:'1.7', maxWidth:'520px', marginBottom:'48px' }}>
          Most people who hire a tradie feel some version of this. Steadyhand was built for them.
        </p>
        <div className="values-grid">
          {[
            { icon:'😟', title:'You don't know if the quote is fair', body:'You've received three quotes with different line items, different assumptions, different terms. You can't tell if you're being overcharged or if the cheapest one is cutting corners. Steadyhand shows you quotes side by side and tells you what to look for.' },
            { icon:'📄', title:'You don't know what you're signing', body:'The contract is full of legal language and exclusions you don't understand. You're not sure what's included or what happens if the work isn't right. Steadyhand uses plain language and makes sure every inclusion, exclusion and milestone is agreed before work starts.' },
            { icon:'🔧', title:'You can't tell if the work is on track', body:'The tradie says everything is fine but you're not sure what's happening on site. You don't want to be difficult but you want to know. Steadyhand gives you milestone-by-milestone visibility — you approve each stage before payment releases.' },
            { icon:'🛡', title:'You don't know what to do if something goes wrong', body:'The job is done but there's a problem. You're not sure if it's covered, who to call, or what your rights are. Steadyhand's warranty period means issues are tracked, deadlines are set, and you have a complete documented record to stand on.' },
          ].map(v => (
            <div key={v.title} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
              <div style={{ fontSize:'28px', marginBottom:'14px' }}>{v.icon}</div>
              <h3 style={{ fontSize:'16px', fontWeight:'600', color:'#1C2B32', marginBottom:'8px' }}>{v.title}</h3>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65' }}>{v.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background:'#1C2B32' }}>
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'10px' }}>How it works</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>EIGHT STAGES. ONE STEADY HAND.</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.5)', fontWeight:'300', lineHeight:'1.7', maxWidth:'520px', marginBottom:'48px' }}>
            From your first job request to your final warranty, Steadyhand is present at every stage. You always know where you are, what happens next, and what your rights are.
          </p>
          <div className="steps-grid">
            {[
              { num:'01', title:'Request', body:'Tell us what you need. Describe the job in plain language — no trade knowledge required. We handle the matching.' },
              { num:'02', title:'Match', body:'We find verified, insured tradies in your area and rank them by fit. You choose who to invite — not the other way around.' },
              { num:'03', title:'Consult', body:'Meet your tradies on site. Each one documents what they find. You document too. This shared record becomes part of your permanent job file.' },
              { num:'04', title:'Compare', body:'See all quotes side by side — line items, start dates, conditions. We tell you what's missing and what to watch out for.' },
              { num:'05', title:'Contract', body:'Review the scope in plain language. Every inclusion and exclusion is spelled out. You sign when you're confident. Nothing starts until you do.' },
              { num:'06', title:'Build', body:'Work happens in stages. You approve each milestone before payment releases. The tradie is paid promptly. You're never releasing money for work you haven't seen.' },
              { num:'07', title:'Complete', body:'A structured sign-off confirms the job is done. Your warranty clock starts from this moment — not from the invoice date.' },
              { num:'08', title:'Protect', body:'Any issues within the warranty period are logged and tracked. You have a complete record from first contact to final resolution.' },
            ].map(s => (
              <div key={s.num} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'28px' }}>
                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#D4522A', letterSpacing:'1px', marginBottom:'14px', background:'rgba(212,82,42,0.12)', border:'1px solid rgba(212,82,42,0.2)', display:'inline-block', padding:'4px 10px', borderRadius:'6px' }}>{s.num}</div>
                <h3 style={{ fontSize:'17px', fontWeight:'600', color:'rgba(216,228,225,0.85)', marginBottom:'8px' }}>{s.title}</h3>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.6' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY DIFFERENT */}
      <div className="section-inner">
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#2E7D60', fontWeight:'500', marginBottom:'10px' }}>Why Steadyhand is different</p>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT FROM THE CLIENT SIDE</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', lineHeight:'1.7', maxWidth:'580px', marginBottom:'48px' }}>
          Every other trades platform was built for tradies — to help them find more leads. Steadyhand was built for the person on the other side of the contract. The one who doesn&#39;t speak the language, doesn&#39;t know the going rate, and just wants the job done right.
        </p>
        <div className="values-grid">
          {[
            { icon:'💬', title:'Dialogue, not just documents', body:'The trust between a client and tradie is built through conversation — how they talk about pricing, compliance, risk and timeline. Steadyhand scores every job dialogue across six dimensions. Good conversations lead to good outcomes.' },
            { icon:'🔍', title:'Verified, not just listed', body:'Any tradie on Steadyhand has had their licence and insurance checked before they appear in any shortlist. Verification is not a badge you buy — it is a condition of being here.' },
            { icon:'⚖️', title:'We only earn when you do', body:'Steadyhand charges a small completion fee only when a job is finished and approved. We have no incentive to fill your shortlist with paid listings or rush you through a quote. Our success depends on yours.' },
            { icon:'📁', title:'A record that lasts', body:'Every stage of your job is documented — the consult notes, the signed scope, the milestone approvals, the warranty log. If anything is ever disputed, you have a complete record to stand on.' },
          ].map(v => (
            <div key={v.title} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
              <div style={{ fontSize:'28px', marginBottom:'14px' }}>{v.icon}</div>
              <h3 style={{ fontSize:'16px', fontWeight:'600', color:'#1C2B32', marginBottom:'8px' }}>{v.title}</h3>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65' }}>{v.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOR TRADE BUSINESSES */}
      <div style={{ background:'#1C2B32' }} id="for-trade-businesses">
        <div className="section-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'10px' }}>For trade businesses</p>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>BETTER CLIENTS. BETTER JOBS.</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.5)', fontWeight:'300', lineHeight:'1.7', maxWidth:'560px', marginBottom:'40px' }}>
            Steadyhand attracts clients who are serious about doing things properly. They&#39;ve read the scope. They know what they&#39;re paying for. They&#39;ve agreed to the milestones. That means fewer disputes, faster payments, and work that&#39;s worth doing.
          </p>
          <div className="steps-grid">
            {[
              { title:'Your reputation, built into the platform', body:'Every job you complete builds your Dialogue Trust Score — a signal to future clients that you engage honestly on pricing, compliance and risk. High-scoring tradies get more work.' },
              { title:'Scope agreements that protect you too', body:'The signed scope agreement isn't just for the client. It protects you from scope creep, from unpaid variations, and from disputes over what was agreed. It's stored permanently against every job.' },
              { title:'Paid on time, every time', body:'Milestone payments release through Stripe the moment a client approves. No chasing invoices. No 30-day payment terms. Steadyhand takes 3.5% — only when you get paid.' },
            ].map(s => (
              <div key={s.title} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'28px' }}>
                <h3 style={{ fontSize:'17px', fontWeight:'600', color:'rgba(216,228,225,0.85)', marginBottom:'10px' }}>{s.title}</h3>
                <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.45)', lineHeight:'1.65' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIAL */}
      <div style={{ background:'#E8F0EE' }}>
        <div className="testimonial-inner">
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#4A5E64', marginBottom:'24px' }}>From the field</p>
          <blockquote style={{ fontSize:'22px', fontStyle:'italic', fontWeight:'300', color:'#1C2B32', lineHeight:'1.7', marginBottom:'28px' }}>
            &ldquo;I recommend Steadyhand wholeheartedly as digital operations professionals.&rdquo;
          </blockquote>
          <div style={{ width:'40px', height:'1px', background:'rgba(212,82,42,0.5)', margin:'0 auto 20px' }} />
          <cite style={{ fontSize:'13px', color:'#7A9098', fontStyle:'normal', lineHeight:'1.8', display:'block' }}>
            Cullum Creevey<br />
            Small Business Owner<br />
            Margaret River and Busselton Re-Gutters
          </cite>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background:'#1C2B32' }}>
        <div className="cta-inner">
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>YOU DESERVE TO FEEL CONFIDENT ABOUT THIS.</h2>
          <p style={{ fontSize:'16px', color:'rgba(216,228,225,0.5)', fontWeight:'300', marginBottom:'32px', maxWidth:'480px', margin:'0 auto 32px', lineHeight:'1.7' }}>
            Steadyhand is free to start. No subscription, no lead fees. You only pay a small completion fee when the job is done and you&#39;re satisfied.
          </p>
          <div className="cta-buttons">
            <Link href="/signup">
              <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>Start a job request — it's free</button>
            </Link>
            <Link href="/signup">
              <button style={{ background:'transparent', color:'rgba(216,228,225,0.8)', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'1px solid rgba(216,228,225,0.2)', cursor:'pointer' }}>Join as a trade business</button>
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#0F1A1F' }}>
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
