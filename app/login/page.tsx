'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const pendingConfirmation = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('confirmed') === 'pending'
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    if (!resetEmail.trim()) return
    setResetting(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    })
    setResetSent(true)
    setResetting(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setStatus('Signing in...')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('Error: ' + error.message)
      setLoading(false)
    } else {
      const { data: profile } = await supabase.from('profiles').select('role, is_admin').eq('id', data.user?.id).single()
    const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
    const dest = redirectParam || (profile?.is_admin ? '/admin' : profile?.role === 'tradie' ? '/tradie/dashboard' : '/dashboard')
    window.location.replace(dest)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', flexDirection:'column' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <a href="/signup" style={{ background:'#0A0A0A', color:'white', padding:'9px 20px', borderRadius:'6px', fontSize:'13px', fontWeight:'500', textDecoration:'none' }}>Create account</a>
      </nav>

     <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr' }} className="login-grid">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 48px' }}>
          <div style={{ width:'100%', maxWidth:'380px' }}>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#D4522A', letterSpacing:'2px', marginBottom:'6px' }}>STEADYHAND</h1>
            <p style={{ fontSize:'22px', fontWeight:'600', color:'#0A0A0A', marginBottom:'6px', fontFamily:'sans-serif' }}>Welcome back</p>
            <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom: pendingConfirmation ? '16px' : '32px', fontFamily:'sans-serif' }}>Sign in to your Steadyhand account</p>
            {pendingConfirmation && (
              <div style={{ background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.25)', borderRadius:'10px', padding:'14px 16px', marginBottom:'24px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#2E6A8F', margin:'0 0 4px', fontFamily:'sans-serif' }}>Check your email</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, fontFamily:'sans-serif' }}>We sent a confirmation link to your email address. Click it to activate your account, then sign in here.</p>
              </div>
            )}

            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#0A0A0A', marginBottom:'6px', fontFamily:'sans-serif' }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', fontFamily:'sans-serif' }} />
            </div>

            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#0A0A0A', marginBottom:'6px', fontFamily:'sans-serif' }}>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', fontFamily:'sans-serif' }} />
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
              style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'500', fontFamily:'sans-serif', marginBottom:'20px' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ textAlign:'center', marginBottom:'16px' }}>
              <button type="button" onClick={() => setShowForgot(!showForgot)}
                style={{ fontSize:'13px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                Forgot your password?
              </button>
            </div>

            {showForgot && (
              <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'10px', padding:'16px', marginBottom:'16px' }}>
                {resetSent ? (
                  <p style={{ fontSize:'13px', color:'#2E7D60', margin:0 }}>✓ Reset link sent — check your email.</p>
                ) : (
                  <>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'8px', fontFamily:'sans-serif' }}>Reset your password</p>
                    <input type="email" placeholder="your@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', marginBottom:'8px', fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
                    <button type="button" onClick={handleReset} disabled={!resetEmail.trim() || resetting}
                      style={{ width:'100%', background:'#2E6A8F', color:'white', padding:'9px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity:!resetEmail.trim() || resetting ? 0.5 : 1, fontFamily:'sans-serif' }}>
                      {resetting ? 'Sending...' : 'Send reset link'}
                    </button>
                  </>
                )}
              </div>
            )}

            <p style={{ fontSize:'13px', color:'#4A5E64', textAlign:'center', fontFamily:'sans-serif' }}>
              Don't have an account? <a href="/signup" style={{ color:'#D4522A', fontWeight:'500' }}>Sign up</a>
            </p>
          </div>
        </div>

       <div className="login-right" style={{ background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 64px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 60%, rgba(212,82,42,0.15), transparent 55%)' }} />
          <blockquote style={{ position:'relative', zIndex:1, maxWidth:'360px' }}>
            <p style={{ fontFamily:'sans-serif', fontSize:'17px', fontStyle:'italic', fontWeight:'300', lineHeight:'1.7', color:'rgba(216,228,225,0.85)', marginBottom:'20px' }}>
              "Not only did we achieve our ROI expectations, but I was able to come at my business from a new perspective — less on the tools and more in a position of strategic leadership over the direction and feel of our services."
            </p>
            <cite style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', fontStyle:'normal', fontFamily:'sans-serif' }}>
              — Cullum Creevey, Margaret River Regutters
            </cite>
          </blockquote>
        </div>
      </div>
      <p style={{ textAlign:'center', fontSize:'11px', color:'#9AA5AA', marginTop:'24px' }}>
        By using Steadyhand you agree to our{' '}
        <a href="/terms" style={{ color:'#7A9098', textDecoration:'underline' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color:'#7A9098', textDecoration:'underline' }}>Privacy Policy</a>
      </p>
    </div>
  )
}