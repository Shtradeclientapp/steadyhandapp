"use client"
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'
import { NavHeader } from '@/components/ui/NavHeader'
import { StageRail, WaitingPanel } from '@/components/ui'
import { JobSelector } from '@/components/ui/JobSelector'
import { HintPanel } from '@/components/ui/HintPanel'

export default function ComparePage() {
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string|null>(null)
  const [acceptError, setAcceptError] = useState<string|null>(null)
  const [accepted, setAccepted] = useState<string|null>(null)
  const [confirming, setConfirming] = useState<string|null>(null)
  const [expandedQuote, setExpandedQuote] = useState<string|null>(null)
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [reviseId, setReviseId] = useState<string|null>(null)
  const [reviseNote, setReviseNote] = useState('')
  const [quoteHistory, setQuoteHistory] = useState<Record<string,any[]>>({})
  const [showHistory, setShowHistory] = useState<Record<string,boolean>>({})
  const [sendingRevise, setSendingRevise] = useState(false)
  const [sortBy, setSortBy] = useState<'price'|'rating'|'completeness'>('price')
  const [tags, setTags] = useState<Record<string,string>>({})
  const [aiAnalysis, setAiAnalysis] = useState<string|null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const supabase = useSupabase()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const urlJobId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('job_id') : null
      let jobsQuery = supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible)')
        .eq('client_id', session.user.id)
        .in('status', ['compare','quote','shortlisted','assess','consult','agreement'])
        .order('created_at', { ascending: false })
      if (urlJobId) jobsQuery = jobsQuery.eq('id', urlJobId)
      const { data: jobsData } = await jobsQuery
      setJobs(jobsData || [])
      if (jobsData && jobsData.length > 0) {
        await loadQuotes(jobsData[0].id)
        setSelectedJob(jobsData[0])
      }
      setLoading(false)
    })
  }, [])

  const loadQuotes = async (jobId: string) => {
    const { data: qrs } = await supabase
      .from('quote_requests')
      .select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible)')
      .eq('job_id', jobId)
    setQuoteRequests(qrs || [])
    const { data } = await supabase
      .from('quotes')
      .select('*, tradie:tradie_profiles(business_name, availability_message, availability_visible, licence_number, insurance_expiry, dialogue_score_avg, id)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
    setQuotes(data || [])
    const acc = (data || []).find((q: any) => q.status === 'accepted')
    if (acc) setAccepted(acc.id)
    // Fetch revision history per tradie (older versions)
    if (data && data.length > 0) {
      const tradieIds = [...new Set(data.map((q: any) => q.tradie_id).filter(Boolean))]
      const { data: allVersions } = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', jobId)
        .in('tradie_id', tradieIds)
        .order('version', { ascending: true })
      if (allVersions) {
        const hist: Record<string,any[]> = {}
        for (const q of data) {
          hist[q.id] = allVersions.filter((v: any) => v.tradie_id === q.tradie_id && v.id !== q.id)
        }
        setQuoteHistory(hist)
      }
    }
  }

  const runAiAnalysis = async () => {
    if (!quotes.length || !selectedJob) return
    setAiLoading(true); setShowAi(true)
    try {
      const prompt = 'You are a trade advisor helping a homeowner compare quotes.\n\nJob: ' + (selectedJob.title||'') + '\nTrade: ' + (selectedJob.trade_category||'') + '\nDescription: ' + (selectedJob.description||'Not provided') + '\n\nQuotes:\n' + quotes.map((q:any,i:number) => 'Quote '+(i+1)+' — '+(q.tradie?.business_name||'Unknown')+'\n- Total: $'+(q.total_price||0)+(q.gst_included?' (GST incl.)':'')+'\n- Dialogue Rating: '+(q.tradie?.dialogue_score_avg?Math.round(q.tradie.dialogue_score_avg)+'/100':'Not rated')+'\n- Summary: '+(q.summary||'None')+'\n- Conditions: '+(q.conditions||'None')+'\n- Line items: '+(q.line_items?.length?q.line_items.map((l:any)=>l.description+' $'+l.amount).join(', '):'Not itemised')).join('\n\n') + '\n\nProvide:\n1. KEY RISKS — red flags or missing info (2-4 points)\n2. WHAT TO ASK — questions to ask before deciding (2-3 questions)\n3. RECOMMENDATION — which looks strongest and why (2-3 sentences, be direct)'
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      setAiAnalysis(data.content?.find((b:any) => b.type==='text')?.text || 'Analysis unavailable.')
    } catch { setAiAnalysis('Analysis could not be completed.') }
    setAiLoading(false)
  }

  const toggleTag = (quoteId: string, tag: string) => {
    setTags(prev => ({ ...prev, [quoteId]: prev[quoteId] === tag ? '' : tag }))
  }

  const acceptQuote = async (quote: any) => {
    setAccepting(quote.id)
    setAcceptError(null)
    try {
      const { error: e1 } = await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quote.id)
      if (e1) throw new Error(e1.message)
      await supabase.from('quotes').update({ status: 'rejected' }).eq('job_id', selectedJob.id).neq('id', quote.id)
      // Notify declined tradies
      await fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'quote_updated', job_id: selectedJob.id, accepted_tradie_id: quote.tradie_id }) }).catch(console.error)
      const { error: e2 } = await supabase.from('quote_requests').update({ qr_status: 'accepted' }).eq('job_id', selectedJob.id).eq('tradie_id', quote.tradie_id)
      await supabase.from('quote_requests').update({ qr_status: 'declined' }).eq('job_id', selectedJob.id).neq('tradie_id', quote.tradie_id)
      await supabase.from('jobs').update({ status: 'agreement' }).eq('id', selectedJob.id)
      if (e2) throw new Error(e2.message)
      // Mark the accepted quote_request as accepted, decline the rest
      await supabase.from('quote_requests').update({ status: 'accepted' }).eq('job_id', selectedJob.id).eq('tradie_id', quote.tradie_id)
      await supabase.from('quote_requests').update({ status: 'declined' }).eq('job_id', selectedJob.id).neq('tradie_id', quote.tradie_id)
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quote_accepted', job_id: selectedJob.id, tradie_id: quote.tradie_id }),
      }).catch(console.error)
      // Email tradie to draft the scope
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scope_ready', job_id: selectedJob.id }),
      }).catch(console.error)
      setAccepted(quote.id)
      // Redirect client to agreement page for this job
      setTimeout(() => {
        window.location.href = '/agreement?job_id=' + selectedJob.id
      }, 800)
    } catch (e: any) {
      setAcceptError('Could not accept quote — please check your connection and try again.')
    }
    setAccepting(null)
  }

  const requestRevision = async (quoteId: string) => {
    if (!reviseNote.trim()) return
    setSendingRevise(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('job_messages').insert({
      job_id: selectedJob.id,
      sender_id: session?.user.id,
      body: 'Quote revision requested: ' + reviseNote,
    })
    setReviseId(null)
    setReviseNote('')
    setSendingRevise(false)
  }

  const fmt = (n: any) => '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 0 })

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#7A9098', fontSize:'14px', fontFamily:'sans-serif' }}>Loading estimates...</p>
    </div>
  )

  const nav = <NavHeader profile={profile} />

  return (
    <>
      {nav}
      <StageRail currentPath="/compare" jobStatus={selectedJob?.status} role={profile?.role === 'tradie' ? 'tradie' : 'client'} />
      {profile?.role === 'tradie' && selectedJob && (
        <div style={{ maxWidth:'780px', margin:'0 auto', padding:'24px 24px 0' }}>
          <WaitingPanel role="tradie" stage="compare" jobId={selectedJob?.id} otherPartyName={selectedJob?.client?.full_name} />
        </div>
      )}
      <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', padding:'32px 24px', fontFamily:'sans-serif' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#6B4FA8', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Stage 4</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'6px' }}>COMPARE QUOTES</h1>

          <HintPanel color="#6B4FA8" hints={[
            "Review each estimate carefully — check the inclusions, exclusions and conditions, not just the price.",
            "Progressing to the scope agreement locks in this tradie for the job. A scope agreement will be drafted for both parties to review and sign before work begins.",
            "If a quote is missing detail, use 'Request revision' to ask the tradie to clarify before you commit.",
          ]} />

          {jobs.length > 1 && (
            <JobSelector jobs={jobs} selectedJobId={selectedJob?.id || null} onSelect={async (jobId: string) => {
              const j = jobs.find(x => x.id === jobId)
              if (j) { setSelectedJob(j); setAccepted(null); setExpandedQuote(null); await loadQuotes(j.id) }
            }} />
          )}

          {quotes.length === 0 && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                <span style={{ fontSize:'24px' }}>⏳</span>
                <div>
                  <p style={{ fontSize:'15px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>Waiting for estimates</p>
                  <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>You will be notified as each quote arrives. You can accept the first good one or wait for all to come in.</p>
                </div>
              </div>
              {quoteRequests.length > 0 && (
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'10px' }}>Quote request status</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                    {quoteRequests.map((qr: any) => {
                      const hasQuote = quotes.some((q: any) => q.tradie_id === qr.tradie_id)
                      const statusLabel = hasQuote ? 'Quote received' : qr.status === 'declined' ? 'Declined' : 'Awaiting quote'
                      const statusColor = hasQuote ? '#2E7D60' : qr.status === 'declined' ? '#D4522A' : '#C07830'
                      return (
                        <div key={qr.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'white', borderRadius:'8px', border:'1px solid rgba(28,43,50,0.08)' }}>
                          <div>
                            <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{qr.tradie?.business_name || 'Trade business'}</p>
                            {qr.tradie?.availability_visible && qr.tradie?.availability_message && (
                              <p style={{ fontSize:'11px', color:'#C07830', margin:0 }}>⏱ {qr.tradie.availability_message}</p>
                            )}
                          </div>
                          <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background: statusColor + '18', border:'1px solid ' + statusColor + '40', color: statusColor, fontWeight:500, flexShrink:0 }}>{statusLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(28,43,50,0.08)', display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                <a href="/shortlist" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>+ Invite another tradie →</a>
                <p style={{ fontSize:'12px', color:'#9AA5AA', margin:0 }}>
                  Most clients invite 2–3 tradies. You only need one good quote to proceed — you are not obligated to accept the lowest price.
                </p>
              <a href="/guides" style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', display:'inline-block', marginTop:'4px' }}>📋 WA trade cost guides →</a>
              </div>
            </div>
          )}

          {quotes.length > 0 && quoteRequests.some((qr: any) => !quotes.some((q: any) => q.tradie_id === qr.tradie_id) && qr.status !== 'declined') && (
            <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'16px' }}>⏳</span>
              <p style={{ fontSize:'13px', color:'#C07830', margin:0 }}>
                {quoteRequests.filter((qr: any) => !quotes.some((q: any) => q.tradie_id === qr.tradie_id) && qr.status !== 'declined').length} more quote{quoteRequests.filter((qr: any) => !quotes.some((q: any) => q.tradie_id === qr.tradie_id) && qr.status !== 'declined').length !== 1 ? 's' : ''} still pending — you can accept now or wait for all quotes to arrive.
              </p>
            </div>
          )}

          {quotes.length > 0 && (
            <>
              {/* Sort + AI bar */}
              {!accepted && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', marginBottom:'16px', flexWrap:'wrap' as const }}>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <p style={{ fontSize:'11px', color:'#7A9098', margin:0, flexShrink:0 }}>Sort by</p>
                    {(['price','rating','completeness'] as const).map(s => (
                      <button key={s} type="button" onClick={() => setSortBy(s)}
                        style={{ padding:'5px 12px', borderRadius:'100px', fontSize:'12px', fontWeight: sortBy===s ? 600 : 400, background: sortBy===s ? '#0A0A0A' : 'rgba(28,43,50,0.06)', color: sortBy===s ? 'white' : '#4A5E64', border:'none', cursor:'pointer' }}>
                        {s === 'price' ? 'Price' : s === 'rating' ? 'Dialogue rating' : 'Completeness'}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={runAiAnalysis} disabled={aiLoading}
                    style={{ background: showAi ? '#6B4FA8' : 'rgba(107,79,168,0.08)', color: showAi ? 'white' : '#6B4FA8', border:'1px solid rgba(107,79,168,0.25)', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:500, cursor:'pointer', opacity: aiLoading ? 0.7 : 1 }}>
                    {aiLoading ? '⏳ Analysing...' : '✦ AI analysis'}
                  </button>
                </div>
              )}

              {/* AI panel */}
              {showAi && (
                <div style={{ background:'rgba(107,79,168,0.04)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <p style={{ fontSize:'13px', fontWeight:600, color:'#6B4FA8', margin:0 }}>✦ Steadyhand AI — quote analysis</p>
                    <button type="button" onClick={() => setShowAi(false)} style={{ background:'none', border:'none', color:'#9AA5AA', cursor:'pointer', fontSize:'16px' }}>×</button>
                  </div>
                  {aiLoading
                    ? <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Reading your quotes and identifying risks...</p>
                    : <div style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', whiteSpace:'pre-wrap' as const }}>{aiAnalysis}</div>
                  }
                </div>
              )}

              {/* Price bar */}
              {quotes.length > 1 && !accepted && (() => {
                const prices = quotes.map((q: any) => q.total_price || 0)
                const maxP = Math.max(...prices), minP = Math.min(...prices)
                return (
                  <div style={{ background:'#E8F0EE', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 10px' }}>Price comparison</p>
                    {[...quotes].sort((a:any,b:any) => (a.total_price||0)-(b.total_price||0)).map((q:any) => {
                      const pct = maxP > minP ? Math.round(((q.total_price||0)-minP)/(maxP-minP)*100) : 50
                      return (
                        <div key={q.id} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                          <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, width:'120px', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{q.tradie?.business_name||'—'}</p>
                          <div style={{ flex:1, background:'rgba(28,43,50,0.08)', borderRadius:'4px', height:'8px' }}>
                            <div style={{ width:(40+pct*0.55)+'%', background: pct===0?'#2E7D60':pct<40?'#C07830':'#D4522A', height:'8px', borderRadius:'4px' }}/>
                          </div>
                          <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:0, width:'72px', textAlign:'right' as const }}>${(q.total_price||0).toLocaleString()}</p>
                        </div>
                      )
                    })}
                    <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'4px 0 0' }}>Spread: ${(maxP-minP).toLocaleString()} between lowest and highest</p>
                  </div>
                )
              })()}

              {accepted && (
                <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'10px', padding:'12px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'18px' }}>✓</span>
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60', margin:'0 0 2px' }}>Quote accepted — scope agreement ready to sign</p>
                    <a href="/agreement" style={{ fontSize:'13px', color:'white', background:'#2E7D60', padding:'8px 16px', borderRadius:'7px', textDecoration:'none', fontWeight:500, display:'inline-block', marginTop:'4px' }}>Go to scope agreement →</a>
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns: quotes.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap:'14px' }}>
                {[...quotes].sort((a:any,b:any) => {
                  if (sortBy==='price') return (a.total_price||0)-(b.total_price||0)
                  if (sortBy==='rating') return (b.tradie?.dialogue_score_avg||0)-(a.tradie?.dialogue_score_avg||0)
                  const sc = (q:any) => (q.summary?1:0)+(q.line_items?.length?1:0)+(q.conditions?1:0)
                  return sc(b)-sc(a)
                }).map((q: any) => {
                  const isAccepted = accepted === q.id
                  const isRejected = accepted && accepted !== q.id
                  const isExpanded = expandedQuote === q.id
                  const isRevisingThis = reviseId === q.id
                  const score = q.tradie?.dialogue_score_avg
                  const scoreColor = score >= 75 ? '#2E7D60' : score >= 50 ? '#C07830' : '#7A9098'
                  const tag = tags[q.id] || ''
                  const completeness = (q.summary?1:0)+(q.line_items?.length?1:0)+(q.conditions?1:0)
                  const allPrices = quotes.map((x:any)=>x.total_price||0)
                  const maxP = Math.max(...allPrices), minP = Math.min(...allPrices)
                  const priceScore = allPrices.length>1 ? (1-((q.total_price||0)-minP)/(maxP-minP||1))*40 : 20
                  const compositeScore = Math.round((score||0)*0.4 + priceScore + completeness*6.67)

                  return (
                    <div key={q.id} style={{ background:'#E8F0EE', border:'2px solid ' + (isAccepted ? '#2E7D60' : isRejected ? 'rgba(28,43,50,0.08)' : 'rgba(28,43,50,0.12)'), borderRadius:'14px', overflow:'hidden', opacity: isRejected ? 0.55 : 1, transition:'opacity 0.3s' }}>

                      {/* Header */}
                      <div style={{ background: isAccepted ? 'rgba(46,125,96,0.08)' : '#0A0A0A', padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color: isAccepted ? '#2E7D60' : 'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:0 }}>{q.tradie?.business_name || 'Trade business'}</p>
                          {isAccepted && <span style={{ fontSize:'11px', background:'rgba(46,125,96,0.15)', color:'#2E7D60', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'100px', padding:'2px 10px', fontWeight:500 }}>Accepted</span>}
                          {isRejected && <span style={{ fontSize:'11px', color:'rgba(216,228,225,0.3)' }}>Not selected</span>}
                        </div>
                        {score > 0 && (
                          <p style={{ fontSize:'11px', color: isAccepted ? scoreColor : 'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>
                            Dialogue Rating: <span style={{ color: isAccepted ? scoreColor : 'rgba(216,228,225,0.7)', fontWeight:500 }}>{Math.round(score)}</span>
                          </p>
                        )}
                        {q.tradie?.availability_visible && q.tradie?.availability_message && (
                          <p style={{ fontSize:'11px', color:'#C07830', margin:'6px 0 0', background:'rgba(192,120,48,0.12)', borderRadius:'4px', padding:'3px 8px', display:'inline-block' }}>
                            ⏱ {q.tradie.availability_message}
                          </p>
                        )}
                        {!accepted && (
                          <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' as const }}>
                            {([['⭐','preferred'],['👍','shortlisted'],['⚠️','concerns']] as const).map(([icon,t]) => (
                              <button key={t} type="button" onClick={() => toggleTag(q.id, t)}
                                style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', border:'1px solid rgba(255,255,255,0.15)', background: tag===t?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.06)', color: tag===t?'rgba(216,228,225,0.95)':'rgba(216,228,225,0.5)', cursor:'pointer', fontWeight: tag===t?600:400 }}>
                                {icon} {t}
                              </button>
                            ))}
                          </div>
                        )}
                        {compositeScore > 0 && !accepted && (
                          <p style={{ fontSize:'10px', color:'rgba(216,228,225,0.35)', margin:'8px 0 0' }}>
                            Steadyhand score <span style={{ color: compositeScore>=65?'rgba(46,125,96,0.9)':compositeScore>=40?'rgba(192,120,48,0.9)':'rgba(122,144,152,0.9)', fontWeight:600 }}>{compositeScore}/100</span>
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                        <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Total quote</p>
                        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1px', margin:0 }}>{fmt(q.total_price || 0)}</p>
                        {q.gst_included && <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>GST included</p>}
                      </div>

                      {/* Summary */}
                      {q.summary && (
                        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>{q.summary}</p>
                        </div>
                      )}

                      {/* Line items toggle */}
                      {q.line_items && q.line_items.length > 0 && (
                        <div style={{ borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                          <button type="button" onClick={() => setExpandedQuote(isExpanded ? null : q.id)}
                            style={{ width:'100%', padding:'10px 20px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontSize:'12px', color:'#6B4FA8', fontWeight:500, display:'flex', justifyContent:'space-between' }}>
                            <span>{isExpanded ? '▲ Hide' : '▼ Show'} {q.line_items.length} line item{q.line_items.length !== 1 ? 's' : ''}</span>
                          </button>
                          {isExpanded && (
                            <div style={{ padding:'0 20px 14px' }}>
                              {q.line_items.map((item: any, i: number) => (
                                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(28,43,50,0.06)', fontSize:'13px' }}>
                                  <span style={{ color:'#4A5E64' }}>{item.description}</span>
                                  <span style={{ color:'#0A0A0A', fontWeight:500 }}>{fmt(item.amount || 0)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Conditions */}
                      {q.conditions && (
                        <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(192,120,48,0.04)' }}>
                          <p style={{ fontSize:'11px', fontWeight:600, color:'#C07830', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Conditions</p>
                          <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.55', margin:0 }}>{q.conditions}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {!accepted && (
                        <div style={{ padding:'14px 20px', display:'flex', gap:'8px', flexDirection:'column' as const }}>
                          {acceptError && (
                            <p style={{ fontSize:'12px', color:'#D4522A', margin:'0 0 6px' }}>⚠ {acceptError}</p>
                          )}
                          <button type="button" onClick={() => acceptQuote(q)} disabled={!!accepting}
                            style={{ width:'100%', background:'#2E7D60', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: accepting ? 0.6 : 1 }}>
                            {accepting === q.id ? 'Progressing...' : 'Progress to scope agreement →'}
                          </button>
                          {!isRevisingThis && (
                            <button type="button" onClick={() => { setReviseId(q.id); setReviseNote('') }}
                              style={{ width:'100%', background:'transparent', color:'#7A9098', padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:500, border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>
                              Request revision
                            </button>
                          )}
                          {isRevisingThis && (
                            <div>
                              <textarea value={reviseNote} onChange={e => setReviseNote(e.target.value)}
                                placeholder="Describe what you'd like the tradie to revise or clarify..."
                                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid rgba(107,79,168,0.3)', borderRadius:'7px', fontSize:'12px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', minHeight:'70px', resize:'vertical', boxSizing:'border-box', fontFamily:'sans-serif' }} />
                              <div style={{ display:'flex', gap:'8px', marginTop:'6px' }}>
                                <button type="button" onClick={() => requestRevision(q.id)} disabled={sendingRevise || !reviseNote.trim()}
                                  style={{ flex:1, background:'#6B4FA8', color:'white', padding:'8px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', opacity: !reviseNote.trim() ? 0.5 : 1 }}>
                                  {sendingRevise ? 'Sending...' : 'Send request'}
                                </button>
                                <button type="button" onClick={() => setReviseId(null)}
                                  style={{ padding:'8px 12px', background:'transparent', color:'#7A9098', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'12px', cursor:'pointer' }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {accepted === q.id && (
                        <div style={{ padding:'14px 20px' }}>
                          <a href="/agreement"><button style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>Go to contract →</button></a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <StageGuideModal
        storageKey="seen_compare_guide"
        stageNumber={4}
        stageColor="#854F0B"
        stageLabel="Compare"
        headline="Choose the right quote — not just the cheapest"
        intro="You now have quotes from multiple tradies. This stage is about making a confident, informed decision — not just picking the lowest number."
        checklist={[
          { text: 'Check inclusions and exclusions, not just the total price', emphasis: true },
          { text: 'A tradie with a higher Dialogue Rating has a stronger communication track record', emphasis: false },
          { text: 'Use quote revision to ask for clarification before committing', emphasis: false },
          { text: 'Once you accept, the other tradies are notified and scope agreement begins', emphasis: false },
        ]}
        warning="Accepting a quote locks you into scope agreement. Make sure you are comfortable with all the terms before proceeding."
        ctaLabel="Review quotes"
      />
    </>
  )
}
