'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkerSetupPage() {
  const [worker, setWorker] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const t = p.get('token')
    if (!t) { setError('Invalid invite link.'); setLoading(false); return }
    const supabase = createClient()
    supabase.from('tradie_workers').select('*, tradie:tradie_profiles!tradie_workers_tradie_id_fkey(business_name)').eq('invite_token', t).single()
      .then(({ data, error: e }) => {
        if (e || !data) { setError('This invite link is invalid or has expired.'); setLoading(false); return }
        if (data.status === 'active') { window.location.href = '/worker/dashboard'; return }
        setWorker(data); setEmail(data.email || ''); setLoading(false)
      })
  }, [])

  const handleSetup = async () => {
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true); setError('')
    const supabase = createClient()
    let userId: string | null = null
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr) {
      if (authErr.message.includes('already')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) { setError(signInErr.message); setSubmitting(false); return }
        userId = signInData.session?.user?.id || null
      } else { setError(authErr.message); setSubmitting(false); return }
    } else { userId = authData.user?.id || null }
    if (!userId) { setError('Could not create session.'); setSubmitting(false); return }
    await supabase.from('profiles').upsert({ id: userId, role: 'worker', email, full_name: worker.name })
    await supabase.from('tradie_workers').update({ profile_id: userId, status: 'active', invite_token: null }).eq('id', worker.id)
    setDone(true)
    setTimeout(() => { window.location.href = '/worker/dashboard' }, 1500)
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'#4A5E64', fontSize:'14px' }}>Loading...</p></div>
  if (done) return <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:'32px', marginBottom:'12px' }}>✓</div><p style={{ color:'#2E7D60', fontSize:'16px', fontWeight:600 }}>Account created — taking you to your dashboard</p></div></div>
  if (error && !worker) return <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ background:'white', borderRadius:'16px', padding:'40px', maxWidth:'400px', textAlign:'center' }}><p style={{ color:'#D4522A', fontSize:'14px' }}>{error}</p><p style={{ color:'#7A9098', fontSize:'13px', marginTop:'8px' }}>Contact your leading hand for a new invite.</p></div></div>

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'40px 36px', maxWidth:'420px', width:'100%' }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', marginBottom:'8px' }}>STEADYHAND</div>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#0A0A0A', margin:'0 0 6px' }}>Join {worker?.tradie?.business_name}</h1>
        <p style={{ fontSize:'13px', color:'#7A9098', margin:'0 0 28px', lineHeight:'1.6' }}>Set up your worker account to see your assigned jobs and site brief from the leading hand.</p>
        <div style={{ marginBottom:'16px' }}>
          <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4A5E64', marginBottom:'6px' }}>Your name</label>
          <div style={{ padding:'11px 14px', background:'#F4F8F7', borderRadius:'8px', fontSize:'14px', color:'#0A0A0A', border:'1px solid rgba(28,43,50,0.12)' }}>{worker?.name}</div>
        </div>
        <div style={{ marginBottom:'16px' }}>
          <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4A5E64', marginBottom:'6px' }}>Email</label>
          <div style={{ padding:'11px 14px', background:'#F4F8F7', borderRadius:'8px', fontSize:'14px', color:'#7A9098', border:'1px solid rgba(28,43,50,0.12)' }}>{email}</div>
        </div>
        <div style={{ marginBottom:'24px' }}>
          <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4A5E64', marginBottom:'6px' }}>Create a password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
            style={{ width:'100%', padding:'11px 14px', background:'#F4F8F7', borderRadius:'8px', fontSize:'14px', color:'#0A0A0A', border:'1px solid rgba(28,43,50,0.15)', outline:'none', boxSizing:'border-box' as const }} />
        </div>
        {error && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'16px' }}>{error}</p>}
        <button onClick={handleSetup} disabled={submitting}
          style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:600, border:'none', cursor:submitting ? 'not-allowed' : 'pointer', opacity:submitting ? 0.7 : 1 }}>
          {submitting ? 'Setting up...' : 'Create my account →'}
        </button>
        <p style={{ fontSize:'11px', color:'#9AA5AA', textAlign:'center' as const, marginTop:'16px' }}>Already have an account? <a href="/login" style={{ color:'#2E6A8F' }}>Sign in</a></p>
      </div>
    </div>
  )
}
