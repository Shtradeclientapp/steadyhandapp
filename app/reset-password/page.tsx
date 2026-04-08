'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase puts the token in the URL hash — just need to be on this page
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('Enter your new password below.')
      }
    })
  }, [])

  const handleReset = async () => {
    if (!password || password !== confirm) { setStatus('Passwords do not match.'); return }
    if (password.length < 8) { setStatus('Password must be at least 8 characters.'); return }
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
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', marginBottom:'8px' }}>STEADYHAND</h1>
        <h2 style={{ fontSize:'20px', fontWeight:600, color:'#1C2B32', marginBottom:'6px' }}>Set new password</h2>
        <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>Choose a new password for your account.</p>
        {done ? (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'14px', fontSize:'14px', color:'#2E7D60' }}>
            ✓ Password updated — redirecting to login...
          </div>
        ) : (
          <>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            {status && (
              <div style={{ marginBottom:'14px', padding:'10px 14px', borderRadius:'8px', fontSize:'13px',
                background: status.startsWith('Error') ? 'rgba(212,82,42,0.08)' : 'rgba(46,106,143,0.08)',
                color: status.startsWith('Error') ? '#D4522A' : '#2E6A8F',
                border: '1px solid ' + (status.startsWith('Error') ? 'rgba(212,82,42,0.2)' : 'rgba(46,106,143,0.2)') }}>
                {status}
              </div>
            )}
            <button type="button" onClick={handleReset} disabled={!password || !confirm || loading}
              style={{ width:'100%', background:'#1C2B32', color:'white', padding:'13px', borderRadius:'8px', fontSize:'15px', fontWeight:500, border:'none', cursor:'pointer', opacity:!password || !confirm || loading ? 0.5 : 1 }}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
