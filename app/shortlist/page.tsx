'use client'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StageRail } from '@/components/ui'
import { HintPanel } from '@/components/ui/HintPanel'

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sendError, setSendError] = useState<string|null>(null)
  const [selectedTradies, setSelectedTradies] = useState<string[]>([])
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [tab, setTab] = useState<'matches'|'invite'|'requested'|'directory'>('invite')
  const [showNextStepModal, setShowNextStepModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ business_name:'', email:'', trade_category:'', phone:'' })
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [allQuotes, setAllQuotes] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible)').eq('id', session.user.id).single()
      setProfile(prof)

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', session.user.id)
        .in('status', ['matching', 'shortlisted', 'agreement', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('created_at', { ascending: false })

      if (!jobsData || jobsData.length === 0) { setLoading(false); return }

      const job = jobsData[0]
      setJobs(jobsData)
      setSelectedJob(job)
      await loadQuoteRequests(job.id)

      // Try to load existing shortlist first
      const { data: existingShortlist } = await supabase
        .from('shortlist')
        .select('*, tradie:tradie_profiles(*, profile:profiles(*))')
        .eq('job_id', job.id)
        .order('rank', { ascending: true })

      if (existingShortlist && existingShortlist.length > 0) {
        setShortlist(existingShortlist)
        setLoading(false)
        return
      }

      // Matching disabled — invite-only mode
      setLoading(false)
    }
    init()
  }, [])


  const loadQuoteRequests = async (jobId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('quote_requests')
      .select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible, rating_avg, jobs_completed)')
      .eq('job_id', jobId)
    setQuoteRequests(data || [])
    if (data && data.length > 0) { setSent(true); setTab('requested') }
    const { data: qs } = await supabase.from('quotes').select('id').eq('job_id', jobId)
    setAllQuotes(qs || [])
  }

  const toggleTradie = (tradieId: string) => {
    setSelectedTradies(prev =>
      prev.includes(tradieId) ? prev.filter(id => id !== tradieId) : prev.length >= 4 ? prev : [...prev, tradieId]
    )
  }

  const sendQuoteRequests = async () => {
    if (selectedTradies.length === 0 && pendingInvites.length === 0) return
    setSending(true)
    try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    for (const tradieId of selectedTradies) {
      await supabase.from('quote_requests').upsert({ job_id: selectedJob.id, tradie_id: tradieId, status: 'requested', requested_at: new Date().toISOString() }, { onConflict: 'job_id,tradie_id' })
      await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'tradie_selected', job_id: selectedJob.id }) }).catch(() => {})
    }
    for (const invite of pendingInvites) {
      await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id: selectedJob?.id, client_id: session?.user.id, ...invite }) }).catch(() => {})
    }
    await supabase.from('jobs').update({ status: 'shortlisted', quote_request_sent_at: new Date().toISOString() }).eq('id', selectedJob.id)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'consult_ready', job_id: selectedJob.id }),
    }).catch(() => {})
    await loadQuoteRequests(selectedJob.id)
    setSent(true)
    setShowNextStepModal(true)
    } catch (e) {
      console.error('sendQuoteRequests error:', e)
      setSendError('Could not send quote requests — please try again.')
    }
    setSending(false)
  }

  const addInvite = () => {
    if (!inviteForm.business_name || !inviteForm.email) return
    setPendingInvites(prev => [...prev, { ...inviteForm }])
    setInviteForm({ business_name:'', email:'', trade_category:'', phone:'' })
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 2000)
  }

  const removeInvite = (i: number) => setPendingInvites(prev => prev.filter((_, idx) => idx !== i))



  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={false}   />
      <StageRail currentPath="/shortlist" jobStatus={selectedJob?.status} />
    </div>
  )

  const isPastStage = selectedJob && ['agreement', 'delivery', 'signoff', 'warranty', 'complete'].includes(selectedJob.status)

  if (loading) return (
    <>
      {nav}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}>
        <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
      </div>
    </>
  )

  const totalSelected = selectedTradies.length + pendingInvites.length
  const inpStyle = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }

  return (
    <>
      {nav}
      <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', padding:'32px 24px' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#2E6A8F', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Meet your options</span>
          </div>
          {(matchError || sendError) && (
            <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
              <p style={{ fontSize:'13px', color:'#D4522A', margin:0 }}>{matchError || sendError}</p>
            </div>
          )}
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>YOUR JOB</h1>

          {!isPastStage && <HintPanel color="#2E6A8F" hints={[
            "Check each tradie's Dialogue Rating — it reflects how transparently they communicate on pricing, risk and scope, not just whether they did good work.",
            "A tradie's response time to your quote request is itself a signal. Fast, detailed responses suggest an organised business.",
            "If you already have a tradie in mind, you can invite them directly — their quote will sit alongside the Steadyhand matches for comparison.",
          ]} />}

          {jobs.length > 1 && (
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'6px', display:'block' }}>Select job</label>
              <select value={selectedJob?.id || ''} onChange={async e => {
                const job = jobs.find(j => j.id === e.target.value)
                setSelectedJob(job)
                setSelectedTradies([])
                setSent(false)
                setTab('matches')
          
                await loadQuoteRequests(job.id)
              }} style={{ padding:'10px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', width:'100%' }}>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.suburb}</option>)}
              </select>
            </div>
          )}

          {selectedJob && (
            <div style={{ borderBottom:'1px solid rgba(28,43,50,0.1)', paddingBottom:'14px', marginBottom:'16px' }}>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.5px', margin:'0 0 3px' }}>{selectedJob.title}</h3>
              <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>{selectedJob.trade_category} · {selectedJob.suburb}</p>
            </div>
          )}

          {/* REQUEST CARD — shown when tradies are selected */}
          {selectedJob && totalSelected > 0 && !sent && !pendingConfirm && (
            <div style={{ borderBottom:'1px solid rgba(28,43,50,0.1)', paddingBottom:'14px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>{totalSelected} tradie{totalSelected > 1 ? 's' : ''} selected</p>
              <button type="button" onClick={() => { setPendingConfirm(true); setTab('requested') }}
                style={{ background:'#D4522A', color:'white', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
                Review selections →
              </button>
            </div>
          )}

          {selectedJob && pendingConfirm && !sent && (
            <div style={{ borderBottom:'1px solid rgba(28,43,50,0.1)', paddingBottom:'14px', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                <div>
                  <p style={{ fontSize:'13px', color:'#1C2B32', marginBottom:'3px' }}>Ready to send {totalSelected} quote request{totalSelected > 1 ? 's' : ''}?</p>
                  <p style={{ fontSize:'12px', color:'#7A9098' }}>Each tradie will be notified and invited to book a consult time.</p>
                </div>
                <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                  <button type="button" onClick={() => setPendingConfirm(false)}
                    style={{ background:'transparent', color:'#1C2B32', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>
                    ← Edit
                  </button>
                  <button type="button" onClick={sendQuoteRequests} disabled={sending}
                    style={{ background:'#D4522A', color:'white', padding:'10px 22px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Sending...' : 'Confirm and send →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SENT CONFIRMATION CARD */}
          {selectedJob && sent && (
            <div style={{ borderBottom:'1px solid rgba(28,43,50,0.08)', paddingBottom:'14px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
              <p style={{ fontSize:'13px', color:'#2E7D60', margin:0 }}>✓ Quote requests sent — tradies have been notified.</p>
              <button type="button" onClick={() => setShowNextStepModal(true)}
                style={{ background:'none', border:'none', fontSize:'13px', color:'#2E7D60', fontWeight:500, cursor:'pointer', textDecoration:'underline', flexShrink:0 }}>
                What happens next? →
              </button>
            </div>
          )}

          {/* NEXT STEP MODAL */}
          {showNextStepModal && (
            <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(28,43,50,0.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
              <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'500px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
                <div style={{ background:'#1C2B32', padding:'20px 28px', borderBottom:'2px solid #2E7D60' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:0 }}>QUOTE REQUESTS SENT</p>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>Your selected tradies have been notified</p>
                </div>
                <div style={{ padding:'24px 28px' }}>
                  <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'20px' }}>
                    You have two options from here. Both are valid — it depends on how much protection you want before quoting begins.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'24px' }}>
                    <a href="/consult" style={{ textDecoration:'none' }}>
                      <div style={{ background:'white', border:'2px solid #9B6B9B', borderRadius:'12px', padding:'16px 18px', cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                          <span style={{ fontSize:'20px' }}>📋</span>
                          <p style={{ fontSize:'14px', fontWeight:600, color:'#9B6B9B', margin:0 }}>Book a site consult first</p>
                          <span style={{ fontSize:'10px', background:'rgba(155,107,155,0.12)', color:'#9B6B9B', border:'1px solid rgba(155,107,155,0.3)', borderRadius:'4px', padding:'2px 7px', fontWeight:600, marginLeft:'auto' }}>Recommended</span>
                        </div>
                        <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                          Visit the site with each tradie before they quote. Both parties record independent notes — creating a shared record of what was seen, discussed and expected. This protects you both if the scope is ever disputed.
                        </p>
                      </div>
                    </a>
                    <div style={{ background:'white', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'12px', padding:'16px 18px', cursor:'pointer' }}
                      onClick={async () => {
                        if (!selectedJob) { setShowNextStepModal(false); return }
                        const supabase = (await import('@/lib/supabase/client')).createClient()
                        const { data: { session } } = await supabase.auth.getSession()
                        await supabase.from('site_assessments').upsert({
                          job_id: selectedJob.id,
                          client_what_discussed: 'Consult skipped by client — proceeded directly to quoting.',
                        }, { onConflict: 'job_id' })
                        await supabase.from('jobs').update({ status: 'compare' }).eq('id', selectedJob.id)
                        await supabase.from('job_messages').insert({
                          job_id: selectedJob.id,
                          sender_id: session?.user.id,
                          body: 'Consult skipped — client has proceeded directly to quoting.',
                        })
                        window.location.href = '/compare'
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                        <span style={{ fontSize:'20px' }}>⚡</span>
                        <p style={{ fontSize:'14px', fontWeight:600, color:'#1C2B32', margin:0 }}>Skip consult — go straight to quotes</p>
                      </div>
                      <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                        Tradies will quote from your written request only. You will be notified when quotes arrive on the Compare page. This is faster but means there is no shared site record before work is priced.
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowNextStepModal(false)}
                    style={{ display:'block', margin:'0 auto', background:'none', border:'none', fontSize:'12px', color:'#9AA5AA', cursor:'pointer', textDecoration:'underline' }}>
                    I'll decide later
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            {/* TABS: invite + requested */}
            <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
              {[
                { key:'invite', label:'Invite a tradie' },
                { key:'requested', label: pendingConfirm ? 'Review & confirm' : 'Requested', count: pendingConfirm ? selectedTradies.length : quoteRequests.length },
              ].map(t => (
                <button key={t.key} type="button" onClick={() => setTab(t.key as any)}
                  style={{ flex:1, padding:'14px 12px', border:'none', borderBottom: tab === t.key ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#2E6A8F' : '#7A9098', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  {t.label}
                  {(t as any).count > 0 && <span style={{ background: tab === t.key ? '#2E6A8F' : 'rgba(28,43,50,0.1)', color: tab === t.key ? 'white' : '#7A9098', fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'100px' }}>{(t as any).count}</span>}
                </button>
              ))}
            </div>
            {/* Secondary actions */}
            {tab === 'invite' && (
              <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'8px 16px', background:'rgba(28,43,50,0.02)', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                {tab !== 'matches' && (
                  <button type="button" onClick={() => setTab('matches')}
                    style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    ← Back to matches
                  </button>
                )}
                {tab === 'directory' && (
              <div style={{ padding:'20px' }}>
                <button type="button" onClick={() => setTab('matches')}
                  style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:'16px', textDecoration:'underline' }}>
                  ← Back to matches
                </button>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>
                  Browse Steadyhand-vetted trade businesses in Western Australia. Search by keyword — try specialisations like 'heritage', 'solar', 'commercial', or 'strata' — or browse by trade category and suburb.
                </p>

                {/* Search controls */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Keywords</label>
                    <input type="text" placeholder="e.g. bathroom, heritage, solar..." value={directorySearch}
                      onChange={e => setDirectorySearch(e.target.value)}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Trade category</label>
                    <select value={directoryCategory} onChange={e => setDirectoryCategory(e.target.value)}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }}>
                      <option value=''>All trades</option>
                      {['Electrical','Plumbing & Gas','Carpentry & Joinery','Painting','Tiling','Landscaping','Building','HVAC','Roofing','Concreting','Fencing','Plastering','Solar','Security'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:'12px', position:'relative' as const }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Suburb</label>
                  <input type="text" placeholder="e.g. Subiaco, Fremantle..." value={directorySuburb}
                    onChange={e => { setDirectorySuburb(e.target.value); searchSuburbs(e.target.value) }}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
                  {suburbSuggestions.length > 0 && (
                    <div style={{ position:'absolute' as const, top:'100%', left:0, right:0, background:'white', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', zIndex:50, overflow:'hidden', marginTop:'2px' }}>
                      {suburbSuggestions.map((s, i) => (
                        <div key={i} onClick={() => { setDirectorySuburb(s); setSuburbSuggestions([]) }}
                          style={{ padding:'9px 12px', fontSize:'13px', color:'#1C2B32', cursor:'pointer', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={searchDirectory} disabled={directoryLoading}
                  style={{ width:'100%', background:'#1C2B32', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', marginBottom:'20px', opacity: directoryLoading ? 0.7 : 1 }}>
                  {directoryLoading ? 'Searching...' : 'Search directory →'}
                </button>

                {/* Results */}
                {directoryTradies.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                    {directoryTradies.map(t => (
                      <div key={t.id} style={{ background:'#C8D5D2', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1 }}>
                            <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'white', flexShrink:0 }}>
                              {t.business_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', marginBottom:'2px' }}>{t.business_name}</p>
                              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{t.trade_categories?.slice(0,2).join(', ')} · {t.service_areas?.[0]}</p>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const, alignItems:'center' }}>
                            <span style={{ fontSize:'11px', color:'#2E7D60', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'2px 8px' }}>✓ Steadyhand-vetted</span>
                            {t.rating_avg > 0 && <span style={{ fontSize:'11px', color:'#4A5E64', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'100px', padding:'2px 8px' }}>⭐ {Number(t.rating_avg).toFixed(1)}</span>}
                          </div>
                        </div>
                        {t.bio && <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.55', marginTop:'10px', marginBottom:'10px' }}>{t.bio}</p>}
                        <button type="button" onClick={() => {
                          if (!selectedTradies.includes(t.id)) toggleTradie(t.id)
                          setTab('matches')
                        }}
                          style={{ fontSize:'12px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'6px', padding:'6px 12px', cursor:'pointer' }}>
                          + Add to quote request
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {directoryTradies.length === 0 && !directoryLoading && (
                  <div style={{ textAlign:'center' as const, padding:'32px', color:'#7A9098', fontSize:'13px' }}>
                    Search above to browse Steadyhand-vetted tradies in your area.
                  </div>
                )}
              </div>
            )}

            {tab === 'requested' && (
              <div style={{ padding:'20px' }}>

                {/* PENDING CONFIRM STATE */}
                {pendingConfirm && !sent && (
                  <div>
                    <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'12px' }}>Review your selections before sending. You can remove tradies below.</p>
                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
                      {selectedTradies.map((id, idx) => {
                        const entry = shortlist.find(e => e.tradie?.id === id)
                        if (!entry) return null
                        return (
                          <div key={id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom: idx < selectedTradies.length - 1 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'white', fontFamily:'var(--font-aboreto), sans-serif', flexShrink:0 }}>
                                {entry.tradie?.business_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{entry.tradie?.business_name}</p>
                                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{entry.tradie?.trade_categories?.slice(0,1).join(', ')} · {entry.tradie?.service_areas?.[0]}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => { toggleTradie(id); if (selectedTradies.length <= 1) setPendingConfirm(false) }}
                              style={{ fontSize:'12px', color:'#D4522A', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>
                              Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <button type="button" onClick={() => setPendingConfirm(false)}
                      style={{ fontSize:'13px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                      ← Back to matches
                    </button>
                  </div>
                )}

                {/* EMPTY / NOT YET SENT */}
                {!pendingConfirm && (quoteRequests.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px', color:'#7A9098', fontSize:'14px' }}>
                    No quote requests sent yet. Select tradies from the Steadyhand matches tab or invite your own.
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign:'center' as const, padding:'16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', marginBottom:'20px' }}>
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>✅</div>
                      <p style={{ fontSize:'15px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>Quote requests sent</p>
                      <p style={{ fontSize:'13px', color:'#4A5E64' }}>We have notified {quoteRequests.length} tradie{quoteRequests.length > 1 ? 's' : ''} about your job.</p>
                    </div>
                    <div style={{ background:'#C8D5D2', borderRadius:'10px', padding:'16px', marginBottom:'20px' }}>
                      <p style={{ fontSize:'11px', fontWeight:600, color:'#1C2B32', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'12px' }}>What happens next</p>
                      {[
                        { step:'1', text:'Tradies review your job and submit their quotes — this usually takes 1–2 business days.' },
                        { step:'2', text:'You will receive an email notification when each quote arrives.' },
                        { step:'3', text:'Once you have quotes, go to the Compare stage to review them side by side.' },
                        { step:'4', text:'Accept the quote you prefer and sign the contract before work starts.' },
                      ].map(s => (
                        <div key={s.step} style={{ display:'flex', gap:'10px', marginBottom:'10px', alignItems:'flex-start' }}>
                          <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', fontWeight:600, flexShrink:0, marginTop:'1px' }}>{s.step}</div>
                          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', margin:0 }}>{s.text}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'16px' }}>
                      {quoteRequests.map(qr => (
                        <div key={qr.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'white', flexShrink:0 }}>
                              {qr.tradie?.business_name?.charAt(0) || '?'}
                            </div>
                            <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{qr.tradie?.business_name}</p>
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'100px', background: qr.status === 'accepted' ? 'rgba(46,125,96,0.1)' : 'rgba(192,120,48,0.1)', color: qr.status === 'accepted' ? '#2E7D60' : '#C07830' }}>
                            {qr.status === 'requested' ? '⏳ Awaiting quote' : qr.status === 'accepted' ? '✓ Accepted' : qr.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Consult CTA - primary action */}
                    <div style={{ background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.25)', borderRadius:'10px', padding:'14px 16px', marginBottom:'12px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#9B6B9B', marginBottom:'4px' }}>Before quotes arrive — book a site consult</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', marginBottom:'10px' }}>A consult creates a shared record of what was discussed before any quote is submitted. It protects both parties and produces better quotes.</p>
                      <a href="/consult">
                        <button type="button" style={{ width:'100%', background:'#9B6B9B', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                          Go to consult →
                        </button>
                      </a>
                    </div>
                    <button type="button" onClick={() => window.location.href = '/quotes'}
                      style={{ width:'100%', background:'transparent', color:'#2E6A8F', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(46,106,143,0.3)', cursor:'pointer' }}>
                      Skip to compare quotes
                    </button>


                  </>
                ))}
              </div>
            )}
          </div>

          {!sent && totalSelected > 0 && (
            <div style={{ marginTop:'16px', background:'#1C2B32', borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
              <div>
                <p style={{ fontSize:'14px', fontWeight:500, color:'rgba(216,228,225,0.9)', marginBottom:'2px' }}>
                  {totalSelected} tradie{totalSelected > 1 ? 's' : ''} selected
                  {selectedTradies.length > 0 && pendingInvites.length > 0 && ' (' + selectedTradies.length + ' matched + ' + pendingInvites.length + ' invited)'}
                </p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>
                  {totalSelected < 2 ? 'Consider selecting at least 2 for comparison' : 'Ready to send quote requests'}
                </p>
              </div>
              <button type="button" onClick={sendQuoteRequests} disabled={sending}
                style={{ background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: sending ? 0.7 : 1, flexShrink:0 }}>
                {sending ? 'Sending...' : 'Request quotes →'}
              </button>
            </div>
          )}

        </div>
      </div>
      <StageGuideModal
        storageKey="seen_shortlist_guide"
        stageNumber={2}
        stageColor="#2E6A8F"
        stageLabel="Match"
        headline="Choose who you want to quote"
        intro="Steadyhand has matched you with verified trade businesses based on your trade, suburb and job details. Review each one and select who you want to invite to quote."
        checklist={[
          { text: 'Request quotes from 2 to 4 tradies for the best comparison', emphasis: true },
          { text: 'Every tradie shown has had their licence and insurance verified', emphasis: false },
          { text: 'You can invite a tradie you already know — their quote sits alongside the others', emphasis: false },
          { text: 'Tradies are ranked by fit and track record — not by who paid to be listed', emphasis: false },
        ]}
        warning="Selecting just one tradie means no comparison. Two to four quotes is the Steadyhand recommendation for any job over $1,000."
        ctaLabel="Review my matches"
      />
    </>

  )
}
