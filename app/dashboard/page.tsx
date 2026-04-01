'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        window.location.href = '/login'
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <p style={{ color:'#4A5E64' }}>Loading...</p>
    </div>
  )

  if (!user) return null

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'Aboreto, cursive', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>{user.email}</span>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', color:'#1C2B32', padding:'7px 16px', borderRadius:'6px', fontSize:'13px', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ background:'#1C2B32', padding:'48px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,82,42,0.12), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 48px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.45)', marginBottom:'8px' }}>Good morning</p>
          <h1 style={{ fontFamily:'Aboreto, cursive', fontSize:'36px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'6px' }}>STEADYHAND</h1>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.55)', fontWeight:'300' }}>Request-to-warranty dashboard · Western Australia</p>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'40px 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'32px' }}>
          {[
            { label:'Active jobs', value:'0' },
            { label:'Under warranty', value:'0' },
            { label:'Jobs complete', value:'0' },
          ].map(s => (
            <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'22px' }}>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'8px' }}>{s.label}</p>
              <p style={{ fontFamily:'Aboreto, cursive', fontSize:'36px', color:'#1C2B32', letterSpacing:'1px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'#2E7D60', borderRadius:'14px', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
          <div>
            <h2 style={{ fontFamily:'Aboreto, cursive', fontSize:'20px', color:'white', letterSpacing:'1px', marginBottom:'4px' }}>START A NEW REQUEST</h2>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>Define your job, get AI-matched tradies, set the scope.</p>
          </div>
          <a href="/request" style={{ background:'white', color:'#2E7D60', padding:'13px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', textDecoration:'none', fontFamily:'Aboreto, cursive', letterSpacing:'1px', whiteSpace:'nowrap' }}>
            NEW REQUEST
          </a>
        </div>
      </div>
    </div>
  )
}