import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>

      {/* NAV */}
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>For clients</span>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>For tradies</span>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>About</span>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Link href="/login">
            <button style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.25)', color:'#1C2B32', padding:'8px 18px', borderRadius:'6px', fontSize:'13px', cursor:'pointer' }}>
              Log in
            </button>
          </Link>
          <Link href="/signup">
            <button style={{ background:'#1C2B32', color:'white', padding:'8px 18px', borderRadius:'6px', fontSize:'13px', cursor:'pointer', border:'none' }}>
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background:'#1C2B32', padding:'100px 48px', position:'relative', overflow:'hidden', textAlign:'center' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(212,82,42,0.15), transparent 60%)' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'720px', margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(216,228,225,0.08)', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'100px', padding:'6px 16px', marginBottom:'28px' }}>
            <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
            <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', letterSpacing:'0.5px' }}>Western Australia's trusted trades platform</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(36px, 6vw, 72px)', color:'rgba(216,228,225,0.92)', letterSpacing:'3px', lineHeight:'1.1', marginBottom:'24px' }}>
            BUILDING CONNECTED<br />DIGITAL & TRADE<br />CAPABILITIES
          </h1>
          <p style={{ fontSize:'18px', fontWeight:'300', color:'rgba(216,228,225,0.6)', lineHeight:'1.7', maxWidth:'520px', margin:'0 auto 40px' }}>
            AI-assisted matching connects clients with verified local tradies — from first request through to warranty. You're in control at every stage.
          </p>
          <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup">
              <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>
                Post a job request
              </button>
            </Link>
            <Link href="/signup">
              <button style={{ background:'transparent', color:'rgba(216,228,225,0.8)', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'1px solid rgba(216,228,225,0.2)', cursor:'pointer' }}>
                Join as a tradie →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', padding:'24px 48px', display:'flex', justifyContent:'center', gap:'64px', flexWrap:'wrap' }}>
        {[
          { num:'94%', label:'find a match within 2 hours' },
          { num:'340+', label:'verified WA tradies' },
          { num:'4.8★', label:'average satisfaction score' },
          { num:'WA only', label:'built for regional & metro WA' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#1C2B32', letterSpacing:'1px' }}>{s.num}</div>
            <div style={{ fontSize:'12px', color:'#4A5E64', marginTop:'3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'80px 48px' }}>
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#2E7D60', fontWeight:'500', marginBottom:'10px' }}>How it works</p>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>REQUEST TO WARRANTY</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', lineHeight:'1.7', maxWidth:'480px', marginBottom:'48px' }}>
          No spam leads. No faceless profiles. From job request through to post-job warranty — you drive the process.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px' }}>
          {[
            { num:'01', title:'Define your request', body:'Describe your job, set your warranty expectations, and upload photos. Takes two minutes.' },
            { num:'02', title:'AI shortlists tradies', body:'Claude reviews your job and ranks verified local tradies by relevance, rating, and proximity.' },
            { num:'03', title:'Agree scope & deliver', body:'Both parties sign a scope agreement before work starts. You approve every milestone before payment releases.' },
          ].map(s => (
            <div key={s.num} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#D4522A', letterSpacing:'1px', marginBottom:'14px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.15)', display:'inline-block', padding:'4px 10px', borderRadius:'6px' }}>{s.num}</div>
              <h3 style={{ fontSize:'17px', fontWeight:'600', color:'#1C2B32', marginBottom:'8px' }}>{s.title}</h3>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIAL */}
      <div style={{ background:'#1C2B32', padding:'72px 48px' }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'24px' }}>Client testimony</p>
          <blockquote style={{ fontSize:'20px', fontStyle:'italic', fontWeight:'300', color:'rgba(216,228,225,0.85)', lineHeight:'1.7', marginBottom:'24px' }}>
            "The roadmap Steadyhand designed and implemented for us meant the ride was controlled, data-driven and milestoned along the way."
          </blockquote>
          <cite style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', fontStyle:'normal' }}>
            — C. Creevey, Owner-Operator, Margaret River &amp; Busselton Re-Gutters
          </cite>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'80px 48px', textAlign:'center' }}>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>BUILT FOR WA. BUILT FOR TRUST.</h2>
        <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:'300', marginBottom:'32px', maxWidth:'440px', margin:'0 auto 32px' }}>
          Steadyhand is a social enterprise focused on regional and rural Western Australian communities.
        </p>
        <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/signup">
            <button style={{ background:'#D4522A', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor:'pointer' }}>
              Post a job request
            </button>
          </Link>
          <Link href="/signup">
            <button style={{ background:'#1C2B32', color:'white', padding:'14px 32px', borderRadius:'8px', fontSize:'15px', border:'none', cursor:'pointer' }}>
              Join as a tradie
            </button>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#1C2B32', padding:'32px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.7)', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', gap:'24px' }}>
          {['About', 'Purposes', 'Processes', 'Privacy'].map(l => (
            <span key={l} style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', cursor:'pointer' }}>{l}</span>
          ))}
        </div>
        <div style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)' }}>© 2026 Steadyhand Digital. Western Australia.</div>
      </div>

    </div>
  )
}