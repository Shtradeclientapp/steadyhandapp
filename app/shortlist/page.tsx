'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HintPanel } from '@/components/ui/HintPanel'

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [shortlist, setShortlist] = useState<any[]>([])
  const [matching, setMatching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTradies, setSelectedTradies] = useState<string[]>([])
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [tab, setTab] = useState<'matches'|'invite'|'requested'>('matches')
  const [inviteForm, setInviteForm] = useState({ business_name:'', email:'', trade_category:'', phone:'' })
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', session.user.id)
        .in('status', ['matching', 'shortlisted', 'agreement'])
        .order('created_at', { ascending: false })
      if (!jobsData || jobsData.length === 0) { setLoading(false); return }
      setJobs(jobsData)
      setSelectedJob(jobsData[0])
      const existing = await loadShortlist(jobsData[0].id)
      await loadQuoteRequests(jobsData[0].id)
      if (!existing || existing.length === 0) {
        setMatching(true)
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
          body: JSON.stringify({ job_id: jobsData[0].id }),
        })
        const data = await res.json()
        if (data.shortlist) await loadShortlist(jobsData[0].id)
        setMatching(false)
      }
      setLoading(false)
    })
  }, [])

  const loadShortlist = async (jobId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('shortlist')
      .select('*, tradie:tradie_profiles(*, profile:profiles(*))')
      .eq('job_id', jobId)
      .order('rank', { ascending: true })
    setShortlist(data || [])
    return data
  }

  const loadQuoteRequests = async (jobId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('quote_requests')
      .select('*, tradie:tradie_profiles(business_name, rating_avg, jobs_completed)')
      .eq('job_id', jobId)
    setQuoteRequests(data || [])
    if (data && data.length > 0) { setSent(true); setTab('requested') }
  }

  const toggleTradie = (tradieId: string) => {
    setSelectedTradies(prev =>
      prev.includes(tradieId) ? prev.filter(id => id !== tradieId) : prev.length >= 4 ? prev : [...prev, tradieId]
    )
  }

  const sendQuoteRequests = async () => {
    if (selectedTradies.length === 0 && pendingInvites.length === 0) return
    setSending(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    for (const tradieId of selectedTradies) {
      await supabase.from('quote_requests').upsert({ job_id: selectedJob.id, tradie_id: tradieId, status: 'requested', requested_at: new Date().toISOString() }, { onConflict: 'job_id,tradie_id' })
      await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'tradie_selected', job_id: selectedJob.id }) }).catch(() => {})
    }
    for (const invite of pendingInvites) {
      await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id: selectedJob?.id, client_id: session?.user.id, ...invite }) })
    }
    await supabase.from('jobs').update({ status: 'agreement', quote_request_sent_at: new Date().toISOString() }).eq('id', selectedJob.id)
    await loadQuoteRequests(selectedJob.id)
    setSent(true)
    setSending(false)
    setTab('requested')
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
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
        {[{n:1,l:'Request',p:'/request',c:'#2E7D60'},{n:2,l:'Shortlist',p:'/shortlist',c:'#2E6A8F'},{n:3,l:'Agreement',p:'/agreement',c:'#6B4FA8'},{n:4,l:'Delivery',p:'/delivery',c:'#C07830'},{n:5,l:'Sign-off',p:'/signoff',c:'#D4522A'},{n:6,l:'Warranty',p:'/warranty',c:'#1A6B5A'}].map(s => (
          <a key={s.n} href={s.p} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {s.p === '/shortlist' && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (s.n < 2 ? '#2E7D60' : s.p === '/shortlist' ? s.c : 'rgba(28,43,50,0.2)'), background: s.n < 2 ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: s.n < 2 ? 'white' : s.p === '/shortlist' ? s.c : '#7A9098' }}>
              {s.n < 2 ? '✓' : s.n}
            </div>
            <div style={{ fontSize:'10px', color: s.p === '/shortlist' ? '#1C2B32' : s.n < 2 ? '#2E7D60' : '#7A9098', fontWeight: s.p === '/shortlist' ? 600 : 400 }}>{s.l}</div>
          </a>
        ))}
      </div>
    </div>
  )

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
            <span style={{ fontSize:'11px', color:'#2E6A8F', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Stage 2</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>YOUR SHORTLIST</h1>

          <HintPanel color="#2E6A8F" hints={[
            "Best practice is to request quotes from at least 3 tradies so you can compare pricing and approach.",
            "Steadyhand ranks tradies by category fit, location, track record and verification status — not by who pays to be listed.",
            "You can select from Steadyhand matches and invite your own tradie — all quotes are compared in one place.",
            "Verified licence and insurance badges mean Steadyhand has checked the tradie's credentials.",
          ]} />

          {jobs.length > 1 && (
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'6px', display:'block' }}>Select job</label>
              <select value={selectedJob?.id || ''} onChange={async e => {
                const job = jobs.find(j => j.id === e.target.value)
                setSelectedJob(job)
                setSelectedTradies([])
                setSent(false)
                setTab('matches')
                await loadShortlist(job.id)
                await loadQuoteRequests(job.id)
              }} style={{ padding:'10px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', width:'100%' }}>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.suburb}</option>)}
              </select>
            </div>
          )}

          {selectedJob && (
            <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
              <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                <div>
                  <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'3px' }}>{selectedJob.title}</h3>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)' }}>{selectedJob.trade_category} · {selectedJob.suburb}</p>
                </div>
                {totalSelected > 0 && !sent && (
                  <button type="button" onClick={sendQuoteRequests} disabled={sending}
                    style={{ background:'#D4522A', color:'white', padding:'11px 22px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: sending ? 0.7 : 1, flexShrink:0 }}>
                    {sending ? 'Sending...' : 'Request quotes from ' + totalSelected + ' tradie' + (totalSelected > 1 ? 's' : '') + ' →'}
                  </button>
                )}
                {sent && (
                  <button type="button" onClick={() => window.location.href = '/agreement'}
                    style={{ background:'#2E7D60', color:'white', padding:'11px 22px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
                    View quotes →
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
              {[
                { key:'matches', label:'Steadyhand matches', count: shortlist.length },
                { key:'invite', label:'Invite a tradie', count: pendingInvites.length },
                { key:'requested', label:'Requested', count: quoteRequests.length },
              ].map(t => (
                <button key={t.key} type="button" onClick={() => setTab(t.key as any)}
                  style={{ flex:1, padding:'14px 12px', border:'none', borderBottom: tab === t.key ? '2px solid #2E6A8F' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'12px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#2E6A8F' : '#7A9098', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  {t.label}
                  {t.count > 0 && <span style={{ background: tab === t.key ? '#2E6A8F' : 'rgba(28,43,50,0.1)', color: tab === t.key ? 'white' : '#7A9098', fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'100px' }}>{t.count}</span>}
                </button>
              ))}
            </div>

            {tab === 'matches' && (
              <div style={{ padding:'20px' }}>
                {matching && (
                  <div style={{ textAlign:'center', padding:'40px' }}>
                    <div style={{ fontSize:'32px', marginBottom:'12px' }}>🔍</div>
                    <p style={{ fontSize:'15px', color:'#1C2B32', fontWeight:500, marginBottom:'6px' }}>Finding your best matches...</p>
                    <p style={{ fontSize:'13px', color:'#7A9098' }}>Steadyhand is reviewing your job and ranking verified local tradies.</p>
                  </div>
                )}
                {!matching && shortlist.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px' }}>
                    <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'16px' }}>No matches found for this job.</p>
                    <button type="button" onClick={async () => {
                      setMatching(true)
                      const supabase = createClient()
                      const { data: { session } } = await supabase.auth.getSession()
                      const res = await fetch('/api/match', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + session?.access_token }, body: JSON.stringify({ job_id: selectedJob?.id }) })
                      const data = await res.json()
                      if (data.shortlist) await loadShortlist(selectedJob?.id)
                      setMatching(false)
                    }} style={{ background:'#2E7D60', color:'white', padding:'11px 24px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                      Retry matching →
                    </button>
                  </div>
                )}
                {!matching && shortlist.length > 0 && (
                  <>
                    {!sent && <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'16px' }}>Select tradies to request quotes from — tick 2–4 for best results.</p>}
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                      {shortlist.map((entry, i) => {
                        const t = entry.tradie
                        const isSelected = selectedTradies.includes(t?.id)
                        const hasRequest = quoteRequests.find(qr => qr.tradie_id === t?.id)
                        return (
                          <div key={entry.id} onClick={() => !sent && !hasRequest && toggleTradie(t?.id)}
                            style={{ border:'2px solid ' + (isSelected ? '#2E6A8F' : hasRequest ? '#2E7D60' : i === 0 ? 'rgba(212,82,42,0.3)' : 'rgba(28,43,50,0.1)'), borderRadius:'12px', padding:'18px', cursor: sent || hasRequest ? 'default' : 'pointer', background: isSelected ? 'rgba(46,106,143,0.04)' : hasRequest ? 'rgba(46,125,96,0.04)' : '#E8F0EE', transition:'all 0.15s', position:'relative' as const }}>
                            <div style={{ position:'absolute', top:'12px', right:'12px', display:'flex', gap:'6px', alignItems:'center' }}>
                              {i === 0 && !hasRequest && <span style={{ background:'#D4522A', color:'white', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'100px' }}>TOP PICK</span>}
                              {hasRequest && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.3)', color:'#2E7D60', fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'100px' }}>✓ Requested</span>}
                              {!sent && !hasRequest && (
                                <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid ' + (isSelected ? '#2E6A8F' : 'rgba(28,43,50,0.2)'), background: isSelected ? '#2E6A8F' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'white' }}>
                                  {isSelected ? '✓' : ''}
                                </div>
                              )}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background: i === 0 ? '#2E7D60' : i === 1 ? '#2E6A8F' : '#6B4FA8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'white', flexShrink:0 }}>
                                {t?.business_name?.charAt(0) || '?'}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px' }}>{t?.business_name}</div>
                                <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{t?.service_areas?.[0]} · ⭐ {Number(t?.rating_avg).toFixed(1)} · {t?.jobs_completed} jobs</div>
                              </div>
                              <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A' }}>{Math.round(entry.ai_score)}%</div>
                                <div style={{ fontSize:'10px', color:'#7A9098' }}>match</div>
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap' as const }}>
                              {t?.licence_verified && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'2px 9px', fontSize:'11px', color:'#2E7D60' }}>✓ Licence verified</span>}
                              {t?.insurance_verified && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'2px 9px', fontSize:'11px', color:'#2E7D60' }}>✓ Insurance current</span>}
                            </div>
                            <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'10px 12px', marginBottom:'8px' }}>
                              <div style={{ fontSize:'9px', fontWeight:'600', letterSpacing:'0.8px', textTransform:'uppercase' as const, color:'#D4522A', marginBottom:'3px' }}>Why Steadyhand recommends</div>
                              <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.55', margin:0 }}>{entry.ai_reasoning}</p>
                            </div>
                            <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', margin:0 }}>{t?.bio}</p>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'invite' && (
              <div style={{ padding:'20px' }}>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>
                  Have a tradie you already trust? Add them below — they will receive an email with your job details and a link to submit a quote through Steadyhand.
                </p>
                {pendingInvites.length > 0 && (
                  <div style={{ marginBottom:'20px' }}>
                    <p style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'8px' }}>Added to quote request ({pendingInvites.length})</p>
                    {pendingInvites.map((inv, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', marginBottom:'6px' }}>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{inv.business_name}</p>
                          <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{inv.email}</p>
                        </div>
                        <button type="button" onClick={() => removeInvite(i)} style={{ background:'none', border:'none', color:'#D4522A', cursor:'pointer', fontSize:'16px', padding:'0 4px' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ background:'#C8D5D2', borderRadius:'10px', padding:'16px' }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'14px' }}>Add a tradie</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Business name *</label>
                      <input type="text" placeholder="e.g. Smith Carpentry" value={inviteForm.business_name} onChange={e => setInviteForm(f => ({ ...f, business_name: e.target.value }))} style={inpStyle} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Email address *</label>
                      <input type="email" placeholder="tradie@email.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} style={inpStyle} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Trade category</label>
                      <input type="text" placeholder="e.g. Carpentry" value={inviteForm.trade_category} onChange={e => setInviteForm(f => ({ ...f, trade_category: e.target.value }))} style={inpStyle} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>Phone (optional)</label>
                      <input type="tel" placeholder="0400 000 000" value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} style={inpStyle} />
                    </div>
                  </div>
                  <button type="button" onClick={addInvite} disabled={!inviteForm.business_name || !inviteForm.email}
                    style={{ width:'100%', background:'#1C2B32', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !inviteForm.business_name || !inviteForm.email ? 0.5 : 1 }}>
                    {inviteSent ? '✓ Added' : '+ Add to quote request'}
                  </button>
                </div>
                {pendingInvites.length > 0 && !sent && (
                  <p style={{ fontSize:'12px', color:'#7A9098', marginTop:'12px', textAlign:'center' as const }}>
                    Invitations will be sent when you click "Request quotes" above.
                  </p>
                )}
              </div>
            )}

            {tab === 'requested' && (
              <div style={{ padding:'20px' }}>
                {quoteRequests.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px', color:'#7A9098', fontSize:'14px' }}>
                    No quote requests sent yet. Select tradies from the Steadyhand matches tab or invite your own.
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px' }}>
                      Quote requests sent to {quoteRequests.length} tradie{quoteRequests.length > 1 ? 's' : ''}. Quotes will appear on the agreement page as they are submitted.
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
                      {quoteRequests.map(qr => (
                        <div key={qr.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'#C8D5D2', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'white', flexShrink:0 }}>
                              {qr.tradie?.business_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{qr.tradie?.business_name}</p>
                              <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>⭐ {Number(qr.tradie?.rating_avg || 0).toFixed(1)} · {qr.tradie?.jobs_completed || 0} jobs</p>
                            </div>
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:600, padding:'4px 10px', borderRadius:'100px', background: qr.status === 'accepted' ? 'rgba(46,125,96,0.1)' : qr.status === 'declined' ? 'rgba(212,82,42,0.1)' : 'rgba(192,120,48,0.1)', color: qr.status === 'accepted' ? '#2E7D60' : qr.status === 'declined' ? '#D4522A' : '#C07830', textTransform:'capitalize' as const }}>
                            {qr.status === 'requested' ? '⏳ Awaiting quote' : qr.status === 'accepted' ? '✓ Quote accepted' : qr.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => window.location.href = '/agreement'}
                      style={{ width:'100%', background:'#2E6A8F', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                      Go to agreement page to compare quotes →
                    </button>
                  </>
                )}
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
    </>
  )
}
