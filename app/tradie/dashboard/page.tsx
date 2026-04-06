'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Next-action prompt per pipeline stage ────────────────────────────────────
function getNextAction(job: any, tradieUserId: string): {
  icon: string
  headline: string
  sub: string
  urgent: boolean
} {
  const myQR = job.quote_requests?.find((qr: any) => qr.tradie_id === tradieUserId)
  const isAssigned = !!job.tradie_id

  // Quote requested but not yet assigned
  if (!isAssigned && myQR?.status === 'requested') {
    return {
      icon: '📋',
      headline: 'Submit your quote',
      sub: 'Client is waiting — quotes close when they choose a tradie',
      urgent: true,
    }
  }

  switch (job.status) {
    case 'shortlisted':
      return {
        icon: '👋',
        headline: 'Introduce yourself',
        sub: 'Client has shortlisted you — send a message to stand out',
        urgent: true,
      }
    case 'assess':
      return {
        icon: '🏠',
        headline: 'Confirm site visit',
        sub: 'Arrange the assessment and record your observations',
        urgent: true,
      }
    case 'quote':
      return {
        icon: '💰',
        headline: 'Submit your quote',
        sub: 'Assessment done — price up the job and send it through',
        urgent: true,
      }
    case 'agreement':
      return {
        icon: '✍️',
        headline: 'Review and sign scope',
        sub: 'Client has accepted — check the scope agreement before work starts',
        urgent: true,
      }
    case 'delivery': {
      const done = job.milestones?.filter((m: any) => m.status === 'approved').length ?? 0
      const total = job.milestones?.length ?? 0
      const next = job.milestones?.find((m: any) => m.status === 'pending')
      return {
        icon: '🔧',
        headline: next ? `Complete: ${next.title}` : 'Log your progress',
        sub: total > 0 ? `${done} of ${total} milestones approved` : 'Update the client on where things are at',
        urgent: false,
      }
    }
    case 'signoff':
      return {
        icon: '🔍',
        headline: 'Arrange final walkthrough',
        sub: 'Work is done — schedule sign-off with the client to start the warranty clock',
        urgent: true,
      }
    case 'warranty':
      return {
        icon: '🛡',
        headline: 'Monitor warranty issues',
        sub: 'Respond to any issues logged within the SLA window',
        urgent: false,
      }
    case 'complete':
      return {
        icon: '✅',
        headline: 'Job complete',
        sub: 'Great work — this job has been signed off',
        urgent: false,
      }
    default:
      return {
        icon: '→',
        headline: 'View job',
        sub: '',
        urgent: false,
      }
  }
}

// ── Stage colours (border + badge) ───────────────────────────────────────────
const STAGE_COLOR: Record<string, string> = {
  shortlisted: '#2E6A8F',
  assess:      '#9B6B9B',
  quote:       '#C07830',
  agreement:   '#6B4FA8',
  delivery:    '#C07830',
  signoff:     '#D4522A',
  warranty:    '#1A6B5A',
  complete:    '#2E7D60',
}

const STAGE_LABEL: Record<string, string> = {
  shortlisted: 'Shortlisted',
  assess:      'Site assessment',
  quote:       'Awaiting quote',
  agreement:   'Awaiting signature',
  delivery:    'In delivery',
  signoff:     'Awaiting sign-off',
  warranty:    'Under warranty',
  complete:    'Complete',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TradieDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser]       = useState<any>(null)
  const [jobs, setJobs]       = useState<any[]>([])
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

      if (!prof || prof.role !== 'tradie') { window.location.href = '/dashboard'; return }

      setUser(session.user)
      setProfile(prof)

      const stripeRes  = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_account_status', tradie_id: session.user.id }),
      })
      const stripeData = await stripeRes.json()
      setStripeConnected(stripeData.connected || false)

      // Assigned jobs
      const { data: assignedJobs } = await supabase
        .from('jobs')
        .select('*, milestones(*), client:profiles!jobs_client_id_fkey(full_name, email, suburb), quote_requests(status, tradie_id)')
        .eq('tradie_id', session.user.id)
        .order('updated_at', { ascending: false })

      // Jobs where a quote was requested
      const { data: qrs } = await supabase
        .from('quote_requests')
        .select('job_id')
        .eq('tradie_id', session.user.id)

      const quotedJobIds = (qrs || []).map((q: any) => q.job_id)
      let quotedJobs: any[] = []
      if (quotedJobIds.length > 0) {
        const { data: qjData } = await supabase
          .from('jobs')
          .select('*, milestones(*), client:profiles!jobs_client_id_fkey(full_name, email, suburb), quote_requests(status, tradie_id)')
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
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading…</p>
    </div>
  )

  const activeJobs    = jobs.filter(j => j.status !== 'complete' && j.status !== 'cancelled')
  const completedJobs = jobs.filter(j => j.status === 'complete')
  const businessName  = profile?.tradie?.business_name || profile?.full_name

  // Sort: urgent (need action) first
  const sortedActive = [...activeJobs].sort((a, b) => {
    const aNext = getNextAction(a, user?.id)
    const bNext = getNextAction(b, user?.id)
    return (bNext.urgent ? 1 : 0) - (aNext.urgent ? 1 : 0)
  })

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>Tradie</span>
          <a href="/messages" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px' }}>Messages</a>
          <a href="/tradie/profile" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px' }}>My profile</a>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', color:'#1C2B32', padding:'7px 14px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background:'#1C2B32', padding:'40px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(46,125,96,0.2), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Tradie dashboard</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(20px, 4vw, 30px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>
            {businessName?.toUpperCase()}
          </h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', fontWeight:300 }}>
            {profile?.tradie?.trade_categories?.join(', ')} · {profile?.tradie?.service_areas?.[0]}
          </p>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>

        {/* ── Stats ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'28px' }}>
          {[
            { label:'Active jobs',     value: activeJobs.length },
            { label:'In delivery',     value: jobs.filter(j => j.status === 'delivery').length },
            { label:'Under warranty',  value: jobs.filter(j => j.status === 'warranty').length },
          ].map(s => (
            <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'6px' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#1C2B32', letterSpacing:'1px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Profile card ── */}
        {profile?.tradie && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'18px 20px', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)' }}>{profile.tradie.business_name?.charAt(0) || '?'}</span>
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:500, color:'#1C2B32', margin:'0 0 3px' }}>{profile.tradie.business_name}</p>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const }}>
                  {profile.tradie.licence_verified   && <span style={{ fontSize:'11px', color:'#2E7D60', background:'rgba(46,125,96,0.08)',   border:'1px solid rgba(46,125,96,0.2)',   borderRadius:'100px', padding:'2px 8px' }}>✓ Licence</span>}
                  {profile.tradie.insurance_verified && <span style={{ fontSize:'11px', color:'#2E7D60', background:'rgba(46,125,96,0.08)',   border:'1px solid rgba(46,125,96,0.2)',   borderRadius:'100px', padding:'2px 8px' }}>✓ Insurance</span>}
                  {profile.tradie.rating_avg > 0     && <span style={{ fontSize:'11px', color:'#4A5E64', background:'rgba(28,43,50,0.06)',    border:'1px solid rgba(28,43,50,0.1)',    borderRadius:'100px', padding:'2px 8px' }}>⭐ {Number(profile.tradie.rating_avg).toFixed(1)}</span>}
                  {!profile.tradie.licence_verified  && <span style={{ fontSize:'11px', color:'#C07830', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'100px', padding:'2px 8px' }}>Verification pending</span>}
                </div>
              </div>
            </div>
            <a href="/tradie/profile" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(46,106,143,0.3)', borderRadius:'6px', whiteSpace:'nowrap' as const }}>
              Edit profile →
            </a>
          </div>
        )}

        {/* ── Stripe banners ── */}
        {!stripeConnected && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' as const }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>Connect your bank account</p>
              <p style={{ fontSize:'12px', color:'#4A5E64' }}>Set up Stripe to receive milestone payments directly to your bank account.</p>
            </div>
            <button type="button" onClick={async () => {
              const res  = await fetch('/api/stripe', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ action:'create_connect_account', tradie_id: profile?.id, email: profile?.email }) })
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

        {/* ── Subscription pending banner ── */}
        {profile?.tradie?.subscription_active === false && (
          <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.25)', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' as const }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#D4522A', marginBottom:'4px' }}>Profile pending verification</p>
              <p style={{ fontSize:'12px', color:'#4A5E64' }}>Your licence and insurance are being verified. You'll be notified when your profile goes live.</p>
            </div>
          </div>
        )}

        {/* ── Active jobs ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', margin:0 }}>
            {activeJobs.length > 0 ? 'ACTIVE JOBS' : 'NO ACTIVE JOBS'}
          </h2>
          {activeJobs.some(j => getNextAction(j, user?.id).urgent) && (
            <span style={{ fontSize:'11px', color:'#D4522A', fontWeight:500, background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'100px', padding:'3px 10px' }}>
              {activeJobs.filter(j => getNextAction(j, user?.id).urgent).length} need action
            </span>
          )}
        </div>

        {activeJobs.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)', marginBottom:'32px' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>🔧</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No active jobs</p>
            <p style={{ fontSize:'13px', color:'#7A9098' }}>When a client selects you from the shortlist, jobs will appear here.</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'32px' }}>
          {sortedActive.map(job => {
            const myQR      = job.quote_requests?.find((qr: any) => qr.tradie_id === user?.id)
            const isDeclined = myQR?.status === 'declined'
            if (isDeclined) return null

            const next       = getNextAction(job, user?.id)
            const color      = STAGE_COLOR[job.status] || '#7A9098'
            const label      = STAGE_LABEL[job.status] || job.status

            const milestonesDone  = job.milestones?.filter((m: any) => m.status === 'approved').length ?? 0
            const milestonesTotal = job.milestones?.length ?? 0

            return (
              <a key={job.id} href={'/tradie/job?id=' + job.id} style={{ textDecoration:'none' }}>
                <div style={{
                  background: '#E8F0EE',
                  border: '1px solid rgba(28,43,50,0.1)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: '11px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                }}>
                  {/* Top row: title + stage badge */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const, marginBottom:'10px' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px', marginBottom:'3px' }}>{job.title}</div>
                      <div style={{ fontSize:'12px', color:'#7A9098' }}>{job.trade_category} · {job.suburb} · {job.client?.full_name}</div>
                    </div>
                    <span style={{ background: color + '18', border:`1px solid ${color}40`, borderRadius:'100px', padding:'4px 12px', fontSize:'11px', fontWeight:500, color, flexShrink:0 }}>
                      {label}
                    </span>
                  </div>

                  {/* Milestone bar (delivery stage) */}
                  {milestonesTotal > 0 && (
                    <div style={{ marginBottom:'10px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#7A9098', marginBottom:'4px' }}>
                        <span>Milestones</span>
                        <span>{milestonesDone}/{milestonesTotal} approved</span>
                      </div>
                      <div style={{ height:'4px', background:'rgba(28,43,50,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${milestonesTotal ? (milestonesDone/milestonesTotal)*100 : 0}%`, background: color, borderRadius:'2px', transition:'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {/* ── Next action prompt ── */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: next.urgent ? 'rgba(212,82,42,0.06)' : 'rgba(28,43,50,0.04)',
                    border: next.urgent ? '1px solid rgba(212,82,42,0.2)' : '1px solid rgba(28,43,50,0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}>
                    <span style={{ fontSize:'16px', lineHeight:1, flexShrink:0 }}>{next.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color: next.urgent ? '#D4522A' : '#1C2B32', margin:'0 0 1px' }}>{next.headline}</p>
                      {next.sub && <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{next.sub}</p>}
                    </div>
                    <span style={{ fontSize:'13px', color: next.urgent ? '#D4522A' : '#4A5E64', fontWeight:500, flexShrink:0 }}>→</span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {/* ── Completed ── */}
        {completedJobs.length > 0 && (
          <>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'14px' }}>COMPLETED</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {completedJobs.map(job => (
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