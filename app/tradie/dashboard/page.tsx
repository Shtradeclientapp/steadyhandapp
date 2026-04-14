'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OnboardingModal } from '@/components/ui/OnboardingModal'

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
    const hasQuote = job.quotes && job.quotes.length > 0
    if (hasQuote) {
      return {
        icon: '⏳',
        headline: 'Waiting for client to accept',
        sub: 'Your quote has been submitted — the client is comparing options',
        urgent: false,
      }
    }
    return {
      icon: '📋',
      headline: 'Submit your quote',
      sub: 'Client is waiting — review the job and send your quote',
      urgent: true,
    }
  }

  switch (job.status) {
    case 'shortlisted':
      return {
        icon: '👋',
        headline: 'Quote requested',
        sub: 'You have been shortlisted — visit the job to propose a consult time or submit a quote',
        urgent: true,
      }
    case 'assess':
      return {
        icon: '🏠',
        headline: 'Complete site consult',
        sub: 'Propose times, visit the site, then record your observations in the Consult page',
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
  assess:      'Consult',
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
  const [consults, setConsults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [xeroConnected, setXeroConnected] = useState(false)
  const [xeroTenant, setXeroTenant] = useState<string|null>(null)
  const [xeroDisconnecting, setXeroDisconnecting] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)

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

      // Check Xero connection status
      const xeroRes = await fetch('/api/xero/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id }),
      })
      const xeroData = await xeroRes.json()
      setXeroConnected(xeroData.connected || false)
      if (xeroData.tenant_name) setXeroTenant(xeroData.tenant_name)

      const stripeRes  = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_account_status', tradie_id: session.user.id }),
      })
      const stripeData = await stripeRes.json()
      setStripeConnected(stripeData.connected || false)
      // Show setup wizard if profile incomplete or subscription inactive
      if (typeof window !== 'undefined' && !localStorage.getItem('tradie_setup_complete')) {
        setShowSetupWizard(true)
      }

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
      // Count unread messages
      const { count: unreadTotal } = await supabase
        .from('job_messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', session.user.id)
        .not('read_by', 'cs', JSON.stringify([session.user.id]))
      setUnreadCount(unreadTotal || 0)

      const allJobIds = merged.map((j: any) => j.id)
      if (allJobIds.length > 0) {
        const supabase2 = (await import('@/lib/supabase/client')).createClient()
        const { data: assessments } = await supabase2
          .from('site_assessments')
          .select('*, job:jobs(id, title, client:profiles!jobs_client_id_fkey(full_name))')
          .in('job_id', allJobIds)
          .not('consult_date', 'is', null)
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const upcoming = (assessments || []).filter((a: any) => new Date(a.consult_date) > cutoff)
        upcoming.sort((a: any, b: any) => new Date(a.consult_date).getTime() - new Date(b.consult_date).getTime())
        setConsults(upcoming)
      }
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

  const tradieSlides = [
    {
      icon: '👋',
      title: 'Welcome to Steadyhand',
      body: 'When a client selects you from their shortlist, a quote request lands on your dashboard. From there, Steadyhand guides both of you through consult, scope, milestones and warranty — step by step.',
    },
    {
      icon: '📋',
      title: 'The consult comes first',
      body: 'Before you submit a quote, visit the site and record your observations here. The client does the same independently. Both records are locked and shared — creating a tamper-proof baseline before any money changes hands.',
      sub: 'Tradies who complete consults consistently receive higher Dialogue Ratings.',
    },
    {
      icon: '✍️',
      title: 'Scope, then work',
      body: 'Once your quote is accepted, Steadyhand drafts a scope agreement. Both parties sign digitally before work begins. Milestones are set, and payment releases automatically when the client approves each stage.',
    },
    {
      icon: '⭐',
      title: 'Your Dialogue Rating',
      body: 'Your Dialogue Rating is your professional reputation on Steadyhand. It reflects how clearly and transparently you communicate — on pricing, risk, timeline and scope. It builds with every job and is visible to future clients.',
    },
  ]

  return (
    <>
      {/* Quick action links */}
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'12px 24px', display:'flex', gap:'8px', flexWrap:'wrap', background:'#C8D5D2' }}>
        {[
          { label:'+ Invite a client', href:'/tradie/lead' },
          { label:'Availability status', href:'/tradie/availability' },
          { label:'Dialogue Rating', href:'/tradie/dialogue' },
        ].map(l => (
          <a key={l.href} href={l.href} style={{ fontSize:'13px', color:'#1C2B32', background:'#E8F0EE', border:'1.5px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 16px', textDecoration:'none', fontWeight:500 }}>{l.label}</a>
        ))}
      </div>

      <OnboardingModal storageKey="seen_tradie_onboarding" slides={tradieSlides} />

      {/* ── Setup wizard ── */}
      {showSetupWizard && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(28,43,50,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'520px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
            <div style={{ background:'#1C2B32', padding:'20px 28px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:0 }}>WELCOME TO STEADYHAND</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>Let's get your profile ready</p>
            </div>
            <div style={{ padding:'28px' }}>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'24px' }}>
                {[
                  {
                    done: !!(profile?.tradie?.business_name && profile?.tradie?.trade_categories?.length && profile?.tradie?.service_areas?.length),
                    label: 'Complete your business profile',
                    sub: 'Business name, trade category and service area',
                    href: '/tradie/profile?required=true',
                    cta: 'Complete profile →'
                  },
                  {
                    done: profile?.tradie?.subscription_active === true,
                    label: 'Choose a subscription plan',
                    sub: 'Select the plan that fits your business — start free',
                    href: '/tradie/subscribe',
                    cta: 'View plans →'
                  },
                  {
                    done: stripeConnected,
                    label: 'Connect your bank account',
                    sub: 'Required to receive milestone payments via Steadyhand',
                    href: null,
                    cta: 'Connect →'
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', background: item.done ? 'rgba(46,125,96,0.06)' : 'white', border:'1px solid ' + (item.done ? 'rgba(46,125,96,0.2)' : 'rgba(28,43,50,0.1)'), borderRadius:'10px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: item.done ? '#2E7D60' : 'rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>
                      {item.done ? '✓' : (i + 1)}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color: item.done ? '#2E7D60' : '#1C2B32', margin:'0 0 2px' }}>{item.label}</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{item.sub}</p>
                    </div>
                    {!item.done && (
                      item.href
                        ? <a href={item.href} style={{ fontSize:'12px', color:'#2E6A8F', fontWeight:500, textDecoration:'none', flexShrink:0 }}>{item.cta}</a>
                        : <button type="button" onClick={async () => {
                            const res = await fetch('/api/stripe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'create_connect_account', tradie_id: profile?.id, email: profile?.email }) })
                            const data = await res.json()
                            if (data.url) window.location.href = data.url
                          }} style={{ fontSize:'12px', color:'#2E6A8F', fontWeight:500, background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}>{item.cta}</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" onClick={() => {
                  if (typeof window !== 'undefined') localStorage.setItem('tradie_setup_complete', '1')
                  setShowSetupWizard(false)
                }} style={{ flex:1, background:'#1C2B32', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  Go to my dashboard →
                </button>
              </div>
              <p style={{ fontSize:'11px', color:'#9AA5AA', textAlign:'center' as const, marginTop:'12px' }}>You can complete these steps any time from your dashboard</p>
            </div>
          </div>
        </div>
      )}
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>Tradie</span>
          <a href="/messages" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
            Messages
            {unreadCount > 0 && <span style={{ background:'#D4522A', color:'white', borderRadius:'100px', fontSize:'10px', fontWeight:700, padding:'1px 6px', lineHeight:'1.4' }}>{unreadCount}</span>}
          </a>
          <div style={{ position:'relative' as const }}>
            <div onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'white', flexShrink:0, userSelect:'none' as const }}>
              {profile?.tradie?.business_name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            {dropdownOpen && (
              <div style={{ position:'absolute' as const, right:0, top:'44px', background:'white', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'10px', boxShadow:'0 8px 24px rgba(28,43,50,0.12)', minWidth:'200px', zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#F4F8F7' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#1C2B32', margin:'0 0 2px' }}>{profile?.tradie?.business_name || 'My business'}</p>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Tradie account</p>
                </div>
                {[
                  { label:'Dashboard', href:'/tradie/dashboard' },
                  { label:'My profile', href:'/tradie/profile' },
                  { label:'Messages', href:'/messages' },
                  { label:'Availability status', href:'/tradie/availability' },
                  { label:'Dialogue Rating', href:'/tradie/dialogue' },
                  { label:'Subscription plans', href:'/tradie/subscribe' },
                ].map(item => (
                  <a key={item.href} href={item.href} onClick={() => setDropdownOpen(false)}
                    style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#1C2B32', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
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

      {/* ── Hero ── */}
      <div style={{ background:'#1C2B32', padding:'40px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(46,125,96,0.2), transparent 53.5%)' }} />
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

        {/* ── Analytics ── */}
        <div style={{ marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px', margin:0 }}>YOUR PERFORMANCE</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'12px' }}>
            {[
              { label:'Active jobs', value: activeJobs.length, sub: jobs.filter(j => j.status === 'delivery').length + ' in delivery', color:'#2E7D60' },
              { label:'Jobs completed', value: profile?.tradie?.jobs_completed || 0, sub: jobs.filter(j => j.status === 'warranty').length + ' under warranty', color:'#2E6A8F' },
              { label:'Dialogue Rating', value: profile?.tradie?.dialogue_score_avg ? Number(profile.tradie.dialogue_score_avg).toFixed(0) : '—', sub: 'based on communication quality', color:'#6B4FA8' },
            ].map(s => (
              <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'6px', letterSpacing:'0.3px' }}>{s.label}</p>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color: s.color, letterSpacing:'1px', margin:'0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px' }}>
            {[
              {
                label:'Quote acceptance',
                value: (() => {
                  const sent = jobs.filter(j => ['shortlisted','quotes','agreement','delivery','signoff','warranty','complete'].includes(j.status)).length
                  const accepted = jobs.filter(j => ['agreement','delivery','signoff','warranty','complete'].includes(j.status)).length
                  return sent > 0 ? Math.round(accepted/sent*100) + '%' : '—'
                })(),
                sub:'quotes accepted vs sent',
                color:'#C07830'
              },
              {
                label:'Avg rating',
                value: profile?.tradie?.rating_avg ? Number(profile.tradie.rating_avg).toFixed(1) + ' ⭐' : '—',
                sub: 'from completed jobs',
                color:'#D4522A'
              },
              {
                label:'Warranty issues',
                value: jobs.filter(j => j.status === 'warranty').length,
                sub:'jobs currently protected',
                color:'#9B6B9B'
              },
            ].map(s => (
              <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'6px', letterSpacing:'0.3px' }}>{s.label}</p>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color: s.color, letterSpacing:'1px', margin:'0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
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
        {/* Xero integration banner */}
        {xeroConnected ? (
          <div style={{ margin:'0 0 12px', background:'rgba(19,183,117,0.08)', border:'1px solid rgba(19,183,117,0.25)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#138a52', margin:'0 0 2px' }}>✓ Xero connected — {xeroTenant}</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Quotes and invoices sync automatically to your Xero account.</p>
            </div>
            <button type="button" onClick={async () => {
              setXeroDisconnecting(true)
              const supabase = createClient()
              const { data: { session } } = await supabase.auth.getSession()
              await fetch('/api/xero/disconnect', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: session?.user.id }) })
              setXeroConnected(false)
              setXeroTenant(null)
              setXeroDisconnecting(false)
            }} disabled={xeroDisconnecting}
              style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'6px 12px', cursor:'pointer' }}>
              {xeroDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div style={{ margin:'0 0 12px', background:'rgba(19,183,117,0.04)', border:'1px solid rgba(19,183,117,0.15)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>Connect Xero</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Sync quotes and invoices directly to your Xero account.</p>
            </div>
            <a href="/api/xero/connect"
              style={{ fontSize:'12px', color:'white', background:'#13B875', border:'none', borderRadius:'6px', padding:'7px 14px', cursor:'pointer', textDecoration:'none', fontWeight:500 }}>
              Connect Xero →
            </a>
          </div>
        )}

        {!stripeConnected && (
          <div style={{ borderBottom:'1px solid rgba(28,43,50,0.08)', paddingBottom:'14px', marginBottom:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Bank account not connected — milestone payments are on hold.</p>
            <button type="button" onClick={async () => {
              const res  = await fetch('/api/stripe', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ action:'create_connect_account', tradie_id: profile?.id, email: profile?.email }) })
              const data = await res.json()
              if (data.url) window.location.href = data.url
            }} style={{ background:'none', color:'#2E7D60', padding:'0', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0, textDecoration:'underline' }}>
              Connect bank account →
            </button>
          </div>
        )}

        {profile?.tradie?.subscription_active === false && (
          <div style={{ borderBottom:'1px solid rgba(28,43,50,0.08)', paddingBottom:'14px', marginBottom:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Profile pending verification — we will notify you when live.</p>
            <a href="/tradie/subscribe" style={{ fontSize:'13px', color:'#D4522A', fontWeight:500, textDecoration:'underline', flexShrink:0 }}>Manage subscription →</a>
          </div>
        )}

        {/* ── Upcoming consults ── */}
        {consults.length > 0 && (
          <div style={{ marginBottom:'24px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'12px' }}>UPCOMING CONSULTS</h2>
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
                        <p style={{ fontSize:'16px', fontWeight:700, color: isToday ? '#9B6B9B' : '#1C2B32', margin:0, lineHeight:1 }}>{date.getDate()}</p>
                        <p style={{ fontSize:'9px', color:'#7A9098', margin:0, textTransform:'uppercase' as const }}>{date.toLocaleDateString('en-AU', { month:'short' })}</p>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{a.job?.title}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>
                          {a.job?.client?.full_name} · {date.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
                          {!isConfirmed && <span style={{ color:'#C07830', marginLeft:'6px' }}>· Awaiting confirmation</span>}
                          {isPast && <span style={{ marginLeft:'6px' }}>· Done</span>}
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

        {/* ── Active jobs ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', margin:0 }}>
            {activeJobs.length > 0 ? 'ACTIVE JOBS' : 'NO ACTIVE JOBS'}
          </h2>

        </div>

        {activeJobs.length === 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'32px' }}>
            <div style={{ background:'#1C2B32', padding:'20px 24px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:'0 0 4px' }}>WELCOME TO STEADYHAND</p>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Your job pipeline starts here</p>
            </div>
            <div style={{ padding:'24px' }}>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.65', marginBottom:'20px' }}>
                Jobs appear here when a client invites you to quote. Steadyhand works by invitation — clients post a job, then personally invite the tradies they want to hear from. Your profile and Dialogue Rating are what get you invited.
              </p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'20px' }}>
                {[
                  { step:'1', title:'Complete your profile', body:'A complete profile — with your trade category, licence number, and business description — is what clients see before deciding whether to invite you.', href:'/tradie/profile', cta:'Complete profile →', color:'#D4522A' },
                  { step:'2', title:'Connect your bank account', body:'Set up Stripe so you can receive milestone payments automatically when clients approve completed work.', href:null, cta:null, color:'#2E7D60' },
                  { step:'3', title:'Share your profile link', body:'Ask past clients to find you on Steadyhand and post their next job. A direct invitation from a familiar client is the fastest way to your first job on the platform.', href:null, cta:null, color:'#2E6A8F' },
                ].map(s => (
                  <div key={s.step} style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'14px 16px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'white', flexShrink:0, marginTop:'1px' }}>{s.step}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', margin:'0 0 4px' }}>{s.title}</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 8px', lineHeight:'1.5' }}>{s.body}</p>
                      {s.href && s.cta && (
                        <a href={s.href} style={{ fontSize:'12px', color:s.color, textDecoration:'none', fontWeight:500 }}>{s.cta}</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px', padding:'12px 14px' }}>
                <p style={{ fontSize:'12px', color:'#2E7D60', margin:0, lineHeight:'1.5' }}>
                  <strong>Your Dialogue Rating</strong> — a score that reflects how clearly and transparently you communicate — builds with every job. Tradies with higher ratings get invited more often.
                </p>
              </div>
            </div>
          </div>
        )}

        {(() => { const declinedCount = sortedActive.filter(job => { const myQR = job.quote_requests?.find((qr: any) => qr.tradie_id === user?.id); return myQR?.status === 'declined' }).length; return declinedCount > 0 ? (
          <p style={{ fontSize:'12px', color:'#9AA5AA', textAlign:'center' as const, marginBottom:'8px' }}>{declinedCount} declined job{declinedCount !== 1 ? 's' : ''} hidden</p>
        ) : null })()}
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
                    <span style={{ fontSize:'11px', color, fontWeight:500, flexShrink:0 }}>{label}</span>
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

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid rgba(28,43,50,0.07)' }}>
                    <p style={{ fontSize:'13px', color: next.urgent ? '#D4522A' : '#4A5E64', margin:0, fontWeight: next.urgent ? 500 : 400 }}>{next.headline}</p>
                    <span style={{ fontSize:'13px', color: next.urgent ? '#D4522A' : '#7A9098', flexShrink:0 }}>→</span>
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

        <div style={{ marginTop:'32px', paddingTop:'20px', borderTop:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>For your business — sourcing quotes from suppliers?</p>
          <a href="/diy" style={{ fontSize:'13px', color:'#1C2B32', fontWeight:500, textDecoration:'none', flexShrink:0 }}>Build Journal →</a>
        </div>

        {/* BUILD YOUR CAPABILITY */}
        <div style={{ marginTop:'32px', paddingTop:'28px', borderTop:'1px solid rgba(28,43,50,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px', margin:0 }}>BUILD YOUR CAPABILITY</h2>
            <a href="https://www.steadyhanddigital.com" target="_blank" style={{ fontSize:'12px', color:'#7A9098', textDecoration:'none' }}>About our approach →</a>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'10px' }}>
            {[
              { icon:'⭐', title:'Improve your Dialogue Rating', body:'Your Dialogue Rating is built through how you communicate before signing. Pricing transparency and risk disclosure matter most.', href:'https://www.steadyhanddigital.com', label:'How scoring works →' },
              { icon:'📄', title:'Writing better scope agreements', body:'Clear inclusions and exclusions protect you from scope creep and disputes. A well-written scope is your best legal protection.', href:'https://www.steadyhanddigital.com', label:'Scope writing guide →' },
              { icon:'✅', title:'Licence and compliance — WA', body:'The WA Building Commission sets compliance requirements for licensed trades. Stay current with the standards that apply to your category.', href:'https://www.buildingcommission.com.au', label:'Building Commission WA →' },
              { icon:'💻', title:'Digital tools for trade businesses', body:'Xero for invoicing, Steadyhand for scope and warranty, your existing CRM for quoting. Build a simple digital stack that saves you time.', href:'https://www.steadyhanddigital.com', label:'Steadyhand Digital →' },
            ].map(c => (
              <a key={c.title} href={c.href} target="_blank" style={{ textDecoration:'none' }}>
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px', cursor:'pointer' }}>
                  <div style={{ fontSize:'20px', marginBottom:'8px' }}>{c.icon}</div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>{c.title}</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'8px' }}>{c.body}</p>
                  <p style={{ fontSize:'12px', color:'#2E6A8F', margin:0 }}>{c.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )

    </>
  )
}