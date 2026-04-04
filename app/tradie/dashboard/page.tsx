'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGE_LABELS: Record<string, { label: string; color: string; action: string }> = {
  agreement:   { label: 'Awaiting signature',  color: '#6B4FA8', action: 'Review scope' },
  delivery:    { label: 'In delivery',          color: '#C07830', action: 'Update progress' },
  signoff:     { label: 'Awaiting sign-off',    color: '#D4522A', action: 'Awaiting client' },
  warranty:    { label: 'Under warranty',       color: '#1A6B5A', action: 'View issues' },
  complete:    { label: 'Complete',             color: '#2E7D60', action: 'View' },
}

export default function TradieDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeConnected, setStripeConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, tradie:tradie_profiles(*)')
        .eq('id', session.user.id)
        .single()

      if (!prof || prof.role !== 'tradie') {
        window.location.href = '/dashboard'
        return
      }
      setProfile(prof)

      const stripeRes = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_account_status', tradie_id: session.user.id }),
      })
      const stripeData = await stripeRes.json()
      setStripeConnected(stripeData.connected || false)


      const { data: assignedJobs } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
        .eq('tradie_id', session.user.id)
        .order('updated_at', { ascending: false })

      const { data: qrs } = await supabase
        .from('quote_requests')
        .select('job_id')
        .eq('tradie_id', session.user.id)

      const quotedJobIds = (qrs || []).map((q: any) => q.job_id)
      let quotedJobs: any[] = []
      if (quotedJobIds.length > 0) {
        const { data: qjData } = await supabase
          .from('jobs')
          .select('*, client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
          .in('id', quotedJobIds)
          .order('updated_at', { ascending: false })
        quotedJobs = qjData || []
      }

      const assignedIds = new Set((assignedJobs || []).map((j: any) => j.id))
      const merged = [...(assignedJobs || []), ...quotedJobs.filter((j: any) => !assignedIds.has(j.id))]

      setJobs(merged)
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const activeJobs = jobs.filter(j => j.status !== 'complete')
  const businessName = profile?.tradie?.business_name || profile?.full_name

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>Tradie</span>
          <a href="/messages" style={{ fontSize:'13px', color:'rgba(216,228,225,0.6)', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'6px' }}>Messages</a>
<button onClick={signOut} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', color:'#1C2B32', padding:'7px 14px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ background:'#1C2B32', padding:'40px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(46,125,96,0.2), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Tradie dashboard</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(20px, 4vw, 30px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>{businessName?.toUpperCase()}</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', fontWeight:300 }}>{profile?.tradie?.trade_categories?.join(', ')} · {profile?.tradie?.service_areas?.[0]}</p>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>

        <div className="dashboard-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'28px' }}>
          {[
            { label:'Active jobs', value: activeJobs.length },
            { label:'In delivery', value: jobs.filter(j => j.status === 'delivery').length },
            { label:'Under warranty', value: jobs.filter(j => j.status === 'warranty').length },
          ].map(s => (
            <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'6px' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#1C2B32', letterSpacing:'1px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {!stripeConnected && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' as const }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>Connect your bank account</p>
              <p style={{ fontSize:'12px', color:'#4A5E64' }}>Set up Stripe to receive milestone payments directly to your bank account.</p>
            </div>
            <button type="button" onClick={async () => {
              const res = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_connect_account', tradie_id: profile?.id, email: profile?.email }),
              })
              const data = await res.json()
              if (data.url) window.location.href = data.url
            }} style={{ background:'#2E7D60', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
              Connect with Stripe →
            </button>
          </div>
        )}
        {stripeConnected && (
          <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'12px 16px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500 }}>✓ Stripe connected — payments will be deposited directly to your bank</span>
          </div>
        )}
{profile?.tradie?.subscription_active === false && (
          <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.25)', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#D4522A', marginBottom:'4px' }}>Profile pending verification</p>
              <p style={{ fontSize:'12px', color:'#4A5E64' }}>Your licence and insurance are being verified. You'll be notified when your profile goes live.</p>
            </div>
          </div>
        )}

        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'14px' }}>
          {activeJobs.length > 0 ? 'ACTIVE JOBS' : 'NO ACTIVE JOBS'}
        </h2>

        {activeJobs.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>🔧</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No active jobs</p>
            <p style={{ fontSize:'13px', color:'#7A9098' }}>When a client selects you from the shortlist, jobs will appear here.</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'32px' }}>
          {activeJobs.map(job => {
            const stage = STAGE_LABELS[job.status]
            return (
              <a key={job.id} href={'/tradie/job?id=' + job.id} style={{ textDecoration:'none' }}>
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid ' + (stage?.color || '#7A9098'), borderRadius:'11px', padding:'18px 20px', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px', marginBottom:'4px' }}>{job.title}</div>
                      <div style={{ fontSize:'12px', color:'#7A9098', marginBottom:'8px' }}>{job.trade_category} · {job.suburb} · {job.client?.full_name}</div>
                      <div style={{ fontSize:'12px', color:'#4A5E64' }}>{job.description?.slice(0, 100)}{job.description?.length > 100 ? '...' : ''}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0 }}>
                      <span style={{ background: (stage?.color || '#7A9098') + '18', border:'1px solid ' + (stage?.color || '#7A9098') + '40', borderRadius:'100px', padding:'4px 12px', fontSize:'11px', fontWeight:500, color: stage?.color || '#7A9098' }}>
                        {stage?.label || job.status}
                      </span>
                      <span style={{ fontSize:'12px', color:'#D4522A', fontWeight:500 }}>{stage?.action} →</span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {jobs.filter(j => j.status === 'complete').length > 0 && (
          <>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'14px' }}>COMPLETED</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {jobs.filter(j => j.status === 'complete').map(job => (
                <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #2E7D60', borderRadius:'11px', padding:'16px 20px', opacity:0.7, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32' }}>{job.title}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{job.trade_category} · {job.suburb}</div>
                  </div>
                  <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60' }}>Complete</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}