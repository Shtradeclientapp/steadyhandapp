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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('Error: ' + error.message)
      setLoading(false)
    } else {
      setStatus('Success! Redirecting...')
      window.location.replace('/dashboard')
    }
  }

  return (
    <div style={{ fontFamily:'sans-serif', background:'#C8D5D2', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', padding:'40px', borderRadius:'12px', width:'400px' }}>
        <h1 style={{ fontSize:'24px', marginBottom:'24px', textTransform:'uppercase', letterSpacing:'4px' }}>STEADYHAND</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:'12px', border:'1.5px solid #ccc', borderRadius:'6px', fontSize:'14px', display:'block' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:'16px', border:'1.5px solid #ccc', borderRadius:'6px', fontSize:'14px', display:'block' }} />
        <button onClick={handleLogin} disabled={loading} style={{ width:'100%', background:'#1C2B32', color:'white', padding:'13px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'15px' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        {status && <p style={{ marginTop:'14px', fontSize:'13px', color: status.startsWith('Error') ? '#D4522A' : '#2E7D60', textAlign:'center' }}>{status}</p>}
        <p style={{ marginTop:'16px', fontSize:'13px', textAlign:'center', color:'#666' }}>No account? <a href="/signup" style={{ color:'#2E7D60' }}>Sign up</a></p>
      </div>
    </div>
  )
}