'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setStatus('Signing in...')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('Error: ' + error.message)
      setLoading(false)
    } else {
      window.location.replace('/dashboard')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', flexDirection:'column' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div style={{ fontFamily:'Aboreto, cursive', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <a href="/signup" style={{ background:'#1C2B32', color:'white', padding:'9px 20px', borderRadius:'6px', fontSize:'13px', fontWeight:'500', textDecoration:'none' }}>Create account</a>
      </nav>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 48px' }}>
          <div style={{ width:'100%', maxWidth:'380px' }}>
            <h1 style={{ fontFamily:'Aboreto, cursive', fontSize:'28px', color:'#D4522A', letterSpacing:'2px', marginBottom:'6px' }}>STEADYHAND</h1>
            <p style={{ fontSize:'22px', fontWeight:'600', color:'#1C2B32', marginBottom:'6px', fontFamily:'sans-serif' }}>Welcome back</p>
            <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'32px', fontFamily:'sans-serif' }}>Sign in to your Steadyhand account</p>

            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'6px', fontFamily:'sans-serif' }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif' }} />
            </div>

            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'6px', fontFamily:'sans-serif' }}>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif' }} />
            </div>

            {status && (
              <div style={{ marginBottom:'16px', padding:'11px 14px', borderRadius:'8px', fontSize:'13px', fontFamily:'sans-serif',
                background: status.startsWith('Error') ? 'rgba(212,82,42,0.08)' : 'rgba(46,125,96,0.08)',
                color: status.startsWith('Error') ? '#D4522A' : '#2E7D60',
                border: `1px solid ${status.startsWith('Error') ? 'rgba(212,82,42,0.2)' : 'rgba(46,125,96,0.2)'}` }}>
                {status}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading}
              style={{ width:'100%', background:'#1C2B32', color:'white', padding:'13px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'500', fontFamily:'sans-serif', marginBottom:'20px' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p style={{ fontSize:'13px', color:'#4A5E64', textAlign:'center', fontFamily:'sans-serif' }}>
              Don't have an account? <a href="/signup" style={{ color:'#D4522A', fontWeight:'500' }}>Sign up</a>
            </p>
          </div>
        </div>

        <div style={{ background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 64px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 60%, rgba(212,82,42,0.15), transparent 55%)' }} />
          <blockquote style={{ position:'relative', zIndex:1, maxWidth:'360px' }}>
            <p style={{ fontFamily:'sans-serif', fontSize:'18px', fontStyle:'italic', fontWeight:'300', lineHeight:'1.7', color:'rgba(216,228,225,0.85)', marginBottom:'20px' }}>
              "Steadyhand gave us a genuine pipeline of local jobs. We've stopped chasing leads on three other platforms."
            </p>
            <cite style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', fontStyle:'normal', fontFamily:'sans-serif' }}>
              — Chris Creevey, Re-Gutters Margaret River
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  )
}