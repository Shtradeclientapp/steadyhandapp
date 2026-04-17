'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkerAcceptPage() {
  const [token, setToken] = useState<string|null>(null)
  const [worker, setWorker] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    setToken(t)
    if (!t) { setLoading(false); return }
    const supabase = createClient()
    supabase.from('tradie_workers').select('*, tradie:tradie_profiles(business_name)').eq('invite_token', t).single().then(({ data }) => {
      setWorker(data)
      setLoading(false)
    })
  }, [])

  const handleAccept = async () => {
    if (!form.password || form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: worker.email,
      password: form.password,
      options: { data: { full_name: worker.name, role: 'worker' } }
    })
    if (signUpError) { setError(signUpError.message); setSubmitting(false); return }
    const userId = authData.user?.id
    if (userId) {
      await supabase.from('profiles').upsert({ id: userId, email: worker.email, full_name: worker.name, role: 'worker', worker_tradie_id: worker.tradie_id })
      await supabase.from('tradie_workers').update({ profile_id: userId, status: 'active', invite_token: null }).eq('id', worker.id)
    }
    setDone(true)
    setSubmitting(false)
    setTimeout(() => { window.location.href = '/worker/jobs' }, 1500)
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div>
  if (!worker) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#D4522A' }}>Invalid or expired invitation.</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'sans-serif' }}>
      <div style={{ background:'#E8F0EE', borderRadius:'16px', padding:'32px', maxWidth:'420px', width:'100%', boxShadow:'0 8px 40px rgba(28,43,50,0.12)' }}>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', margin:'0 0 20px' }}>STEADYHAND</p>
        {done ? (
          <div style={{ textAlign:'center' as const }}>
            <p style={{ fontSize:'32px', marginBottom:'12px' }}>✓</p>
            <p style={{ fontSize:'16px', fontWeight:600, color:'#2E7D60', marginBottom:'6px' }}>Account created</p>
            <p style={{ fontSize:'13px', color:'#4A5E64' }}>Redirecting to your jobs...</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize:'16px', fontWeight:600, color:'#0A0A0A', margin:'0 0 6px' }}>You have been invited to join</p>
            <p style={{ fontSize:'20px', fontWeight:600, color:'#D4522A', margin:'0 0 4px' }}>{worker.tradie?.business_name}</p>
            <p style={{ fontSize:'13px', color:'#7A9098', margin:'0 0 24px' }}>as a field worker on Steadyhand</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', margin:'0 0 20px', lineHeight:'1.6' }}>Create a password to activate your account. You will be able to view your assigned jobs and submit field updates from your phone.</p>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Email</label>
              <input type="email" value={worker.email} disabled style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'rgba(28,43,50,0.04)', color:'#7A9098', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Create password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Confirm password</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            {error && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px' }}>{error}</p>}
            <button type="button" onClick={handleAccept} disabled={submitting || !form.password}
              style={{ width:'100%', background: submitting ? 'rgba(28,43,50,0.3)' : '#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
              {submitting ? 'Creating account...' : 'Accept invitation →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
