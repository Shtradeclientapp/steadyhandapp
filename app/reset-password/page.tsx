'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Handle PKCE flow — code in query param
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) setReady(true)
        else setStatus('Error: Reset link is invalid or has expired. Please request a new one.')
      })
      return
    }

    // Legacy hash flow fallback
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setReady(true)
      return
    }

    // Auth state change fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Last resort — show form after delay
    const timer = setTimeout(() => {
      setReady(true)
      setStatus('If you arrived from a reset link, enter your new password below.')
    }, 1000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  const handleReset = async () => {
    if (!password || password !== confirm) { setStatus('Error: Passwords do not match.'); return }
    if (password.length < 8) { setStatus('Error: Password must be at least 8 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('Error: ' + error.message)
    } else {
      setDone(true)
      setTimeout(() => { window.location.href = '/login' }, 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' }}>
      <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'40px', width:'100%', maxWidth:'400px' }}>
        <a href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none', display:'block', marginBottom:'20px' }}>STEADYHAND</a>
        <h2 style={{ fontSize:'20px', fontWeight:600, color:'#0A0A0A', marginBottom:'6px' }}>Set new password</h2>
        <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>Choose a new password for your account.</p>
        {!ready ? (
          <p style={{ fontSize:'14px', color:'#4A5E64' }}>Verifying reset link...</p>
        ) : done ? (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'14px', fontSize:'14px', color:'#2E7D60' }}>
            ✓ Password updated — redirecting to login...
          </div>
        ) : (
          <>
            {status && (
              <div style={{ marginBottom:'16px', padding:'10px 14px', borderRadius:'8px', fontSize:'13px',
                background: status.startsWith('Error') ? 'rgba(212,82,42,0.08)' : 'rgba(46,106,143,0.08)',
                color: status.startsWith('Error') ? '#D4522A' : '#2E6A8F',
                border: '1px solid ' + (status.startsWith('Error') ? 'rgba(212,82,42,0.2)' : 'rgba(46,106,143,0.2)') }}>
                {status}
              </div>
            )}
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <button type="button" onClick={handleReset} disabled={!password || !confirm || loading}
              style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'15px', fontWeight:500, border:'none', cursor:'pointer', opacity:!password || !confirm || loading ? 0.5 : 1 }}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
            <p style={{ fontSize:'13px', color:'#7A9098', textAlign:'center', marginTop:'16px' }}>
              Link not working? <a href="/login" style={{ color:'#2E6A8F' }}>Request a new one</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
