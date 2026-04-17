import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' }}>
      <div style={{ textAlign:'center', padding:'48px 24px', maxWidth:'480px' }}>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'80px', color:'#D4522A', letterSpacing:'4px', margin:'0 0 8px' }}>404</p>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'12px' }}>PAGE NOT FOUND</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'32px' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/dashboard">
            <button style={{ background:'#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
              Go to dashboard
            </button>
          </Link>
          <Link href="/">
            <button style={{ background:'transparent', color:'#0A0A0A', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>
              Home page
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
