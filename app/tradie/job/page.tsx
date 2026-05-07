'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradieJobPage() {
  const [job, setJob] = useState<any>(null)
  const [qr, setQr] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [done, setDone] = useState<'accepted'|'declined'|null>(null)
  const [jobId, setJobId] = useState<string|null>(null)
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const jid = params.get('job_id')
    setJobId(jid)
    if (!jid) { setLoading(false); return }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*, tradie:tradie_profiles(id, business_name, onboarding_step)')
          .eq('id', session.user.id).single()
        setProfile(prof)
      }

      const { data: j } = await supabase
        .from('jobs')
        .select('id, title, trade_category, suburb, description, status, client:profiles!jobs_client_id_fkey(full_name)')
        .eq('id', jid).single()
      setJob(j)

      if (session) {
        const { data: qrData } = await supabase
          .from('quote_requests')
          .select('id, qr_status')
          .eq('job_id', jid)
          .eq('tradie_id', session.user.id)
          .maybeSingle()
        setQr(qrData)
        if (qrData?.qr_status === 'accepted') setDone('accepted')
        if (qrData?.qr_status === 'declined') setDone('declined')
      }
      setLoading(false)
    })
  }, [])

  const act = async (action: 'accepted'|'declined') => {
    if (!qr || !jobId) return
    setActing(true)
    await supabase.from('quote_requests').update({ qr_status: action }).eq('id', qr.id)
    if (action === 'accepted' && profile?.tradie?.id) {
      await supabase.from('jobs').update({ tradie_id: profile.tradie.id, status: 'consult' }).eq('id', jobId)
    }
    setDone(action)
    setActing(false)
    if (action === 'accepted') {
      setTimeout(() => { window.location.href = '/tradie/dashboard' }, 1500)
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'rgba(216,228,225,0.4)', fontSize:'13px' }}>Loading…</p>
    </div>
  )

  if (!jobId || !job) return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'rgba(216,228,225,0.4)', fontSize:'13px' }}>Job not found.</p>
    </div>
  )

  const clientName = Array.isArray(job.client) ? job.client[0]?.full_name : job.client?.full_name

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A' }}>
      {/* Header */}
      <div style={{ padding:'28px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', margin:0 }}>STEADYHAND</p>
      </div>

      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'48px 24px' }}>

        {/* Job card */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'28px', marginBottom:'24px' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.35)', margin:'0 0 8px' }}>Estimate request</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.95)', letterSpacing:'0.5px', margin:'0 0 6px' }}>{job.title}</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:'0 0 20px' }}>
            {job.trade_category}{job.suburb ? ' · ' + job.suburb : ''}{clientName ? ' · from ' + clientName : ''}
          </p>
          {job.description && (
            <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.65)', lineHeight:'1.7', margin:0 }}>{job.description}</p>
          )}
        </div>

        {/* Not logged in */}
        {!profile && (
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'24px', textAlign:'center' as const }}>
            <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.8)', margin:'0 0 8px', fontWeight:500 }}>Log in to respond</p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', margin:'0 0 20px', lineHeight:'1.6' }}>
              Sign in to your Steadyhand account to accept or decline this estimate request.
            </p>
            <a href={'/login?redirect=/tradie/job?job_id=' + jobId}
              style={{ display:'block', background:'#D4522A', color:'white', padding:'13px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, textDecoration:'none', marginBottom:'10px' }}>
              Log in to respond →
            </a>
            <a href={'/signup?role=tradie'}
              style={{ display:'block', color:'rgba(216,228,225,0.4)', fontSize:'13px', textDecoration:'none' }}>
              New to Steadyhand? Create a tradie account
            </a>
          </div>
        )}

        {/* Logged in — no quote_request found */}
        {profile && !qr && (
          <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'20px', textAlign:'center' as const }}>
            <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.7)', margin:0 }}>
              This invitation was not sent to your account. Check you are logged in with the correct email.
            </p>
          </div>
        )}

        {/* Done state */}
        {done === 'accepted' && (
          <div style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'12px', padding:'24px', textAlign:'center' as const }}>
            <p style={{ fontSize:'20px', margin:'0 0 8px' }}>✓</p>
            <p style={{ fontSize:'15px', color:'#5AC99A', fontWeight:500, margin:'0 0 6px' }}>Request accepted</p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Redirecting to your dashboard…</p>
          </div>
        )}

        {done === 'declined' && (
          <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'24px', textAlign:'center' as const }}>
            <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.6)', margin:'0 0 8px' }}>Request declined</p>
            <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'#D4522A', textDecoration:'none' }}>Go to dashboard →</a>
          </div>
        )}

        {/* Action buttons */}
        {profile && qr && !done && (
          <div>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', textAlign:'center' as const, marginBottom:'16px' }}>
              {profile.tradie?.business_name} — do you want to accept this estimate request?
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button type="button" onClick={() => act('accepted')} disabled={acting}
                style={{ flex:1, background:'#2E7D60', color:'white', border:'none', borderRadius:'9px', padding:'14px', fontSize:'15px', fontWeight:600, cursor:'pointer', opacity: acting ? 0.7 : 1 }}>
                {acting ? 'Saving…' : '✓ Accept request'}
              </button>
              <button type="button" onClick={() => act('declined')} disabled={acting}
                style={{ flex:1, background:'rgba(255,255,255,0.05)', color:'rgba(216,228,225,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', padding:'14px', fontSize:'15px', cursor:'pointer', opacity: acting ? 0.7 : 1 }}>
                Decline
              </button>
            </div>
            <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.25)', textAlign:'center' as const, marginTop:'12px', lineHeight:'1.6' }}>
              Accepting will move this job to your dashboard. You can submit an estimate after a site consult.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
