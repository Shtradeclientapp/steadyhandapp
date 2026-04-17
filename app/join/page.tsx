'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'view'|'signup'|'done'>('view')
  const [form, setForm] = useState({ fullName: '', password: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { setError('Invalid invitation link'); setLoading(false); return }
    fetch('/api/invite?token=' + token)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInvitation(data.invitation)
        setLoading(false)
      })
  }, [])

  const handleSignup = async () => {
    if (!form.password) return
    setSubmitting(true)
    const supabase = createClient()
    // Try signup first — if user exists, fall back to sign in
    let uid: string | undefined
    const { data, error: signupError } = await supabase.auth.signUp({ email: invitation.email, password: form.password })
    if (signupError?.message?.includes('already registered') || signupError?.message?.includes('already exists')) {
      // Existing user — sign them in instead
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: invitation.email, password: form.password })
      if (signInError) { setError('Account exists but password incorrect — try signing in at /login'); setSubmitting(false); return }
      uid = signInData.user?.id
      // Check if existing account is a client — warn them
      const { data: existingRole } = await supabase.from('profiles').select('role').eq('id', uid).single()
      if (existingRole?.role === 'client') {
        setError('This email is registered as a client account. Please use a different email address to register as a trade business, or contact Steadyhand to change your account type.')
        await supabase.auth.signOut()
        setSubmitting(false)
        return
      }
    } else if (signupError) {
      setError(signupError.message); setSubmitting(false); return
    } else {
      uid = data.user?.id
    }
    if (!uid) { setError('Could not establish session'); setSubmitting(false); return }
    // Only insert profile/tradie rows if this is a new signup
    let existingProfile = null
    try {
      const { data: ep } = await supabase.from('profiles').select('id').eq('id', uid).single()
      existingProfile = ep
    } catch (_) {}
    // Always update role to tradie — trigger may have created a client profile
    await supabase.from('profiles').upsert({ id: uid, role: 'tradie', full_name: form.fullName || invitation.business_name, email: invitation.email, suburb: invitation.job?.suburb || '' }, { onConflict: 'id' })
    await supabase.from('tradie_profiles').upsert({ id: uid, business_name: invitation.business_name, trade_categories: [invitation.trade_category || invitation.job?.trade_category || 'General'], service_areas: [invitation.job?.suburb || 'Perth Metro'], subscription_active: false }, { onConflict: 'id' })
    // Wait for session to be established before writing
    let sessionReady = false
    for (let i = 0; i < 10; i++) {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (s) { sessionReady = true; break }
      await new Promise(r => setTimeout(r, 300))
    }
    if (!sessionReady) { setError('Session not established — please try again'); setSubmitting(false); return }

    // Create quote_request row so tradie sees job on their dashboard
    const { error: qrError } = await supabase.from('quote_requests').upsert({
      job_id: invitation.job_id,
      tradie_id: uid,
      status: 'requested',
      requested_at: new Date().toISOString(),
    }, { onConflict: 'job_id,tradie_id' })
    if (qrError) console.error('quote_request error:', qrError)

    // Update invitation status
    const { error: invError } = await supabase.from('tradie_invitations').update({ status: 'accepted', tradie_id: uid, accepted_at: new Date().toISOString() }).eq('id', invitation.id)
    if (invError) console.error('invitation update error:', invError)
    // Leave job status as shortlisted — tradie needs to be verified before agreement
    setStep('done')
    setSubmitting(false)
    setTimeout(() => { window.location.href = '/tradie/dashboard' }, 2000)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading your invitation...</p>
    </div>
  )

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center', padding:'32px', background:'#E8F0EE', borderRadius:'14px', maxWidth:'400px' }}>
        <p style={{ color:'#D4522A', fontFamily:'sans-serif', marginBottom:'12px' }}>{error}</p>
        <a href="/" style={{ color:'#4A5E64', fontSize:'13px' }}>Return to Steadyhand</a>
      </div>
    </div>
  )

  if (step === 'done') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center', padding:'32px', background:'#E8F0EE', borderRadius:'14px', maxWidth:'400px' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>✅</div>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#0A0A0A', marginBottom:'8px' }}>Welcome to Steadyhand</h2>
        <p style={{ color:'#4A5E64', fontSize:'14px' }}>Your account is set up and the job is waiting. Taking you to your dashboard...</p>
      </div>
    </div>
  )

  const job = invitation?.job
  const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', fontFamily:'sans-serif', boxSizing:'border-box' as const }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
      </nav>
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'40px 24px' }}>
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'24px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'12px' }}>
              <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
              <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' as const }}>Job waiting for you</span>
            </div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'6px' }}>{job?.title}</h2>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)', marginBottom:'10px' }}>{job?.trade_category} · {job?.suburb}</p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', lineHeight:'1.6' }}>{job?.description}</p>
            <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(216,228,225,0.1)' }}>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.5)' }}>Requested by {job?.client?.full_name} · {job?.client?.suburb}</p>
            </div>
          </div>
        </div>

        {step === 'view' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px' }}>
            <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'8px' }}>YOU HAVE BEEN INVITED</h3>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'16px' }}>
              <strong>{job?.client?.full_name}</strong> wants to work with <strong>{invitation?.business_name}</strong> on this job through Steadyhand.
            </p>
            <div style={{ background:'#C8D5D2', borderRadius:'10px', padding:'14px', marginBottom:'20px' }}>
              <p style={{ fontSize:'13px', color:'#0A0A0A', fontWeight:500, marginBottom:'8px' }}>What is Steadyhand?</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>Steadyhand is a request-to-warranty platform for Western Australian trades. It helps you manage scopes, milestone payments and warranties digitally — protecting both you and your client throughout the job.</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
              {[
                'Free to join — no subscription required to get started',
                'Structured scope agreement protects you legally',
                'Milestone payments released on client approval',
                'Digital warranty tracking — no more phone chasing',
                'Dialogue Rating builds your professional reputation',
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:'10px', fontSize:'13px', color:'#0A0A0A' }}>
                  <span style={{ color:'#2E7D60', flexShrink:0 }}>✓</span>{item}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setStep('signup')}
              style={{ width:'100%', background:'#D4522A', color:'white', padding:'14px', borderRadius:'8px', fontSize:'15px', fontWeight:500, border:'none', cursor:'pointer' }}>
              Accept invitation and create account →
            </button>
            <p style={{ fontSize:'12px', color:'#7A9098', textAlign:'center' as const, marginTop:'10px' }}>
              Already have an account? <a href="/login" style={{ color:'#D4522A' }}>Sign in</a>
            </p>
          </div>
        )}

        {step === 'signup' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px' }}>
            <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'16px' }}>CREATE YOUR ACCOUNT</h3>
            <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'12px 14px', marginBottom:'20px' }}>
              <p style={{ fontSize:'13px', color:'#2E7D60', margin:0 }}>Signing up as <strong>{invitation?.business_name}</strong> · {invitation?.email}</p>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Your full name *</label>
              <input type="text" placeholder="Jane Smith" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={inp} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Password *</label>
              <input type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inp} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Phone (optional)</label>
              <input type="tel" placeholder="0400 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
            </div>
            {error && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px' }}>{error}</p>}
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" onClick={() => setStep('view')} style={{ background:'transparent', color:'#0A0A0A', padding:'12px 20px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>Back</button>
              <button type="button" onClick={handleSignup} disabled={submitting || !form.password}
                style={{ flex:1, background:'#D4522A', color:'white', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: submitting || !form.fullName || !form.password ? 0.6 : 1 }}>
                {submitting ? 'Creating account...' : 'Create account and view job →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
