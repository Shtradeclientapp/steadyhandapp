'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OnboardingModal } from '@/components/ui/OnboardingModal'
import { SetupModal } from '@/components/ui/SetupModal'
import { ObservatoryWidget } from '@/components/ui/Observatory'

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
        headline: 'Estimate requested',
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
function FieldTeamPanel({ tradieId, activeJobs }: { tradieId: string|undefined, activeJobs: any[] }) {
  const [workers, setWorkers] = useState<any[]>([])
  const [expanded, setExpanded] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [assigningJob, setAssigningJob] = useState<string|null>(null)
  const [assignBrief, setAssignBrief] = useState('')
  const [assignWorker, setAssignWorker] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!tradieId) return
    const supabase = createClient()
    supabase.from('tradie_workers').select('*').eq('tradie_id', tradieId).order('name')
      .then(({ data }) => setWorkers(data || []))
  }, [tradieId])

  const sendInvite = async () => {
    if (!inviteName || !inviteEmail) return
    setInviting(true); setInviteMsg('')
    const res = await fetch('/api/worker-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: inviteName, email: inviteEmail, phone: invitePhone, tradie_id: tradieId }) })
    const data = await res.json()
    if (data.ok) {
      setInviteMsg('Invite sent ✓'); setInviteName(''); setInviteEmail(''); setInvitePhone('')
      const supabase = createClient()
      const { data: ws } = await supabase.from('tradie_workers').select('*').eq('tradie_id', tradieId).order('name')
      setWorkers(ws || [])
    } else { setInviteMsg('Error: ' + data.error) }
    setInviting(false)
  }

  const assignToJob = async () => {
    if (!assignWorker || !assigningJob) return
    setAssigning(true)
    const supabase = createClient()
    await supabase.from('job_worker_assignments').upsert({ job_id: assigningJob, worker_id: assignWorker, site_brief: assignBrief, assigned_date: new Date().toISOString().split('T')[0], status: 'assigned' }, { onConflict: 'job_id,worker_id' })
    setAssigningJob(null); setAssignBrief(''); setAssignWorker(''); setAssigning(false)
  }

  const activeWorkers = workers.filter(w => w.status === 'active')
  const pendingWorkers = workers.filter(w => w.status === 'invited')

  return (
    <div style={{ background:'white', borderRadius:'14px', padding:'20px 24px', marginBottom:'24px', border:'1px solid rgba(28,43,50,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:600, color:'#1C2B32', margin:0 }}>Field team</h2>
          {activeWorkers.length > 0 && <span style={{ fontSize:'11px', background:'rgba(46,125,96,0.1)', color:'#2E7D60', borderRadius:'100px', padding:'2px 8px', fontWeight:500 }}>{activeWorkers.length} active</span>}
          {pendingWorkers.length > 0 && <span style={{ fontSize:'11px', background:'rgba(192,120,48,0.1)', color:'#C07830', borderRadius:'100px', padding:'2px 8px', fontWeight:500 }}>{pendingWorkers.length} invited</span>}
        </div>
        <a href="/tradie/workers" style={{ fontSize:'12px', color:'#2E6A8F', fontWeight:500, textDecoration:'none' }}>Manage workers →</a>
      </div>

      <div>
          {workers.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'16px' }}>
              {workers.map(w => (
                <div key={w.id} style={{ background:'#F4F8F7', borderRadius:'10px', padding:'12px 16px', border:'1px solid rgba(28,43,50,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color:'white', flexShrink:0 }}>{w.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{w.name}</p>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{w.email}{w.phone ? ` · ${w.phone}` : ''}</p>
                    </div>
                  </div>
                  <span style={{ fontSize:'11px', color: w.status === 'active' ? '#2E7D60' : '#C07830', background: w.status === 'active' ? 'rgba(46,125,96,0.08)' : 'rgba(192,120,48,0.08)', border: '1px solid ' + (w.status === 'active' ? 'rgba(46,125,96,0.2)' : 'rgba(192,120,48,0.2)'), borderRadius:'100px', padding:'3px 10px', fontWeight:500 }}>
                    {w.status === 'active' ? 'Active' : 'Invited'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeWorkers.length > 0 && activeJobs.length > 0 && (
            <div style={{ background:'white', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontSize:'12px', fontWeight:600, color:'#4A5E64', margin:'0 0 12px', letterSpacing:'0.5px' }}>ASSIGN WORKER TO JOB</p>
              <select value={assignWorker} onChange={e => setAssignWorker(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', marginBottom:'8px', background:'#F4F8F7', outline:'none' }}>
                <option value="">Select worker...</option>
                {activeWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={assigningJob || ''} onChange={e => setAssigningJob(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', marginBottom:'8px', background:'#F4F8F7', outline:'none' }}>
                <option value="">Select job...</option>
                {activeJobs.map((j: any) => <option key={j.id} value={j.id}>{j.title} — {j.suburb || j.client?.suburb || ''}</option>)}
              </select>
              <textarea value={assignBrief} onChange={e => setAssignBrief(e.target.value)} placeholder="Site brief (optional) — what should the worker know?" style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', marginBottom:'10px', resize:'vertical' as const, minHeight:'72px', outline:'none', fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
              <button onClick={assignToJob} disabled={assigning || !assignWorker || !assigningJob} style={{ background:'#0A0A0A', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: (assigning || !assignWorker || !assigningJob) ? 0.5 : 1 }}>
                {assigning ? 'Assigning...' : 'Assign to job →'}
              </button>
            </div>
          )}

          <div style={{ background:'white', borderRadius:'12px', padding:'16px', border:'1px solid rgba(28,43,50,0.08)' }}>
            <p style={{ fontSize:'12px', fontWeight:600, color:'#4A5E64', margin:'0 0 12px', letterSpacing:'0.5px' }}>INVITE A WORKER</p>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', marginBottom:'8px', background:'#F4F8F7', outline:'none', boxSizing:'border-box' as const }} />
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" type="email" style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', marginBottom:'8px', background:'#F4F8F7', outline:'none', boxSizing:'border-box' as const }} />
            <input value={invitePhone} onChange={e => setInvitePhone(e.target.value)} placeholder="Phone (optional)" type="tel" style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', marginBottom:'10px', background:'#F4F8F7', outline:'none', boxSizing:'border-box' as const }} />
            {inviteMsg && <p style={{ fontSize:'12px', color: inviteMsg.includes('✓') ? '#2E7D60' : '#D4522A', marginBottom:'8px' }}>{inviteMsg}</p>}
            <button onClick={sendInvite} disabled={inviting || !inviteName || !inviteEmail} style={{ background:'#2E7D60', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: (inviting || !inviteName || !inviteEmail) ? 0.5 : 1 }}>
              {inviting ? 'Sending...' : 'Send invite →'}
            </button>
          </div>
        </div>
    </div>
  )
}

const STATUS_TO_STAGE: Record<string, string> = {
  shortlisted: '/consult',
  assess:      '/consult',
  consult:     '/consult',
  quote:       '/quote',
  compare:     '/quote',
  agreement:   '/agreement',
  delivery:    '/delivery',
  signoff:     '/signoff',
  warranty:    '/warranty',
  complete:    '/warranty',
}

export default function TradieDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser]       = useState<any>(null)
  const [jobs, setJobs]       = useState<any[]>([])
  const [consults, setConsults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [tradieAnalytics, setTradieAnalytics] = useState<any[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [xeroConnected, setXeroConnected] = useState(false)
  const [xeroTenant, setXeroTenant] = useState<string|null>(null)
  const [xeroDisconnecting, setXeroDisconnecting] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showSpotlight, setShowSpotlight] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Redirect to login if session check hangs for more than 6 seconds
    const loadingTimeout = setTimeout(() => { window.location.href = '/login' }, 6000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(loadingTimeout)
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, tradie:tradie_profiles!tradie_profiles_id_fkey(*)')
        .eq('id', session.user.id)
        .single()

      if (!prof || prof.role !== 'tradie') { window.location.href = '/dashboard'; return }
      if (!prof.tradie?.id) { window.location.href = '/tradie/profile?required=true'; return }


      setUser(session.user)
      setProfile(prof)

      // Parallelise Xero status, Stripe status and assigned jobs — all independent
      const [xeroRes, stripeRes, { data: assignedJobs }, { data: qrs }, { count: unreadTotal }] = await Promise.all([
        fetch('/api/xero/status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: session.user.id }) }),
        fetch('/api/stripe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'get_account_status', tradie_id: session.user.id }) }),
        supabase.from('jobs')
          .select('*, milestones(*), client:profiles!jobs_client_id_fkey(full_name, email, suburb), quote_requests(status, tradie_id), quotes(id, tradie_id)')
          .eq('tradie_id', session.user.id)
          .order('updated_at', { ascending: false }),
        supabase.from('quote_requests').select('job_id').eq('tradie_id', session.user.id),
        supabase.from('job_messages')
          .select('id', { count: 'exact', head: true })
          .neq('sender_id', session.user.id)
          .not('read_by', 'cs', JSON.stringify([session.user.id])),
      ])

      const xeroData = await xeroRes.json()
      setXeroConnected(xeroData.connected || false)
      if (xeroData.tenant_name) setXeroTenant(xeroData.tenant_name)

      const stripeData = await stripeRes.json()
      setStripeConnected(stripeData.connected || false)

      setUnreadCount(unreadTotal || 0)

      // Setup wizard + onboarding checks
      const step = prof.tradie?.onboarding_step || 'profile'
      if (step !== 'active' && step !== 'complete') setShowSetupWizard(true)
      // onboarding steps: profile → active (invite_client step retired)

      // Merge assigned jobs + quoted jobs (deduplicated)
      const quotedJobIds = (qrs || []).map((q: any) => q.job_id)
      let quotedJobs: any[] = []
      if (quotedJobIds.length > 0) {
        const { data: qjData } = await supabase
          .from('jobs')
          .select('*, milestones(*), client:profiles!jobs_client_id_fkey(full_name, email, suburb), quote_requests(status, tradie_id), quotes(id, tradie_id)')
          .in('id', quotedJobIds)
          .order('updated_at', { ascending: false })
        quotedJobs = qjData || []
      }
      const assignedIds = new Set((assignedJobs || []).map((j: any) => j.id))
      const merged = [...(assignedJobs || []), ...quotedJobs.filter((j: any) => !assignedIds.has(j.id))]
      setJobs(merged)

      // Assessments depend on job IDs — run after merge
      const allJobIds = merged.map((j: any) => j.id)
      if (allJobIds.length > 0) {
        const { data: assessments } = await supabase
          .from('site_assessments')
          .select('*, job:jobs(id, title, client:profiles!jobs_client_id_fkey(full_name))')
          .in('job_id', allJobIds)
          .not('consult_date', 'is', null)
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const upcoming = (assessments || []).filter((a: any) => new Date(a.consult_date) > cutoff)
        upcoming.sort((a: any, b: any) => new Date(a.consult_date).getTime() - new Date(b.consult_date).getTime())
        setConsults(upcoming)
      }
      // Load tradie's own job analytics
      if (merged.length > 0) {
        const mergedIds = merged.map((j: any) => j.id)
        const { data: analyticsData } = await supabase
          .from('job_analytics')
          .select('*')
          .in('job_id', mergedIds)
        setTradieAnalytics(analyticsData || [])
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
      title: 'Your jobs, properly managed',
      body: 'When a client invites you, a quote request lands here. Steadyhand then guides both of you through consult, scope agreement, milestone payments and warranty — so every job has a clean paper trail from start to finish.',
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
      body: 'Your Dialogue Rating reflects how clients experienced your communication — not how much you said, but whether they felt informed about pricing, scope, risk and timeline. A tradie who says little but says the right things scores well. It builds with every job and is visible to future clients.',
    },
  ]

  return (
    <>
      {profile?.tradie?.onboarding_step === 'pending_verification' && (
        <div style={{ background:'rgba(192,120,48,0.08)', borderBottom:'2px solid rgba(192,120,48,0.3)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'18px' }}>⏳</span>
            <div>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#854F0B', margin:'0 0 2px' }}>Your account is pending verification</p>
              <p style={{ fontSize:'12px', color:'#C07830', margin:0 }}>The Steadyhand team is reviewing your details. You will be notified by email once you are live in the directory.</p>
            </div>
          </div>
          <a href="/tradie/profile" style={{ fontSize:'12px', color:'#854F0B', background:'rgba(192,120,48,0.1)', border:'1px solid rgba(192,120,48,0.3)', padding:'7px 14px', borderRadius:'7px', textDecoration:'none', fontWeight:500, flexShrink:0 }}>
            Complete profile →
          </a>
        </div>
      )}
      {/* ── Primary action bar ── */}
      <div style={{ background:'#141414', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
          <a href="/tradie/lead"
            style={{ fontSize:'13px', fontWeight:600, color:'white', background:'#D4522A', borderRadius:'8px', padding:'10px 22px', textDecoration:'none', whiteSpace:'nowrap' as const, flexShrink:0 }}>
            + Invite a client
          </a>
          <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' as const }}>
            {[
              { label:'Availability', href:'/tradie/availability' },
              { label:'Dialogue Rating', href:'/tradie/dialogue' },
              { label:'Steadytools', href:'/tradie/steadytools' },
            ].map(item => (
              <a key={item.href} href={item.href}
                style={{ fontSize:'12px', color:'rgba(216,228,225,0.55)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'7px', padding:'7px 13px', textDecoration:'none', whiteSpace:'nowrap' as const }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>


      {profile?.tradie?.onboarding_step === 'active' && (
        <OnboardingModal storageKey="seen_tradie_onboarding" slides={tradieSlides} />
      )}

      {/* ── Setup wizard ── */}
      {showSetupWizard && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(28,43,50,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'520px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
            <div style={{ background:'#0A0A0A', padding:'20px 28px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:0 }}>WELCOME TO STEADYHAND</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>Let's get your profile ready</p>
            </div>
            <div style={{ padding:'28px' }}>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'24px' }}>
                {[
                  {
                    done: profile?.tradie?.onboarding_step === 'active',
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
                      <p style={{ fontSize:'13px', fontWeight:500, color: item.done ? '#2E7D60' : '#0A0A0A', margin:'0 0 2px' }}>{item.label}</p>
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
                <button type="button" onClick={async () => {
                  // Mark onboarding complete in DB
                  const supabaseD = createClient()
                  const { data: { session: sessD } } = await supabaseD.auth.getSession()
                  if (sessD && profile?.tradie?.id) {
                    await supabaseD.from('tradie_profiles').update({
                      onboarding_step: 'active',
                      onboarding_completed_at: new Date().toISOString(),
                    }).eq('id', profile.tradie.id)
                  }
                  setShowSetupWizard(false)
                }} style={{ flex:1, background:'#0A0A0A', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
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
        <a href="/tradie/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'13px', color:'#4A5E64' }}>Tradie</span>
          <a href="/messages" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
            Messages
            {unreadCount > 0 && <span style={{ background:'#D4522A', color:'white', borderRadius:'100px', fontSize:'10px', fontWeight:700, padding:'1px 6px', lineHeight:'1.4' }}>{unreadCount}</span>}
          </a>
          <div style={{ position:'relative' as const }}>
            <div onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'white', flexShrink:0, userSelect:'none' as const }}>
              {profile?.tradie?.business_name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            {dropdownOpen && (
              <div style={{ position:'absolute' as const, right:0, top:'44px', background:'white', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'10px', boxShadow:'0 8px 24px rgba(28,43,50,0.12)', minWidth:'200px', zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#F4F8F7' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>{profile?.tradie?.business_name || 'My business'}</p>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Tradie account</p>
                </div>
                {[
                  { label:'Dashboard', href:'/tradie/dashboard' },
                  { label:'My profile', href:'/tradie/profile' },
                  { label:'Messages', href:'/messages' },
                  { label:'Availability status', href:'/tradie/availability' },
                  { label:'Dialogue Rating', href:'/tradie/dialogue' },
                  { label:'Subscription plans', href:'/tradie/subscribe' },
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

      {/* ── Hero ── */}
      <div style={{ background:'#0A0A0A', padding:'40px 0', position:'relative', overflow:'hidden' }}>
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
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'1px', margin:0 }}>YOUR PERFORMANCE</h2>
          </div>
          <div className="stat-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'12px' }}>
            {[
              { label:'Active jobs', value: activeJobs.length, sub: jobs.filter(j => j.status === 'delivery').length + ' in delivery', color:'#2E7D60' },
              { label:'Jobs completed', value: profile?.tradie?.jobs_completed || 0, sub: jobs.filter(j => j.status === 'warranty').length + ' under warranty', color:'#2E6A8F' },
              { label:'Dialogue Rating', value: profile?.tradie?.dialogue_score_avg ? Number(profile.tradie.dialogue_score_avg).toFixed(0) : '—', sub: 'client confidence, not volume', color:'#6B4FA8' },
            ].map(s => (
              <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'6px', letterSpacing:'0.3px' }}>{s.label}</p>
                <p className="stat-value" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color: s.color, letterSpacing:'1px', margin:'0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="stat-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px' }}>
            {[
              {
                label:'Quote acceptance',
                value: (() => {
                  const sent = jobs.filter(j => ['shortlisted','consult','compare','quote','agreement','delivery','signoff','warranty','complete'].includes(j.status)).length
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
                <p className="stat-value" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color: s.color, letterSpacing:'1px', margin:'0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Profile card ── */}
        {profile?.tradie && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'18px 20px', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)' }}>{profile.tradie.business_name?.charAt(0) || '?'}</span>
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:500, color:'#0A0A0A', margin:'0 0 3px' }}>{profile.tradie.business_name}</p>
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


        {/* ── Registration status block ── */}
        {profile?.tradie?.founding_member && (
        <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'10px', padding:'14px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'20px' }}>🎖</span>
          <div>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#2E7D60', margin:'0 0 2px' }}>Founding member</p>
            <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Platform fees are waived on your jobs during the Steadyhand preview. Standard rate of 3.5% applies from v1 launch.</p>
          </div>
        </div>
      )}
      {(!stripeConnected || !xeroConnected || !profile?.tradie?.subscription_active || !profile?.tradie?.licence_verified) && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'24px' }}>
            <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#7A9098', letterSpacing:'0.5px', margin:0 }}>ACCOUNT STATUS</p>
            </div>
            <div style={{ padding:'8px 0' }}>
              {[
                {
                  ok: !!profile?.tradie?.licence_verified,
                  label: 'Profile verification',
                  action: !profile?.tradie?.licence_verified ? 'Pending — we will notify you when live' : null,
                  href: null,
                  cta: null,
                },
                {
                  ok: !!profile?.tradie?.subscription_active,
                  label: 'Subscription',
                  action: !profile?.tradie?.subscription_active ? 'No active plan' : null,
                  href: '/tradie/subscribe',
                  cta: 'Manage →',
                },
                {
                  ok: stripeConnected,
                  label: 'Bank account',
                  action: !stripeConnected ? 'Not connected — milestone payments on hold' : null,
                  href: null,
                  cta: null,
                  onClick: !stripeConnected ? async () => {
                    const res = await fetch('/api/stripe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'create_connect_account', tradie_id: profile?.id, email: profile?.email }) })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  } : null,
                },
                {
                  ok: xeroConnected,
                  label: 'Xero',
                  action: !xeroConnected ? 'Not connected' : xeroTenant || 'Connected',
                  href: !xeroConnected ? '/api/xero/connect' : null,
                  cta: !xeroConnected ? 'Connect →' : null,
                },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom: i < 3 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'14px' }}>{item.ok ? '✓' : '○'}</span>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:500, color: item.ok ? '#2E7D60' : '#0A0A0A', margin:0 }}>{item.label}</p>
                      {item.action && <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{item.action}</p>}
                    </div>
                  </div>
                  {!item.ok && item.href && (
                    <a href={item.href} style={{ fontSize:'12px', color:'#D4522A', fontWeight:500, textDecoration:'none' }}>{item.cta}</a>
                  )}
                  {!item.ok && item.onClick && (
                    <button type="button" onClick={item.onClick} style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500, background:'none', border:'none', cursor:'pointer', padding:0 }}>Connect →</button>
                  )}
                  {item.ok && item.label === 'Xero' && xeroTenant && (
                    <button type="button" onClick={async () => {
                      setXeroDisconnecting(true)
                      const supabase = createClient()
                      const { data: { session } } = await supabase.auth.getSession()
                      await fetch('/api/xero/disconnect', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: session?.user.id }) })
                      setXeroConnected(false); setXeroTenant(null); setXeroDisconnecting(false)
                    }} style={{ fontSize:'11px', color:'#9AA5AA', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'5px', padding:'4px 8px', cursor:'pointer' }}>
                      {xeroDisconnecting ? '...' : 'Disconnect'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}



        {/* ── Active jobs ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'1px', margin:0 }}>
            {activeJobs.length > 0 ? 'ACTIVE JOBS' : 'NO ACTIVE JOBS'}
          </h2>

        </div>

        {activeJobs.length === 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'32px' }}>
            <div style={{ background:'#0A0A0A', padding:'20px 24px' }}>
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
                  { step:'2', title:'Connect your bank account', body:'Set up Stripe so you can receive milestone payments automatically when clients approve completed work.', href:'/tradie/dashboard#stripe', cta:'Connect Stripe →', color:'#2E7D60' },
                  { step:'3', title:'Invite your first client', body:'Send a client an invitation to post their job on Steadyhand. A direct invitation is the fastest way to your first job on the platform.', href:'/tradie/lead', cta:'Invite a client →', color:'#2E6A8F' },
                ].map(s => (
                  <div key={s.step} style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'14px 16px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'white', flexShrink:0, marginTop:'1px' }}>{s.step}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{s.title}</p>
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
              <a key={job.id} href={(STATUS_TO_STAGE[job.status] || '/tradie/jobs/' + job.id) + '?job_id=' + job.id} style={{ textDecoration:'none' }}>
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
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const, marginBottom: next ? '8px' : '10px' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#0A0A0A', letterSpacing:'0.3px', marginBottom:'3px' }}>{job.title}</div>
                      <div style={{ fontSize:'12px', color:'#7A9098' }}>{job.trade_category} · {job.suburb} · {job.client?.full_name}</div>
                    </div>
                    <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background: color + '18', border:'1px solid ' + color + '40', color, fontWeight:500, flexShrink:0 }}>{label}</span>
                  </div>
                  {/* Next action — prominent highlight */}
                  {next?.headline && (
                    <div style={{ background: next.urgent ? color + '15' : 'rgba(28,43,50,0.04)', border:'1px solid ' + (next.urgent ? color + '40' : 'rgba(28,43,50,0.1)'), borderRadius:'8px', padding:'8px 12px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'14px', flexShrink:0 }}>{next.icon}</span>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:600, color: next.urgent ? color : '#0A0A0A', margin:'0 0 1px' }}>{next.headline}</p>
                        {next.sub && <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{next.sub}</p>}
                      </div>
                    </div>
                  )}

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

        {/* ── Field team ── */}
        <div style={{ background:'#0A0A0A', borderRadius:'16px', padding:'24px', marginBottom:'32px' }}>
          <FieldTeamPanel tradieId={profile?.tradie?.id} activeJobs={activeJobs} />
        </div>

        {/* ── Completed ── */}
        {completedJobs.length > 0 && (
          <>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'14px' }}>COMPLETED</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {completedJobs.map(job => (
                <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #2E7D60', borderRadius:'11px', padding:'16px 20px', opacity:0.7, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A' }}>{job.title}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{job.trade_category} · {job.suburb}</div>
                  </div>
                  <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60' }}>Complete</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Analytics insights */}
        {tradieAnalytics.length > 0 && (() => {
          const completed = tradieAnalytics.filter(a => a.signoff_completed_at)
          const avgDelivery = completed.filter(a => a.days_delivery > 0).length > 0
            ? Math.round(completed.filter(a => a.days_delivery > 0).reduce((s, a) => s + a.days_delivery, 0) / completed.filter(a => a.days_delivery > 0).length)
            : null
          const withVariations = tradieAnalytics.filter(a => a.variation_count > 0).length
          const warrantyIssues = tradieAnalytics.reduce((s, a) => s + (a.warranty_issues_count || 0), 0)
          const warrantyResolved = tradieAnalytics.reduce((s, a) => s + (a.warranty_issues_resolved || 0), 0)
          const openWarranty = warrantyIssues - warrantyResolved
          const avgScopeToStart = tradieAnalytics.filter(a => a.days_scope_to_first_milestone > 0).length > 0
            ? Math.round(tradieAnalytics.filter(a => a.days_scope_to_first_milestone > 0).reduce((s, a) => s + a.days_scope_to_first_milestone, 0) / tradieAnalytics.filter(a => a.days_scope_to_first_milestone > 0).length)
            : null

          const insights = [
            avgDelivery && { icon:'⚡', text: 'Your jobs complete in an average of ' + avgDelivery + ' days once work starts', positive: avgDelivery <= 21 },
            completed.length > 0 && { icon:'✅', text: completed.length + ' job' + (completed.length > 1 ? 's' : '') + ' signed off successfully', positive: true },
            warrantyIssues > 0 && openWarranty === 0 && { icon:'🛡️', text: 'All ' + warrantyIssues + ' warranty issue' + (warrantyIssues > 1 ? 's' : '') + ' resolved — clean record', positive: true },
            openWarranty > 0 && { icon:'⚠️', text: openWarranty + ' warranty issue' + (openWarranty > 1 ? 's' : '') + ' awaiting resolution', positive: false },
            withVariations > 0 && { icon:'📋', text: withVariations + ' job' + (withVariations > 1 ? 's' : '') + ' included scope variations', positive: null },
            avgScopeToStart && { icon:'🚀', text: 'Average ' + avgScopeToStart + ' days from scope agreement to starting work', positive: null },
          ].filter(Boolean) as any[]

          if (!insights.length) return null

          return (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px', marginBottom:'16px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 14px' }}>Your job insights</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {insights.map((item: any, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', background:'white', borderRadius:'8px', borderLeft: '3px solid ' + (item.positive === true ? '#2E7D60' : item.positive === false ? '#C07830' : 'rgba(28,43,50,0.15)') }}>
                    <span style={{ fontSize:'15px', flexShrink:0, marginTop:'1px' }}>{item.icon}</span>
                    <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0, lineHeight:1.5 }}>{item.text}</p>
                  </div>
                ))}
              </div>
              <a href="/tradie/jobs" style={{ display:'inline-block', marginTop:'12px', fontSize:'12px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>View job analytics →</a>
            </div>
          )
        })()}

        {/* Observatory */}
        <div style={{ marginTop:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#7A9098', fontWeight:500, margin:0 }}>WA Trade Data Tracker</p>
            <a href="/observatory" style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>Full observatory →</a>
          </div>
          <ObservatoryWidget />
        </div>

        {/* Steadytools entry point */}
        <div style={{ marginTop:'32px', paddingTop:'24px', borderTop:'1px solid rgba(28,43,50,0.08)' }}>
          <a href="/tradie/steadytools" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px 20px', textDecoration:'none', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'18px' }}>🔧</span>
              </div>
              <div>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 3px' }}>STEADYTOOLS</p>
                <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Finance calculators, document vault, lead management and capability resources</p>
              </div>
            </div>
            <span style={{ fontSize:'18px', color:'#7A9098', flexShrink:0 }}>→</span>
          </a>
        </div>

      </div>
    </div>
  )

    </>
  )
}