'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'
import Link from 'next/link'
import { OnboardingModal } from '@/components/ui/OnboardingModal'
import { ClientSetupModal } from '@/components/ui/ClientSetupModal'
import { ObservatoryWidget } from '@/components/ui/Observatory'

function getClientNextAction(job: any): { icon: string; headline: string; sub: string; urgent: boolean } {
  switch (job.status) {
    case 'matching':
    case 'shortlisted':
      return { icon: '👥', headline: 'Review your matches', sub: 'Tradies have been shortlisted - compare and invite one to quote', urgent: true }
    case 'consult':
      return { icon: '💬', headline: 'Arrange your site visit', sub: 'Message your tradie to agree on a time — all consult arrangements are kept in the job thread', urgent: true }
    case 'compare':
      return { icon: '⏳', headline: 'Waiting for your quote', sub: 'Your tradie is preparing a quote - you will be notified when it arrives', urgent: false }
    case 'quote':
      return { icon: '📊', headline: 'Review your quote', sub: 'Your tradie has submitted a quote — review and proceed to scope agreement when ready', urgent: true }
    case 'agreement': {
      const clientSigned = job.scope_agreements?.[0]?.client_signed_at
      const tradieSigned = job.scope_agreements?.[0]?.tradie_signed_at
      if (!tradieSigned) return { icon: '⏳', headline: 'Waiting for tradie to draft scope', sub: 'Your tradie is preparing the scope agreement', urgent: false }
      if (!clientSigned) return { icon: '✍️', headline: 'Sign the scope agreement', sub: 'Your tradie has drafted the scope - review and sign to start work', urgent: true }
      return { icon: '⏳', headline: 'Waiting for tradie to sign', sub: 'You have signed - waiting for your tradie to countersign', urgent: false }
    }
    case 'delivery': {
      const pendingMilestone = job.milestones?.find((m: any) => m.status === 'submitted')
      if (pendingMilestone) return { icon: '💳', headline: 'Milestone ready for approval', sub: 'Your tradie has submitted work - review and approve to release payment', urgent: true }
      return { icon: '🔨', headline: 'Work in progress', sub: 'Your tradie is on the job - you will be notified when a milestone is ready', urgent: false }
    }
    case 'signoff':
      return { icon: '✅', headline: 'Sign off on completion', sub: 'Work is complete - review and sign off to begin the warranty period', urgent: true }
    case 'warranty': {
      const warrantyEnd = job.warranty_ends_at ? new Date(job.warranty_ends_at) : null
      const daysLeft = warrantyEnd ? Math.ceil((warrantyEnd.getTime() - Date.now()) / 86400000) : 0
      return { icon: '🛡', headline: 'Warranty active', sub: daysLeft > 0 ? daysLeft + ' days remaining - log any issues through the job page' : 'Warranty period ending soon', urgent: false }
    }
    default:
      return { icon: '📋', headline: 'Continue your job', sub: 'Pick up where you left off', urgent: false }
  }
}


const CLIENT_STAGE_PATH: Record<string,string> = {
  draft:       '/request',
  matching:    '/shortlist',
  shortlisted: '/shortlist',
  consult:     '/consult',
  compare:     '/compare',
  quote:       '/compare',
  agreement:   '/agreement',
  delivery:    '/delivery',
  signoff:     '/signoff',
  warranty:    '/warranty',
  complete:    '/warranty',
}

const STAGES: Record<string, { label: string; path: string; color: string }> = {
  draft:       { label: 'Draft',          path: '/request',    color: '#7A9098' },
  matching:    { label: 'Matching',        path: '/shortlist',  color: '#2E6A8F' },
  shortlisted: { label: 'Match',           path: '/shortlist',  color: '#2E6A8F' },
  consult:     { label: 'Consult',         path: '/consult',    color: '#9B6B9B' },
  compare:     { label: 'Compare',         path: '/compare',    color: '#C07830' },
  agreement:   { label: 'Agreement',       path: '/agreement',  color: '#6B4FA8' },
  delivery:    { label: 'Delivery',        path: '/delivery',   color: '#C07830' },
  signoff:     { label: 'Sign off',        path: '/signoff',    color: '#D4522A' },
  warranty:    { label: 'Warranty',        path: '/warranty',   color: '#1A6B5A' },
  complete:    { label: 'Complete',        path: '/warranty',   color: '#2E7D60' },
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [cancelConfirmId, setCancelConfirmId] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [consults, setConsults] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [builds, setBuilds] = useState<any[]>([])
  const [showClientWizard, setShowClientWizard] = useState(false)
  const supabase = useSupabase()

  useEffect(() => {
    // Safety net - never hang on loading
    const loadingTimeout = setTimeout(() => setLoading(false), 5000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { clearTimeout(loadingTimeout); window.location.href = '/login'; return }

      setUser(session.user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (prof?.org_id) { window.location.href = '/org/dashboard'; return }
      // Skip onboarding modal for demo accounts
      if (prof?.is_demo) {
        localStorage.setItem('dismissed_client_setup', '1')
        await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id)
      }
      // Redirect tradie immediately before loading any job data
      if (prof && prof.role === 'tradie') {
        window.location.href = '/tradie/dashboard'
        return
      }
      setProfile(prof)
      // Parallelise independent queries
      const [{ data }, { data: buildsData }, { count: unreadTotal }] = await Promise.all([
        supabase.from('jobs')
          .select('*, tradie:tradie_profiles(business_name)')
          .eq('client_id', session.user.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false }),
        supabase.from('diy_projects')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('job_messages')
          .select('id', { count: 'exact', head: true })
          .neq('sender_id', session.user.id)
          .not('read_by', 'cs', JSON.stringify([session.user.id])),
      ])
      setJobs(data || [])
      setBuilds(buildsData || [])
      setUnreadCount(unreadTotal || 0)
      if (!prof?.full_name || !prof?.suburb) {
        // Only show setup wizard if they haven't explicitly completed or dismissed onboarding
        if (!prof?.onboarding_complete && typeof window !== 'undefined' && !localStorage.getItem('dismissed_client_setup')) {
          // Mark dismissed immediately to prevent loop on re-render
          await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id)
          setShowClientWizard(true)
          if (typeof window !== 'undefined') localStorage.setItem('dismissed_client_setup', '1')
        }
      } else if (typeof window !== 'undefined') {
        localStorage.setItem('seen_client_onboarding', '1')
      }

      // Assessments depend on job IDs so run after
      const jobIds = (data || []).map((j: any) => j.id)
      if (jobIds.length > 0) {
        const { data: assessments } = await supabase
          .from('site_assessments')
          .select('*, job:jobs(id, title, tradie:tradie_profiles(business_name))')
          .in('job_id', jobIds)
          .not('consult_date', 'is', null)
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const upcoming = (assessments || []).filter((a: any) => new Date(a.consult_date) > cutoff)
        upcoming.sort((a: any, b: any) => new Date(a.consult_date).getTime() - new Date(b.consult_date).getTime())
        setConsults(upcoming)
      }
      clearTimeout(loadingTimeout)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    // Poll for unread count every 30s rather than holding a persistent websocket
    // connection. Reduces Supabase realtime connections by ~80% at scale.
    let userId: string | null = null
    let interval: ReturnType<typeof setInterval> | null = null

    const refreshUnread = () => {
      if (!userId) return
      supabase.from('job_messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', userId)
        .not('read_by', 'cs', JSON.stringify([userId]))
        .then(({ count }) => setUnreadCount(count || 0))
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      userId = session.user.id
      refreshUnread()
      interval = setInterval(refreshUnread, 30000)
    })

    return () => { if (interval) clearInterval(interval) }
  }, [])


  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <div style={{ height:'64px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }} />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>
        {[1,2,3].map(i => (
          <div key={i} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px', marginBottom:'12px' }}>
            <div style={{ width:'60%', height:'16px', borderRadius:'6px', background:'linear-gradient(90deg, rgba(28,43,50,0.06) 25%, rgba(28,43,50,0.1) 50%, rgba(28,43,50,0.06) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', marginBottom:'10px' }} />
            <div style={{ width:'40%', height:'12px', borderRadius:'6px', background:'linear-gradient(90deg, rgba(28,43,50,0.06) 25%, rgba(28,43,50,0.1) 50%, rgba(28,43,50,0.06) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
          </div>
        ))}
      </div>
    </div>
  )

  const cancelableStatuses = ['matching', 'shortlisted', 'compare', 'draft', 'consult', 'quote']

  const cancelJob = async (jobId: string, jobTitle: string) => {
    if (cancelConfirmId !== jobId) { setCancelConfirmId(jobId); return }
    setCancelConfirmId(null)
    const { data: { session } } = await supabase.auth.getSession()
    // Check if scope has been signed — warn client
    const { data: scope } = await supabase
      .from('scope_agreements')
      .select('tradie_signed_at, client_signed_at')
      .eq('job_id', jobId)
      .single()
    const scopeSigned = scope?.tradie_signed_at && scope?.client_signed_at
    if (scopeSigned) {
      const ok = window.confirm(
        'Warning: both parties have signed a scope agreement for this job. ' +
        'Cancelling at this stage may have legal and financial implications. ' +
        'The signed scope agreement will remain in your compliance archive as evidence. ' +
        'Are you sure you want to cancel?'
      )
      if (!ok) { setCancelConfirmId(null); return }
    }
    await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', jobId)
    await supabase.from('job_messages').insert({
      job_id: jobId,
      sender_id: session?.user.id,
      body: 'This job has been cancelled by the client.',
    })
    // Notify any tradies with quote requests
    const { data: qrs } = await supabase.from('quote_requests').select('tradie_id').eq('job_id', jobId)
    if (qrs && qrs.length > 0) {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'job_cancelled', job_id: jobId }),
      }).catch(console.error)
    }
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'cancelled' } : j))
  }

  const activeJobs = jobs.filter(j => j.status !== 'complete' && j.status !== 'cancelled')
  const quotesSent = jobs.filter(j => j.quote_request_sent_at).length
  const isHomeMember = profile?.subscription_plan === 'home' || quotesSent < 3
  const atQuoteLimit = quotesSent >= 3 && !isHomeMember
  const doneJobs = jobs.filter(j => j.status === 'complete' || j.status === 'cancelled')

  const justSubmitted = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('submitted') === 'true'

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      {justSubmitted && (
        <div style={{ background:'#2E7D60', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
          <p style={{ fontSize:'13px', color:'white', margin:0, fontWeight:500 }}>✓ Your job request has been submitted - Steadyhand is building your shortlist now.</p>
          <a href="/shortlist" style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)', textDecoration:'none', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', padding:'4px 10px', flexShrink:0 }}>View shortlist →</a>
        </div>
      )}
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <a href="/messages" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
            Messages
            {unreadCount > 0 && <span style={{ background:'#D4522A', color:'white', borderRadius:'100px', fontSize:'10px', fontWeight:700, padding:'1px 6px', lineHeight:'1.4' }}>{unreadCount}</span>}
          </a>
          <div style={{ position:'relative' as const }}>
            <div onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'white', flexShrink:0, userSelect:'none' as const }}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {dropdownOpen && (
              <div style={{ position:'absolute' as const, right:0, top:'44px', background:'white', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'10px', boxShadow:'0 8px 24px rgba(28,43,50,0.12)', minWidth:'200px', zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#F4F8F7' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>{profile?.full_name || 'My account'}</p>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{user?.email}</p>
                </div>
                {[
                  { label:'Dashboard', href:'/dashboard' },
                  { label:'Steadyhand Home', href:'/home-plan' },
                  { label:'Document vault', href:'/vault' },
                  { label:'Property Journal', href:'/diy' },
                  ...(profile?.is_admin ? [{ label:'Admin Panel', href:'/admin' }] : []),
                  { label:'Messages', href:'/messages' },
                  { label:'Organisation dashboard', href:'/org/dashboard' },
                  { label:'Help & support', href:'/help' },
                ].map(item => (
                  <a key={item.href} href={item.href} onClick={() => setDropdownOpen(false)}
                    style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    {item.label}
                  </a>
                ))}
                <button onClick={() => { setDropdownOpen(false); signOut() }}
                  style={{ display:'block', width:'100%', padding:'10px 14px', fontSize:'13px', color:'#D4522A', textAlign:'left' as const, background:'none', border:'none', cursor:'pointer' }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ background:'#0A0A0A', padding:'28px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,82,42,0.12), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Client dashboard</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(24px, 5vw, 36px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>STEADYHAND</h1>
          <p style={{ fontSize:'13px', color:'#D4522A', fontWeight:300 }}>Request-to-warranty · Western Australia</p>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>
        <div className="dashboard-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'12px', marginBottom:'28px' }}>
          {[
            { label:'Active jobs', value: activeJobs.length },
            { label:'Under warranty', value: jobs.filter(j => j.status === 'warranty').length },
            { label:'Complete', value: doneJobs.length },
          ].map(s => (
            <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'6px' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#0A0A0A', letterSpacing:'1px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {consults.length > 0 && (
          <div style={{ marginBottom:'20px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'12px' }}>CONSULTS</h2>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {consults.map((a: any) => {
                const date = new Date(a.consult_date)
                const isPast = date < new Date()
                const isConfirmed = !!a.slot_confirmed_at
                const isToday = date.toDateString() === new Date().toDateString()
                return (
                  <a key={a.id} href="/consult" style={{ textDecoration:'none' }}>
                    <div style={{ background:'#E8F0EE', border:'1px solid ' + (isToday ? 'rgba(155,107,155,0.4)' : 'rgba(28,43,50,0.1)'), borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'8px', background: isToday ? 'rgba(155,107,155,0.12)' : 'rgba(28,43,50,0.06)', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <p style={{ fontSize:'16px', fontWeight:700, color: isToday ? '#9B6B9B' : '#0A0A0A', margin:0, lineHeight:1 }}>{date.getDate()}</p>
                        <p style={{ fontSize:'9px', color:'#7A9098', margin:0, textTransform:'uppercase' as const }}>{date.toLocaleDateString('en-AU', { month:'short' })}</p>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{a.job?.title}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>
                          {a.job?.tradie?.business_name} · {date.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
                          {!isConfirmed && <span style={{ color:'#C07830', marginLeft:'6px' }}>· Awaiting confirmation</span>}
                          {isPast && <span style={{ color:'#7A9098', marginLeft:'6px' }}>· Completed</span>}
                        </p>
                      </div>
                      <span style={{ fontSize:'18px' }}>{isToday ? '📅' : isPast ? '✓' : '📋'}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {profile && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'18px 20px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)' }}>{profile.full_name?.charAt(0) || '?'}</span>
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{profile.full_name || 'Your name'}</p>
                <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                  {[profile.suburb, profile.property_type, profile.bedrooms ? profile.bedrooms + ' bed' : null].filter(Boolean).join(' · ') || 'Complete your profile →'}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {(!profile.phone || !profile.suburb || !profile.property_type) && (
                <span style={{ fontSize:'11px', color:'#C07830', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'100px', padding:'3px 10px' }}>
                  Profile incomplete
                </span>
              )}
              <a href="/profile" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(46,106,143,0.3)', borderRadius:'6px', whiteSpace:'nowrap' as const }}>
                Edit profile →
              </a>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION CARD */}
        <Link href="/home-plan" style={{ textDecoration:'none', display:'block', marginBottom:'12px' }}>
          <div style={{ background: profile?.subscription_plan === 'home' ? '#0A0A0A' : '#E8F0EE', border: profile?.subscription_plan === 'home' ? '2px solid #2E7D60' : '1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background: profile?.subscription_plan === 'home' ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🏠</div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color: profile?.subscription_plan === 'home' ? 'rgba(216,228,225,0.9)' : '#0A0A0A', margin:'0 0 2px' }}>
                  {profile?.subscription_plan === 'home' ? 'Steadyhand Home - Active' : 'Steadyhand Home'}
                </p>
                <p style={{ fontSize:'12px', color: profile?.subscription_plan === 'home' ? 'rgba(216,228,225,0.45)' : '#7A9098', margin:0 }}>
                  {profile?.subscription_plan === 'home' ? 'Extended warranty · Document vault · Priority matching' : 'Unlimited jobs · 180-day warranty · Document vault · $19/month'}
                </p>
              </div>
            </div>
            <span style={{ fontSize:'12px', color: profile?.subscription_plan === 'home' ? '#2E7D60' : '#D4522A', fontWeight:500, flexShrink:0 }}>
              {profile?.subscription_plan === 'home' ? '✓ Active' : profile?.subscription_plan === 'home_interest' ? 'Interest logged' : 'Learn more →'}
            </span>
          </div>
        </Link>

        {/* Demo mode banner */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1' && (
        <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
          <div style={{ fontSize:'20px', flexShrink:0 }}>👋</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', margin:'0 0 4px' }}>You&apos;re exploring with demo data</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:'0 0 10px' }}>
              Three sample jobs have been added to your account — one in delivery, one waiting for scope signing, and one under warranty with an open issue. Click through each stage to see how the platform works. Delete them anytime from each job page.
            </p>
            <a href="/request" style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, textDecoration:'none' }}>Post your first real job →</a>
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div style={{ background:'#2E7D60', borderRadius:'14px', padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'20px' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'white', letterSpacing:'1px', marginBottom:'4px' }}>START A NEW REQUEST</h2>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>Describe the work, invite a tradie you trust, set the scope.</p>
          </div>
          <a href="/request" style={{ background:'white', color:'#2E7D60', padding:'13px 24px', borderRadius:'10px', fontSize:'14px', fontWeight:600, textDecoration:'none', fontFamily:'var(--font-aboreto), sans-serif', letterSpacing:'1px', whiteSpace:'nowrap' as const }}>
            NEW REQUEST
          </a>
        </div>
        )}

        {activeJobs.length > 0 && (
          <div style={{ marginBottom:'28px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'14px' }}>ACTIVE JOBS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {activeJobs.map(job => {
                const stage = STAGES[job.status] || STAGES.draft
                return (
                  <a key={job.id} href={(CLIENT_STAGE_PATH[job.status] || '/jobs/' + job.id) + '?job_id=' + job.id} style={{ textDecoration:'none' }}>
                    {(() => {
                      const next = getClientNextAction(job)
                      return (
                        <div style={{ background: next.urgent ? '#0A0A0A' : '#E8F0EE', border:'1px solid ' + (next.urgent ? 'transparent' : 'rgba(28,43,50,0.1)'), borderLeft:'3px solid ' + stage.color, borderRadius:'11px', overflow:'hidden', transition:'background 0.15s', cursor:'pointer' }}>
                          <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', borderBottom:'1px solid ' + (next.urgent ? 'rgba(255,255,255,0.06)' : 'rgba(28,43,50,0.06)') }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color: next.urgent ? 'rgba(216,228,225,1)' : '#0A0A0A', letterSpacing:'0.3px' }}>{job.title}</div>
                                {(() => { const hrs = (Date.now() - new Date(job.updated_at).getTime()) / 3600000; return hrs < 24 ? <span style={{ fontSize:'10px', color:'#2E7D60', background:'rgba(46,125,96,0.12)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'1px 7px', flexShrink:0 }}>Updated</span> : null })()}
                              </div>
                              <div style={{ fontSize:'11px', color: next.urgent ? 'rgba(216,228,225,0.6)' : '#7A9098' }}>{job.trade_category} · {job.suburb}{job.tradie?.business_name ? ' · ' + job.tradie.business_name : ''}</div>
                            </div>
                            <span style={{ fontSize:'11px', fontWeight:500, color: stage.color, background: next.urgent ? 'rgba(255,255,255,0.06)' : 'rgba(28,43,50,0.05)', padding:'3px 10px', borderRadius:'100px', flexShrink:0 }}>{stage.label}</span>
                          </div>
                          <div style={{ padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
                              <span style={{ fontSize:'18px', flexShrink:0 }}>{next.icon}</span>
                              <div style={{ minWidth:0 }}>
                                <p style={{ fontSize:'13px', fontWeight:600, color: next.urgent ? 'rgba(216,228,225,1)' : '#0A0A0A', margin:'0 0 2px' }}>{next.headline}</p>
                                <p style={{ fontSize:'12px', color: next.urgent ? 'rgba(216,228,225,0.7)' : '#7A9098', margin:0, lineHeight:'1.4' }}>{next.sub}</p>
                              </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                              {next.urgent && <span style={{ fontSize:'11px', color:'#D4522A', background:'rgba(212,82,42,0.15)', border:'1px solid rgba(212,82,42,0.3)', borderRadius:'100px', padding:'3px 10px', whiteSpace:'nowrap' as const }}>Action needed</span>}
                              <span style={{ fontSize:'14px', color: next.urgent ? 'rgba(216,228,225,0.7)' : '#7A9098' }}>→</span>
                              {cancelableStatuses.includes(job.status) && (
                                <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); cancelJob(job.id, job.title) }}
                                  style={{ fontSize:'11px', color:'#9AA5AA', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'5px', padding:'3px 8px', cursor:'pointer' }}>
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {jobs.length === 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'24px' }}>
            <div style={{ background:'#0A0A0A', padding:'20px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 50%, rgba(212,82,42,0.15), transparent 60%)' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 4px' }}>YOUR FIRST JOB</p>
                <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>From first request to 90-day warranty — guided at every stage</p>
              </div>
            </div>
            <div style={{ padding:'24px' }}>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65', marginBottom:'20px' }}>
                Steadyhand stays with you from the first request through to a signed scope, staged payments, and a 90-day warranty — with a permanent document record the whole way. Nothing proceeds until both parties agree.
              </p>
              {/* Pipeline diagram */}
              <div style={{ marginBottom:'20px', overflowX:'auto' as const }}>
                <svg width="100%" viewBox="0 0 600 80" style={{ minWidth:'320px' }}>
                  {/* Step boxes */}
                  {[
                    { x:0,   label:'Request',  sub:'Describe the work' },
                    { x:150, label:'Match',     sub:'Verified tradies' },
                    { x:300, label:'Scope',     sub:'Both parties sign' },
                    { x:450, label:'Warranty',  sub:'90-day protection' },
                  ].map((s, i) => (
                    <g key={s.label}>
                      <rect x={s.x} y={8} width={130} height={52} rx={8}
                        fill="white" stroke="rgba(28,43,50,0.1)" strokeWidth={1}/>
                      <text x={s.x+65} y={30} textAnchor="middle"
                        style={{ fontSize:'12px', fontWeight:600, fill:'#0A0A0A', fontFamily:'sans-serif' }}>{s.label}</text>
                      <text x={s.x+65} y={47} textAnchor="middle"
                        style={{ fontSize:'11px', fill:'#7A9098', fontFamily:'sans-serif' }}>{s.sub}</text>
                      {i < 3 && (
                        <line x1={s.x+130} y1={34} x2={s.x+148} y2={34}
                          stroke="#D4522A" strokeWidth={1.5}
                          markerEnd="url(#arr)"/>
                      )}
                    </g>
                  ))}
                  <defs>
                    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M2 1L8 5L2 9" fill="none" stroke="#D4522A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                    </marker>
                  </defs>
                </svg>
              </div>
              <a href="/request">
                <button style={{ width:'100%', background:'#D4522A', color:'white', padding:'14px', borderRadius:'8px', fontSize:'15px', fontWeight:500, border:'none', cursor:'pointer', fontFamily:'var(--font-aboreto), sans-serif', letterSpacing:'0.5px' }}>
                  POST YOUR FIRST REQUEST →
                </button>
              </a>
            </div>
          </div>
        )}

        {doneJobs.length > 0 && (
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'14px' }}>COMPLETED JOBS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {doneJobs.map(job => (
                <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #2E7D60', borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', opacity:0.7 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.3px' }}>{job.title}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{job.trade_category} · {job.suburb}</div>
                  </div>
                  <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60' }}>Complete</span>
                </div>
              ))}
            </div>
          </div>
        )}





                {/* BUILD YOUR CAPABILITY */}
        <div style={{ marginTop:'32px', marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'1px', margin:0 }}>BUILD YOUR CAPABILITY</h2>
            <a href="https://www.steadyhanddigital.com" target="_blank" style={{ fontSize:'12px', color:'#7A9098', textDecoration:'none' }}>About our approach →</a>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'12px' }}>
            {[
              { icon:'📋', title:'Understanding your rights', body:'Consumer Protection WA outlines your rights when hiring a licensed tradie. Know what you are entitled to before you sign anything.', href:'https://www.commerce.wa.gov.au/consumer-protection', label:'Consumer Protection WA →' },
              { icon:'💬', title:'How to read a trade quote', body:'A good quote itemises labour, materials and conditions separately. Learn what to look for - and what missing information signals.', href:'https://www.steadyhanddigital.com', label:'Steadyhand guide →' },
              { icon:'🔒', title:'What a scope agreement means', body:'A signed scope is your most important protection. It defines what is included, what is not, and what happens if something changes.', href:'https://www.steadyhanddigital.com', label:'Learn more →' },
              { icon:'🏗', title:'WA Building Commission', body:'If your job requires a building permit or involves licensed trades, the Building Commission sets the compliance standards that apply.', href:'https://www.buildingcommission.com.au', label:'Building Commission WA →' },
            ].map(c => (
              <a key={c.title} href={c.href} target="_blank" style={{ textDecoration:'none' }}>
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px', height:'100%', cursor:'pointer' }}>
                  <div style={{ fontSize:'22px', marginBottom:'8px' }}>{c.icon}</div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', marginBottom:'5px' }}>{c.title}</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'10px' }}>{c.body}</p>
                  <p style={{ fontSize:'12px', color:'#2E6A8F', margin:0 }}>{c.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop:'36px' }}>
          {/* HOME HUB HEADER */}
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'12px' }}>YOUR HOME</h2>

          {/* HUB CARDS */}
          {!isHomeMember && (
            <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
              <div>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#D4522A', margin:'0 0 2px' }}>Steadyhand Home features</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Property Journal, Document Vault and Transaction History are included in the Steadyhand Home plan.</p>
              </div>
              <a href="/home-plan" style={{ fontSize:'12px', color:'#D4522A', fontWeight:500, textDecoration:'none', flexShrink:0, border:'1px solid rgba(212,82,42,0.3)', borderRadius:'6px', padding:'6px 12px' }}>Upgrade →</a>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', opacity: isHomeMember ? 1 : 0.4, pointerEvents: isHomeMember ? 'auto' : 'none' as const }}>

            {/* Property Journal */}
            {/* Observatory widget */}
            <div style={{ marginBottom:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#7A9098', fontWeight:500, margin:0 }}>WA Trade Data Tracker</p>
                <a href="/observatory" style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>Full observatory →</a>
              </div>
              <ObservatoryWidget />
            </div>

            <a href="/diy" style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #D4522A', borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.3px', margin:'0 0 3px' }}>Property Journal</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Trades, permits, tasks, budget and WA compliance.</p>
                </div>
                <span style={{ fontSize:'13px', color:'#7A9098' }}>→</span>
              </div>
            </a>

            {/* Document Vault */}
            <a href="/vault" style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #2E7D60', borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.3px', margin:'0 0 3px' }}>Document Vault</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Scope agreements, warranties and certificates.</p>
                </div>
                <span style={{ fontSize:'13px', color:'#7A9098' }}>→</span>
              </div>
            </a>

            {/* Transaction History */}
            <a href="/wallet" style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #C07830', borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.3px', margin:'0 0 3px' }}>Transaction History</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Quotes, milestone payments and invoice history.</p>
                </div>
                <span style={{ fontSize:'13px', color:'#7A9098' }}>→</span>
              </div>
            </a>

            {/* Legal record */}
            <a href="/how-it-works" style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #534AB7', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>HOW IT WORKS</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>What gets created at each stage</p>
                </div>
                <span style={{ fontSize:'13px', color:'#7A9098' }}>→</span>
              </div>
            </a>

            {/* Job History */}
            <a href="/job/history" style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #6B4FA8', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>JOB HISTORY</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Full audit trail and timeline for every job</p>
                </div>
                <span style={{ fontSize:'13px', color:'#7A9098' }}>→</span>
              </div>
            </a>

          </div>
        </div>
      </div>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'24px', borderTop:'1px solid rgba(28,43,50,0.08)', display:'flex', gap:'16px', justifyContent:'center' }}>
        <a href="/terms" style={{ fontSize:'11px', color:'#9AA5AA', textDecoration:'none' }}>Terms of Service</a>
        <a href="/privacy" style={{ fontSize:'11px', color:'#9AA5AA', textDecoration:'none' }}>Privacy Policy</a>
        <span style={{ fontSize:'11px', color:'#9AA5AA' }}>© 2026 Steadyhand Digital Pty Ltd</span>
      </div>
      {/* ── Client setup wizard ── */}
      {showClientWizard && (
        <ClientSetupModal
          userId={user?.id || ''}
          onDismiss={() => { if (typeof window !== "undefined") localStorage.setItem("dismissed_client_setup", "1"); setShowClientWizard(false) }}
            onComplete={async (fullName: string, suburb: string) => {
            const supabase = createClient()
            await supabase.from('profiles').update({ full_name: fullName, suburb, onboarding_complete: true }).eq('id', user?.id)
            if (typeof window !== 'undefined') localStorage.setItem('seen_client_onboarding', '1')
            setShowClientWizard(false)
            window.location.reload()
          }}
        />
      )}
      {false && showClientWizard && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(28,43,50,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'520px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
            <div style={{ background:'#0A0A0A', padding:'20px 28px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:0 }}>WELCOME TO STEADYHAND</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>A few things to get you started</p>
            </div>
            <div style={{ padding:'28px' }}>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'24px' }}>
                {[
                  {
                    done: !!(profile?.full_name && profile?.suburb),
                    label: 'Complete your profile',
                    sub: 'Your name, suburb and property details',
                    href: '/profile?required=true',
                    cta: 'Complete →'
                  },
                  {
                    done: jobs.length > 0,
                    label: 'Post your first job request',
                    sub: 'Describe the work - invite a tradie you trust to quote',
                    href: '/request',
                    cta: 'Start a request →'
                  },
                  {
                    done: isHomeMember,
                    label: 'Explore Steadyhand Home',
                    sub: 'Property Journal, Document Vault and extended warranty - $19/month',
                    href: '/home-plan',
                    cta: 'Learn more →'
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', background: item.done ? 'rgba(46,125,96,0.06)' : 'white', border:'1px solid ' + (item.done ? 'rgba(46,125,96,0.2)' : 'rgba(28,43,50,0.1)'), borderRadius:'10px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: item.done ? '#2E7D60' : 'rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>
                      {item.done ? '✓' : (i + 1)}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color: item.done ? '#2E7D60' : '#0A0A0A', margin:'0 0 2px' }}>{item.label}</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{item.sub}</p>
                    </div>
                    {!item.done && (
                      <a href={item.href} style={{ fontSize:'12px', color:'#2E6A8F', fontWeight:500, textDecoration:'none', flexShrink:0 }}>{item.cta}</a>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => {
                ;(async () => { await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user?.id) })()
                setShowClientWizard(false)
              }} style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to my dashboard →
              </button>
              <p style={{ fontSize:'11px', color:'#9AA5AA', textAlign:'center' as const, marginTop:'12px' }}>You can complete these steps any time from your dashboard</p>
            </div>
          </div>
        </div>
      )}

      <OnboardingModal storageKey="seen_client_onboarding" slides={[
        {
          icon: '🏠',
          title: 'You\'re in — let\'s get your first job started',
          body: 'Getting work done on your home shouldn\'t be stressful. Steadyhand stays with you from your first request all the way through to your 90-day warranty - so you always know what\'s happening and what happens next.',
        },
        {
          icon: '📋',
          title: 'Start with a request',
          body: 'Describe the job in your own words. Steadyhand uses this to match you with verified trade businesses in your area - no lead fees, no bidding wars.',
        },
        {
          icon: '✅',
          title: 'No unverified tradies',
          body: 'Every trade business on Steadyhand has their licence and insurance verified before they can appear in your shortlist. You won\'t be matched with someone we haven\'t checked.',
        },
        {
          icon: '💳',
          title: 'Pay in milestones',
          body: 'You only release payment when you\'re satisfied each stage is complete. Steadyhand takes 3.5% - only when the tradie gets paid.',
        },
      ]} />
    </div>
  )
}