'use client'
import { ObservatoryPage } from '@/components/ui/Observatory'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function Page() {
  const [isTradie, setIsTradie] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setLoggedIn(true)
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      setIsTradie(prof?.role === 'tradie')
    })
  }, [])

  const dashHref = isTradie ? '/tradie/dashboard' : '/dashboard'

  return (
    <>
      {/* Nav */}
      <div style={{ background:'#0A0A0A', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
          <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontFamily:'var(--font-aboreto, Georgia, serif)', fontSize:'14px', color:'rgba(216,228,225,0.85)', letterSpacing:'2px' }}>STEADYHAND</span>
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <Link href="/" style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', textDecoration:'none' }}>← Back to site</Link>
            {loggedIn ? (
              <Link href={dashHref}>
                <button style={{ background:'#D4522A', color:'white', padding:'6px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>Dashboard</button>
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', textDecoration:'none' }}>Log in</Link>
                <Link href="/signup">
                  <button style={{ background:'#D4522A', color:'white', padding:'6px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>Get started</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(46,107,143,0.1)', borderBottom:'1px solid rgba(46,107,143,0.2)', padding:'10px 24px' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)' }}>Already on Steadyhand?</span>
          <a href="/compare" style={{ fontSize:'12px', color:'#2E6A8F', fontWeight:500, textDecoration:'none' }}>Use the in-app quote comparison tool →</a>
          <span style={{ fontSize:'11px', color:'rgba(216,228,225,0.3)', marginLeft:'8px' }}>Includes AI analysis, revision history and side-by-side line items</span>
        </div>
      </div>
      <ObservatoryPage />
    </>
  )
}
