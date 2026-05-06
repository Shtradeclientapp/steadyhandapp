'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/ui/NavHeader'

const TRADES = ['Electrical','Plumbing & Gas','Carpentry & Joinery','Painting & Decorating','Tiling','Roofing','Concreting & Paving','Plastering','Air Conditioning & Refrigeration','Bricklaying','Landscaping & Gardening','Fencing','Glazing','Rendering','Waterproofing','Cabinetmaking','Flooring','Insulation','Solar & Batteries','Demolition','Excavation','Swimming Pool Construction','Underpinning','Other']

const SOURCES = [
  { value: 'simpro', label: 'Simpro', icon: '🔧' },
  { value: 'tradify', label: 'Tradify', icon: '📱' },
  { value: 'monday', label: 'Monday.com', icon: '📊' },
  { value: 'servicem8', label: 'ServiceM8', icon: '📋' },
  { value: 'paper', label: 'Paper / notebook', icon: '📝' },
  { value: 'phone', label: 'Phone call', icon: '📞' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'word_of_mouth', label: 'Word of mouth', icon: '🤝' },
  { value: 'other', label: 'Other / direct', icon: '📌' },
]

export default function TradieLead() {
  const [profile, setProfile] = useState<any>(null)
  const [mode, setMode] = useState<'invite'|'import'>('invite')
  const [leads, setLeads] = useState<any[]>([])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string|null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [guestInviteCount, setGuestInviteCount] = useState(0)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [showFreeInviteInfo, setShowFreeInviteInfo] = useState(false)
  const GUEST_LIMIT = 3

  // Invite form
  const [invite, setInvite] = useState({ client_name:'', client_email:'', trade_category:'', suburb:'', job_title:'', notes:'' })

  // Import form
  const [imp, setImp] = useState({
    client_name:'', client_email:'', client_phone:'', address:'', suburb:'',
    trade_category:'', job_title:'', job_description:'', source:'simpro',
    existing_quote_amount:'', preferred_start:'', internal_notes:'',
    invite_client: true,
  })

  const setI = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setInvite(f => ({ ...f, [k]: e.target.value }))
  const setM = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setImp(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Load guest invite count from localStorage
      const guestCount = parseInt(localStorage.getItem('sh_guest_invites') || '0', 10)
      setGuestInviteCount(guestCount)

      if (!session) {
        setProfileLoaded(true)
        return
      }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name, id, onboarding_step)').eq('id', session.user.id).single()
      setProfile(prof)
      const trad = prof?.tradie
      const missingRequired = trad?.onboarding_step !== 'active'
      if (missingRequired) setProfileIncomplete(true)
      setProfileLoaded(true)
      if (!prof?.tradie?.id) {
        setSendError('Please complete your profile setup before inviting clients — it only takes a few minutes.')
      }
      const { data: existing } = await supabase.from('tradie_leads').select('*').eq('tradie_id', prof?.tradie?.id).order('created_at', { ascending: false })
      setLeads(existing || [])
    })
  }, [])

  const reloadLeads = async (tradieId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('tradie_leads').select('*').eq('tradie_id', tradieId).order('created_at', { ascending: false })
    setLeads(data || [])
  }

  const handleInvite = async () => {
    if (!invite.client_email || !invite.job_title) return
    if (!profileLoaded) return

    // Guest flow — no session
    if (!profile?.tradie?.id) {
      if (guestInviteCount >= GUEST_LIMIT) {
        setShowSignupPrompt(true)
        return
      }
      setSending(true)
      setSendError(null)
      try {
        const invRes = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_email: invite.client_email,
            client_name: invite.client_name,
            tradie_name: 'your tradie',
            job_title: invite.job_title,
            message: invite.notes,
          }),
        })
        const invData = await invRes.json()
        if (!invRes.ok || invData.error) {
          setSendError('Invitation email failed — ' + (invData.error || 'please try again'))
          setSending(false)
          return
        }
      } catch {
        setSendError('Could not send invitation — check your connection')
        setSending(false)
        return
      }
      const newCount = guestInviteCount + 1
      localStorage.setItem('sh_guest_invites', String(newCount))
      setGuestInviteCount(newCount)
      setSent(true)
      setSending(false)
      setInvite({ client_name:'', client_email:'', trade_category:'', suburb:'', job_title:'', notes:'' })
      if (newCount >= GUEST_LIMIT) setShowSignupPrompt(true)
      return
    }

    setSending(true)
    setSendError(null)
    const supabase = createClient()
    const { data: lead, error: insertErr } = await supabase.from('tradie_leads').insert({
      tradie_id: profile.tradie.id,
      client_name: invite.client_name,
      client_email: invite.client_email,
      job_title: invite.job_title,
      job_description: invite.notes,
      trade_category: invite.trade_category,
      suburb: invite.suburb,
      source: 'direct_invite',
      status: 'invited',
    }).select().single()
    if (insertErr || !lead) { setSendError('Could not save lead — ' + (insertErr?.message || 'please try again')); setSending(false); return }
    try {
      const invRes = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_email: invite.client_email,
          client_name: invite.client_name,
          tradie_name: profile?.tradie?.business_name,
          job_title: invite.job_title,
          message: invite.notes,
          lead_id: lead?.id,
        }),
      })
      const invData = await invRes.json()
      if (!invRes.ok || invData.error) {
        setSendError('Lead saved but invitation email failed — ' + (invData.error || 'please try again'))
        setSending(false)
        return
      }
    } catch {
      setSendError('Lead saved but invitation email could not be sent — check your connection')
      setSending(false)
      return
    }
    await reloadLeads(profile.tradie.id)
    setSent(true)
    setSending(false)
    setInvite({ client_name:'', client_email:'', trade_category:'', suburb:'', job_title:'', notes:'' })
  }

  const handleImport = async () => {
    if (!imp.client_name || !imp.job_title) return
    if (!profileLoaded || !profile?.tradie?.id) return
    setSending(true)
    setSendError(null)
    const supabase = createClient()
    const { data: lead, error: importErr } = await supabase.from('tradie_leads').insert({
      tradie_id: profile.tradie.id,
      client_name: imp.client_name,
      client_email: imp.client_email || null,
      client_phone: imp.client_phone || null,
      job_title: imp.job_title,
      job_description: imp.job_description,
      trade_category: imp.trade_category,
      suburb: imp.suburb,
      address: imp.address,
      source: imp.source,
      existing_quote_amount: imp.existing_quote_amount && !isNaN(parseFloat(imp.existing_quote_amount)) ? parseFloat(imp.existing_quote_amount) : null,
      preferred_start: imp.preferred_start || null,
      internal_notes: imp.internal_notes,
      status: imp.invite_client && imp.client_email ? 'invited' : 'imported',
    }).select().single()

    if (importErr || !lead) { setSendError('Could not save lead — ' + (importErr?.message || 'please try again')); setSending(false); return }
    setSendError(null)
    if (imp.invite_client && imp.client_email) {
      try {
        const invRes = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_email: imp.client_email,
            client_name: imp.client_name,
            tradie_name: profile?.tradie?.business_name,
            job_title: imp.job_title,
            message: imp.job_description,
            lead_id: lead?.id,
          }),
        })
        const invData = await invRes.json()
        if (!invRes.ok || invData.error) {
          setSendError('Lead saved but invitation email failed — ' + (invData.error || 'please try again'))
          setSending(false)
          return
        }
      } catch {
        setSendError('Lead saved but invitation email could not be sent — check your connection')
        setSending(false)
        return
      }
    }

    await reloadLeads(profile.tradie.id)
    setSent(true)
    setSending(false)
    setImp({ client_name:'', client_email:'', client_phone:'', address:'', suburb:'', trade_category:'', job_title:'', job_description:'', source:'simpro', existing_quote_amount:'', preferred_start:'', internal_notes:'', invite_client: true })
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }
  const lbl = { fontSize:'12px', fontWeight:500 as const, color:'#0A0A0A', display:'block' as const, marginBottom:'4px' }
  const statusColor: Record<string,string> = { invited:'#C07830', imported:'#2E6A8F', submitted:'#2E7D60', expired:'#7A9098' }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={true} backLabel="← Dashboard" backHref="/tradie/dashboard" />

      {/* Guest invite counter banner */}
      {!profile?.tradie?.id && (
        <div style={{ background:'#0A0A0A', padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' as const, gap:'10px' }}>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', margin:0 }}>
            You have <strong style={{ color:'rgba(216,228,225,0.95)' }}>{Math.max(0, GUEST_LIMIT - guestInviteCount)}</strong> free invite{GUEST_LIMIT - guestInviteCount === 1 ? '' : 's'} remaining — <a href="/signup?role=tradie" style={{ color:'#D4522A', textDecoration:'none', fontWeight:500 }}>sign up free</a> to unlock unlimited invites and track all your leads.
          </p>
        </div>
      )}

      {/* Free invite info modal — shown on first click for guests */}
      {showFreeInviteInfo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'24px' }}>
          <div style={{ background:'white', borderRadius:'14px', padding:'32px', maxWidth:'400px', width:'100%' }}>
            <p style={{ fontSize:'24px', marginBottom:'12px', textAlign:'center' as const }}>✉️</p>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'10px', textAlign:'center' as const }}>3 FREE CLIENT INVITES</h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:1.7, marginBottom:'8px' }}>
              You can invite up to <strong>3 clients</strong> to Steadyhand without creating an account. They'll receive an email invitation to set up their job on the platform.
            </p>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:1.7, marginBottom:'24px' }}>
              Sign up free to unlock unlimited invites, track all your leads, and manage jobs end-to-end.
            </p>
            <button type="button" onClick={() => {
              localStorage.setItem('sh_invite_info_seen', '1')
              setShowFreeInviteInfo(false)
            }} style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', marginBottom:'10px' }}>
              Got it — send my first invite
            </button>
            <div style={{ textAlign:'center' as const }}>
              <a href="/signup?role=tradie" style={{ fontSize:'13px', color:'#D4522A', textDecoration:'none', fontWeight:500 }}>Create a free account instead →</a>
            </div>
          </div>
        </div>
      )}

      {/* Profile incomplete notice */}
      {profileIncomplete && (
        <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'20px 24px', marginBottom:'20px' }}>
          <p style={{ fontSize:'14px', fontWeight:600, color:'#D4522A', margin:'0 0 6px' }}>⚠ Complete your profile before inviting clients</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', margin:'0 0 14px', lineHeight:'1.6' }}>Your business name, licence number, and trade categories are required. This information appears on the scope agreement your client will sign.</p>
          <a href="/tradie/profile">
            <button type="button" style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px 20px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>Complete your profile →</button>
          </a>
        </div>
      )}

      {/* Signup prompt modal */}
      {showSignupPrompt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'24px' }}>
          <div style={{ background:'white', borderRadius:'14px', padding:'32px', maxWidth:'420px', width:'100%', textAlign:'center' as const }}>
            <p style={{ fontSize:'28px', marginBottom:'12px' }}>🎉</p>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'10px' }}>
              {guestInviteCount >= GUEST_LIMIT ? "You've used your free invites" : 'Invitation sent!'}
            </h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:1.7, marginBottom:'24px' }}>
              Sign up free to unlock unlimited client invites, track all your leads, manage jobs end-to-end and get paid through Steadyhand.
            </p>
            <a href="/signup?role=tradie" style={{ display:'block', background:'#D4522A', color:'white', padding:'13px 24px', borderRadius:'8px', fontSize:'15px', fontWeight:500, textDecoration:'none', marginBottom:'10px' }}>
              Create your free tradie account →
            </a>
            <button type="button" onClick={() => setShowSignupPrompt(false)} style={{ background:'none', border:'none', fontSize:'13px', color:'#9AA5AA', cursor:'pointer' }}>
              {guestInviteCount >= GUEST_LIMIT ? 'Close' : 'Continue without signing up'}
            </button>
          </div>
        </div>
      )}

      <div style={{ background:'#0A0A0A', padding:'28px 24px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'4px' }}>Lead management</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:'0 0 4px' }}>CLIENTS & LEADS</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Invite a new client to Steadyhand, or import an existing lead from your CRM, paper records or phone calls.</p>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'24px' }}>

        {/* Mode tabs */}
        <div style={{ display:'flex', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', overflow:'hidden', marginBottom:'20px' }}>
          {[
            { key:'invite', label:'✉️  Invite a client', sub:'Send them a Steadyhand invitation' },
            { key:'import', label:'📥  Import a lead', sub:'From Simpro, Tradify, paper or phone' },
          ].map(t => (
            <button key={t.key} type="button" onClick={() => {
                setMode(t.key as any); setSent(false); if (profile?.tradie?.id) setSendError(null)
                if (t.key === 'invite' && !profile?.tradie?.id && guestInviteCount === 0 && !localStorage.getItem('sh_invite_info_seen')) {
                  setShowFreeInviteInfo(true)
                }
              }}
              style={{ flex:1, padding:'14px 16px', border:'none', background: mode === t.key ? '#0A0A0A' : 'transparent', cursor:'pointer', textAlign:'left' as const, transition:'background 0.15s' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color: mode === t.key ? 'rgba(216,228,225,0.9)' : '#0A0A0A', margin:'0 0 2px' }}>{t.label}</p>
              <p style={{ fontSize:'11px', color: mode === t.key ? 'rgba(216,228,225,0.45)' : '#7A9098', margin:0 }}>{t.sub}</p>
            </button>
          ))}
        </div>

        {sendError && (
          <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.25)', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px' }}>
            <p style={{ fontSize:'13px', color:'#D4522A', margin:0 }}>⚠ {sendError}</p>
          </div>
        )}
        {sent && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'10px', padding:'14px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'18px' }}>✓</span>
            <p style={{ fontSize:'13px', color:'#2E7D60', margin:0, fontWeight:500 }}>
              {mode === 'invite' ? 'Invitation sent — you will be notified when they respond.' : 'Lead imported successfully.'}
            </p>
          </div>
        )}

        {/* ── Invite mode — referral panel only ── */}
        {mode === 'invite' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'14px 20px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>RECOMMEND STEADYHAND</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Share Steadyhand with a client. They sign up, post their job, and invite you directly — the full pipeline then runs as normal.</p>
            </div>
            <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>

              {/* Link copy */}
              <div>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#4A5E64', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'8px' }}>Steadyhand link</p>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <div style={{ flex:1, background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#0A0A0A', fontFamily:'monospace' }}>
                    steadyhandtrade.app
                  </div>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText('https://steadyhandtrade.app'); }}
                    style={{ background:'#0A0A0A', color:'white', border:'none', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:500, cursor:'pointer', flexShrink:0 }}>
                    Copy link
                  </button>
                </div>
              </div>

              {/* SMS template */}
              <div>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#4A5E64', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'8px' }}>Ready-to-send message</p>
                <div style={{ background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', fontSize:'13px', color:'#4A5E64', lineHeight:'1.65' }}>
                  Hi — I use Steadyhand to manage jobs, quotes and payments. It keeps everything transparent and documented for both of us. You can post your job at <strong style={{ color:'#0A0A0A' }}>steadyhandtrade.app</strong> — once you&apos;re in, invite me and I&apos;ll be notified to quote.
                </div>
                <button type="button"
                  onClick={() => navigator.clipboard.writeText('Hi — I use Steadyhand to manage jobs, quotes and payments. It keeps everything transparent and documented for both of us. You can post your job at steadyhandtrade.app — once you're in, invite me and I'll be notified to quote.')}
                  style={{ marginTop:'8px', background:'transparent', color:'#4A5E64', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', cursor:'pointer' }}>
                  Copy message
                </button>
              </div>

              {/* How it works */}
              <div style={{ background:'rgba(46,125,96,0.05)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#2E7D60', margin:'0 0 8px' }}>How the client pipeline works</p>
                {[
                  'Client signs up free at steadyhandtrade.app',
                  'They post their job and describe what they need',
                  'They find you in the directory and send an invite',
                  'You receive a quote request — the full Steadyhand pipeline begins',
                ].map((step, i) => (
                  <div key={i} style={{ display:'flex', gap:'10px', marginBottom: i < 3 ? '6px' : 0 }}>
                    <span style={{ fontSize:'11px', fontWeight:600, color:'#2E7D60', minWidth:'18px' }}>{i+1}.</span>
                    <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{step}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ── Import mode ── */}
        {mode === 'import' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'14px 20px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>IMPORT A LEAD</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Transfer a lead from your existing system into Steadyhand. All fields are stored privately against your account.</p>
            </div>
            <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>

              {/* Source */}
              <div>
                <label style={lbl}>Where is this lead coming from?</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
                  {SOURCES.map(s => (
                    <button key={s.value} type="button" onClick={() => setImp(f => ({ ...f, source: s.value }))}
                      style={{ padding:'7px 14px', borderRadius:'100px', border:'1.5px solid ' + (imp.source === s.value ? '#0A0A0A' : 'rgba(28,43,50,0.2)'), background: imp.source === s.value ? '#0A0A0A' : 'transparent', color: imp.source === s.value ? 'white' : '#4A5E64', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client details */}
              <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Client details</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                  <div><label style={lbl}>Client name *</label><input type="text" placeholder="Jane Smith" value={imp.client_name} onChange={setM('client_name')} style={inp} /></div>
                  <div><label style={lbl}>Phone</label><input type="tel" placeholder="04xx xxx xxx" value={imp.client_phone} onChange={setM('client_phone')} style={inp} /></div>
                </div>
                <div style={{ marginBottom:'12px' }}><label style={lbl}>Email (required to invite client)</label><input type="email" placeholder="jane@example.com" value={imp.client_email} onChange={setM('client_email')} style={inp} /></div>
                <div className='form-2col' style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
                  <div><label style={lbl}>Street address</label><input type="text" placeholder="123 Example St" value={imp.address} onChange={setM('address')} style={inp} /></div>
                  <div><label style={lbl}>Suburb</label><input type="text" placeholder="Fremantle" value={imp.suburb} onChange={setM('suburb')} style={inp} /></div>
                </div>
              </div>

              {/* Job details */}
              <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Job details</p>
                <div style={{ marginBottom:'12px' }}><label style={lbl}>Job title *</label><input type="text" placeholder="e.g. Bathroom retile — Cottesloe" value={imp.job_title} onChange={setM('job_title')} style={inp} /></div>
                <div className='form-2col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                  <div><label style={lbl}>Trade category</label>
                    <select value={imp.trade_category} onChange={setM('trade_category')} style={inp}>
                      <option value="">Select trade</option>
                      {TRADES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Preferred start date</label><input type="date" value={imp.preferred_start} onChange={setM('preferred_start')} style={inp} /></div>
                </div>
                <div style={{ marginBottom:'12px' }}><label style={lbl}>Job description / scope notes</label><textarea placeholder="Describe what was discussed — scope, inclusions, any special conditions..." value={imp.job_description} onChange={setM('job_description')} style={{ ...inp, minHeight:'90px', resize:'vertical' as const }} /></div>
                <div><label style={lbl}>Existing quote / price indication (optional)</label>
                  <div style={{ display:'flex', alignItems:'center', background:'#F4F8F7', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', overflow:'hidden' }}>
                    <span style={{ padding:'10px 12px', fontSize:'13px', color:'#7A9098', borderRight:'1px solid rgba(28,43,50,0.1)', background:'rgba(28,43,50,0.03)' }}>$</span>
                    <input type="number" placeholder="0" value={imp.existing_quote_amount} onChange={setM('existing_quote_amount')} style={{ flex:1, padding:'10px 12px', border:'none', background:'transparent', fontSize:'14px', color:'#0A0A0A', outline:'none' }} />
                  </div>
                </div>
              </div>

              {/* Internal notes */}
              <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:0 }}>Internal notes</p>
                  <span style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'100px', padding:'2px 8px' }}>🔒 Private</span>
                </div>
                <textarea placeholder="e.g. Met at trade show. Has used 3 tradies in last 12 months. Wants fixed-price quote. Budget around $15k. Good client, referred by Mark." value={imp.internal_notes} onChange={setM('internal_notes')} style={{ ...inp, minHeight:'80px', resize:'vertical' as const }} />
              </div>

              {/* Invite toggle */}
              {imp.client_email && (
                <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
                  <input type="checkbox" checked={imp.invite_client} onChange={e => setImp(f => ({ ...f, invite_client: e.target.checked }))} style={{ marginTop:'2px', width:'16px', height:'16px', flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 3px' }}>Also send client a Steadyhand invitation</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>
                      An email will be sent to <strong>{imp.client_email}</strong> inviting them to confirm the job on Steadyhand. They will be shown the job details you have entered. Uncheck to import privately without notifying them yet.
                    </p>
                  </div>
                </div>
              )}

              <button type="button" onClick={handleImport} disabled={sending || !imp.client_name || !imp.job_title || profileIncomplete}
                style={{ background: sending || !imp.client_name || !imp.job_title ? 'rgba(28,43,50,0.3)' : '#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                {sending ? 'Importing...' : imp.invite_client && imp.client_email ? 'Import lead & send invitation →' : 'Import lead →'}
              </button>
            </div>
          </div>
        )}

        {/* Lead history */}
        {leads.length > 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>LEAD HISTORY</p>
            </div>
            <div style={{ padding:'8px' }}>
              {leads.map((l: any) => {
                const src = SOURCES.find(s => s.value === l.source)
                return (
                  <div key={l.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:'8px', gap:'12px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
                      <span style={{ fontSize:'16px', flexShrink:0 }}>{src?.icon || '📌'}</span>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{l.client_name || l.client_email}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{l.job_title || 'No job title'} · {src?.label || l.source} · {new Date(l.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:(statusColor[l.status]||'#7A9098')+'18', border:'1px solid '+(statusColor[l.status]||'#7A9098')+'40', color:statusColor[l.status]||'#7A9098', fontWeight:500, flexShrink:0 }}>{l.status}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
