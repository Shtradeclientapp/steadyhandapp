'use client'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'
import { StageRail, WaitingPanel } from '@/components/ui'
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
  const [tab, setTab] = useState<'invite'|'requested'>('invite')
  const [showNextStepModal, setShowNextStepModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ business_name:'', email:'', trade_category:'', phone:'', personal_message:'' })
  const [inviteSent, setInviteSent] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [allQuotes, setAllQuotes] = useState<any[]>([])

  const supabase = useSupabase()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible)').eq('id', session.user.id).single()
      setProfile(prof)

      const urlJobId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('job_id') : null

      let jobsQuery = supabase
        .from('jobs')
        .select('*')
        .eq('client_id', session.user.id)
        .in('status', ['draft', 'matching', 'shortlisted', 'consult', 'assess', 'compare', 'quote', 'agreement', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('created_at', { ascending: false })

      if (urlJobId) jobsQuery = jobsQuery.eq('id', urlJobId)

      const { data: jobsData } = await jobsQuery

      if (!jobsData || jobsData.length === 0) { setLoading(false); return }

      const job = urlJobId ? jobsData[0] : jobsData[0]
      setJobs(jobsData)
      setSelectedJob(job)
      await loadQuoteRequests(job.id)
      setLoading(false)
    }
    init()
  }, [])

  const loadQuoteRequests = async (jobId: string) => {
    const { data } = await supabase
      .from('quote_requests')
      .select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible, rating_avg, jobs_completed)')
      .eq('job_id', jobId)
    setQuoteRequests(data || [])
    if (data && data.length > 0) { setSent(true); setTab('requested') }
    const { data: qs } = await supabase.from('quotes').select('id').eq('job_id', jobId)
    setAllQuotes(qs || [])
  }

  const sendQuoteRequests = async () => {
    if (selectedTradies.length === 0 && pendingInvites.length === 0) return
    if (!selectedJob?.id) { setSendError('No job selected — please refresh and try again.'); return }
    setSending(true)
    setSendError(null)
    const { data: { session } } = await supabase.auth.getSession()

    for (const tradieId of selectedTradies) {
      const { error: qrErr } = await supabase.from('quote_requests').upsert(
        { job_id: selectedJob.id, tradie_id: tradieId, status: 'requested', requested_at: new Date().toISOString() },
        { onConflict: 'job_id,tradie_id' }
      )
      if (qrErr) {
        console.error('quote_requests error:', qrErr)
        setSendError('Quote request failed: ' + qrErr.message)
        setSending(false)
        return
      }
      await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'tradie_selected', job_id: selectedJob.id, tradie_id: tradieId }) }).catch(console.error)
    }

    for (const invite of pendingInvites) {
      await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id: selectedJob?.id, client_id: session?.user.id, ...invite, personal_message: invite.personal_message || '' }) }).catch(console.error)
    }

    const { error: jobErr } = await supabase.from('jobs').update({ status: 'shortlisted', quote_request_sent_at: new Date().toISOString() }).eq('id', selectedJob.id)
    if (jobErr) {
      console.error('jobs update error:', jobErr)
      setSendError('Job status update failed: ' + jobErr.message)
      setSending(false)
      return
    }

    await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'consult_ready', job_id: selectedJob.id }) }).catch(console.error)
    await loadQuoteRequests(selectedJob.id)
    setSent(true)
    setShowNextStepModal(true)
    setSending(false)
  }

  const addInvite = () => {
    if (!inviteForm.business_name || !inviteForm.email) return
    setPendingInvites(prev => [...prev, { ...inviteForm }])
    setInviteForm({ business_name:'', email:'', trade_category:'', phone:'', personal_message:'' })
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 2000)
  }

  const removeInvite = (i: number) => setPendingInvites(prev => prev.filter((_, idx) => idx !== i))

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={false} />
      <StageRail currentPath="/shortlist" jobStatus={selectedJob?.status} />
      {profile?.role === 'tradie' && selectedJob && (
        <div style={{ maxWidth:'780px', margin:'0 auto', padding:'24px 24px 0' }}>
          <WaitingPanel role="tradie" stage="match" jobId={selectedJob?.id} otherPartyName={selectedJob?.client?.full_name} />
        </div>
      )}
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
  const inpStyle = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }

  return (
    <>
      {nav}
      <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', padding:'32px 24px' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#2E6A8F', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Invite a tradie</span>
          </div>

          {sendError && (
            <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
              <p style={{ fontSize:'13px', color:'#D4522A', margin:0 }}>{sendError}</p>
            </div>
          )}

          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'6px' }}>YOUR JOB</h1>

          {!isPastStage && (
            <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#2E6A8F', marginBottom:'8px', letterSpacing:'0.2px' }}>Why invite-only?</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'10px' }}>
                Algorithms that rank tradies often prioritise the wrong things — ad spend, review volume, or proximity. The most reliable signal is still the one you already have: someone you know, or someone a trusted person knows.
              </p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:0 }}>
                The act of invitation matters. It begins the relationship with accountability on both sides. Steadyhand then wraps that relationship in documentation, milestone payments and warranty — so the trust you already have is protected by structure.
              </p>
            </div>
          )}

          {jobs.length > 1 && (
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#0A0A0A', marginBottom:'6px', display:'block' }}>Select job</label>
              <select value={selectedJob?.id || ''} onChange={async e => {
                const job = jobs.find((j: any) => j.id === e.target.value)
                setSelectedJob(job)
                setSelectedTradies([])
                setSent(false)
                setTab('invite')
                await loadQuoteRequests(job.id)
              }} style={{ padding:'10px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', width:'100%' }}>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title} — {j.suburb}</option>)}
              </select>
            </div>
          )}

          {selectedJob && (
            <div style={{ borderBottom:'1px solid rgba(28,43,50,0.1)', paddingBottom:'14px', marginBottom:'16px' }}>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 3px' }}>{selectedJob.title}</h3>
              <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>{selectedJob.trade_category} · {selectedJob.suburb}</p>
            </div>
          )}

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
                  <p style={{ fontSize:'13px', color:'#0A0A0A', marginBottom:'3px' }}>Ready to send {totalSelected} quote request{totalSelected > 1 ? 's' : ''}?</p>
                  <p style={{ fontSize:'12px', color:'#7A9098' }}>Each tradie will be notified and invited to book a consult time.</p>
                </div>
                <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                  <button type="button" onClick={() => setPendingConfirm(false)}
                    style={{ background:'transparent', color:'#0A0A0A', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>
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

          {selectedJob && sent && (
            <div style={{ borderBottom:'1px solid rgba(28,43,50,0.08)', paddingBottom:'14px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
              <p style={{ fontSize:'13px', color:'#2E7D60', margin:0 }}>✓ Quote requests sent — tradies have been notified.</p>
              <button type="button" onClick={() => setShowNextStepModal(true)}
                style={{ background:'none', border:'none', fontSize:'13px', color:'#2E7D60', fontWeight:500, cursor:'pointer', textDecoration:'underline', flexShrink:0 }}>
                What happens next? →
              </button>
            </div>
          )}

          {showNextStepModal && (
            <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(28,43,50,0.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
              <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'500px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
                <div style={{ background:'#0A0A0A', padding:'20px 28px', borderBottom:'2px solid #2E7D60' }}>
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
                          Visit the site with each tradie before they quote. Both parties record independent notes — creating a shared record of what was seen, discussed and expected.
                        </p>
                      </div>
                    </a>
                    <div style={{ background:'white', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'12px', padding:'16px 18px', cursor:'pointer' }}
                      onClick={async () => {
                        if (!selectedJob) { setShowNextStepModal(false); return }
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
                        <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:0 }}>Skip consult — go straight to quotes</p>
                      </div>
                      <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                        Tradies will quote from your written request only. Faster but no shared site record before work is priced.
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
            {/* TABS */}
            <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
              {[
                { key:'invite', label:'Invite a tradie' },
                { key:'requested', label: pendingConfirm ? 'Review & confirm' : 'Requested', count: pendingConfirm ? selectedTradies.length : quoteRequests.length },
              ].map((t: any) => (
                <button key={t.key} type="button" onClick={() => setTab(t.key as any)}
                  style={{ flex:1, padding:'14px 12px', border:'none', borderBottom: tab === t.key ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#2E6A8F' : '#7A9098', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  {t.label}
                  {t.count > 0 && <span style={{ background: tab === t.key ? '#2E6A8F' : 'rgba(28,43,50,0.1)', color: tab === t.key ? 'white' : '#7A9098', fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'100px' }}>{t.count}</span>}
                </button>
              ))}
            </div>

            {/* INVITE TAB */}
            {tab === 'invite' && (
              <div style={{ padding:'20px' }}>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>
                  Have a tradie you already trust? Add them below — they will receive an email with your job details and a link to submit a quote through Steadyhand.
                </p>
                {pendingInvites.length > 0 && (
                  <div style={{ marginBottom:'20px' }}>
                    <p style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'8px' }}>Added to quote request ({pendingInvites.length})</p>
                    {pendingInvites.map((inv: any, i: number) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', marginBottom:'6px' }}>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{inv.business_name}</p>
                          <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{inv.email}</p>
                        </div>
                        <button type="button" onClick={() => removeInvite(i)} style={{ background:'none', border:'none', color:'#D4522A', cursor:'pointer', fontSize:'16px', padding:'0 4px' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ background:'#C8D5D2', borderRadius:'10px', padding:'16px' }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'14px' }}>Add a tradie</p>
                  <div className='form-2col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Business name *</label>
                      <input type="text" placeholder="e.g. Smith Electrical" value={inviteForm.business_name} onChange={e => setInviteForm(f => ({ ...f, business_name: e.target.value }))} style={inpStyle} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Email address *</label>
                      <input type="email" placeholder="tradie@email.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} style={inpStyle} />
                    </div>
                  </div>
                  <div className='form-2col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Trade category</label>
                      <input type="text" placeholder="e.g. Electrical" value={inviteForm.trade_category} onChange={e => setInviteForm(f => ({ ...f, trade_category: e.target.value }))} style={inpStyle} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Phone (optional)</label>
                      <input type="tel" placeholder="0400 000 000" value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} style={inpStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom:'10px' }}>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Personal message <span style={{ fontWeight:400, color:'#7A9098' }}>(optional)</span></label>
                    <textarea placeholder="e.g. Hi — I've worked with you before and would love to get a quote on this job through Steadyhand." value={inviteForm.personal_message} onChange={e => setInviteForm(f => ({ ...f, personal_message: e.target.value }))}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'vertical' as const, minHeight:'72px', fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
                    <p style={{ fontSize:'11px', color:'#9AA5AA', marginTop:'4px' }}>This will appear at the top of the invitation email the tradie receives.</p>
                  </div>
                  <button type="button" onClick={addInvite} disabled={!inviteForm.business_name || !inviteForm.email}
                    style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !inviteForm.business_name || !inviteForm.email ? 0.5 : 1 }}>
                    {inviteSent ? '✓ Added' : '+ Add to quote request'}
                  </button>
                </div>
                {pendingInvites.length > 0 && !sent && (
                  <p style={{ fontSize:'12px', color:'#7A9098', marginTop:'12px', textAlign:'center' as const }}>
                    Invitations will be sent when you click "Request quotes" below.
                  </p>
                )}
              </div>
            )}

            {/* REQUESTED TAB */}
            {tab === 'requested' && (
              <div style={{ padding:'20px' }}>
                {pendingConfirm && !sent && (
                  <div>
                    <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'12px' }}>Review your selections before sending. You can remove tradies below.</p>
                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
                      {pendingInvites.map((inv: any, idx: number) => (
                        <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom: idx < pendingInvites.length - 1 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'white', fontFamily:'var(--font-aboreto), sans-serif', flexShrink:0 }}>
                              {inv.business_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{inv.business_name}</p>
                              <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{inv.email}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => { removeInvite(idx); if (pendingInvites.length <= 1) setPendingConfirm(false) }}
                            style={{ fontSize:'12px', color:'#D4522A', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setPendingConfirm(false)}
                      style={{ fontSize:'13px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                      ← Back to invite
                    </button>
                  </div>
                )}

                {!pendingConfirm && (quoteRequests.length === 0 ? (
                  <div style={{ textAlign:'center' as const, padding:'32px', color:'#7A9098', fontSize:'14px' }}>
                    No quote requests sent yet. Invite a tradie from the tab above.
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign:'center' as const, padding:'16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', marginBottom:'20px' }}>
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>✅</div>
                      <p style={{ fontSize:'15px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>Quote requests sent</p>
                      <p style={{ fontSize:'13px', color:'#4A5E64' }}>We have notified {quoteRequests.length} tradie{quoteRequests.length > 1 ? 's' : ''} about your job.</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'16px' }}>
                      {quoteRequests.map((qr: any) => (
                        <div key={qr.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'white', flexShrink:0 }}>
                              {qr.tradie?.business_name?.charAt(0) || '?'}
                            </div>
                            <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{qr.tradie?.business_name}</p>
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'100px', background: qr.status === 'accepted' ? 'rgba(46,125,96,0.1)' : 'rgba(192,120,48,0.1)', color: qr.status === 'accepted' ? '#2E7D60' : '#C07830' }}>
                            {qr.status === 'requested' ? '⏳ Awaiting quote' : qr.status === 'accepted' ? '✓ Accepted' : qr.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.25)', borderRadius:'10px', padding:'14px 16px', marginBottom:'12px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#9B6B9B', marginBottom:'4px' }}>Before quotes arrive — book a site consult</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', marginBottom:'10px' }}>A consult creates a shared record of what was discussed before any quote is submitted.</p>
                      <a href={'/consult?job_id=' + (selectedJob?.id || '')}>
                        <button type="button" style={{ width:'100%', background:'#9B6B9B', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                          Go to consult →
                        </button>
                      </a>
                    </div>
                  </>
                ))}
              </div>
            )}
          </div>

          {!sent && totalSelected > 0 && (
            <div style={{ marginTop:'16px', background:'#0A0A0A', borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
              <div>
                <p style={{ fontSize:'14px', fontWeight:500, color:'rgba(216,228,225,0.9)', marginBottom:'2px' }}>
                  {totalSelected} tradie{totalSelected > 1 ? 's' : ''} selected
                </p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>
                  {totalSelected < 2 ? 'Consider inviting at least 2 for comparison' : 'Ready to send quote requests'}
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
        headline="Invite a tradie to quote"
        intro="Enter the details of a tradie you trust — they will receive your job details and a link to submit a quote through Steadyhand."
        checklist={[
          { text: 'Invite 2 to 4 tradies for the best comparison', emphasis: true },
          { text: 'The tradie will receive an email with your job description', emphasis: false },
          { text: 'You will be notified when their quote arrives', emphasis: false },
          { text: 'All quotes are compared side by side on the Compare page', emphasis: false },
        ]}
        warning="Inviting just one tradie means no comparison. Two to four quotes is the Steadyhand recommendation for any job over $1,000."
        ctaLabel="Start inviting"
      />
    </>
  )
}
