'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TradieQuoteCard } from '@/components/ui/TradieQuoteCard'
import { MilestoneEditor } from '@/components/ui/MilestoneEditor'

export default function AgreementPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [pushingMsg, setPushingMsg] = useState<string|null>(null)
  const [scopeVersion, setScopeVersion] = useState(1)
  const [currentQuote, setCurrentQuote] = useState<any>(null)
  const [allQuotes, setAllQuotes] = useState<any[]>([])
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string|null>(null)
  const [acceptingQuote, setAcceptingQuote] = useState(false)
  const [showThread, setShowThread] = useState(true)
  const [showScopeHint, setShowScopeHint] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadedDoc, setUploadedDoc] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const isTradie = prof?.role === 'tradie'
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(*)), client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
        .or(isTradie ? 'tradie_id.eq.' + session.user.id : 'client_id.eq.' + session.user.id)
        .in('status', ['agreement', 'shortlisted', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        .limit(1)
      // Fallback for tradies — find jobs via quote_requests if tradie_id not yet set
      let jobList = jobs || []
      if (isTradie && jobList.length === 0) {
        const { data: qrs } = await supabase
          .from('quote_requests')
          .select('job_id')
          .eq('tradie_id', session.user.id)
        if (qrs && qrs.length > 0) {
          const jobIds = qrs.map((q: any) => q.job_id)
          const { data: fallbackJobs } = await supabase
            .from('jobs')
            .select('*, tradie:tradie_profiles(*, profile:profiles(*)), client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
            .in('id', jobIds)
            .in('status', ['agreement', 'shortlisted', 'delivery', 'signoff', 'warranty', 'complete'])
            .order('updated_at', { ascending: false })
            .limit(1)
          jobList = fallbackJobs || []
        }
      }

      if (jobList && jobList.length > 0) {
        setJob(jobList[0])
        const { data: scopeData } = await supabase.from('scope_agreements').select('*').eq('job_id', jobs[0].id).single()
        if (scopeData) {
          setScope(scopeData)
          setScopeVersion(scopeData.version || 1)
          if (scopeData.dialogue_score) {
          }
        }
        const { data: msgs } = await supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('job_id', jobs[0].id).order('created_at', { ascending: true })
        setMessages(msgs || [])
        const { data: qs } = await supabase.from('quotes').select('*, tradie:tradie_profiles(business_name)').eq('job_id', jobs[0].id).order('created_at', { ascending: false })
        if (qs && qs.length > 0) { setCurrentQuote(qs[0]); setAllQuotes(qs) }
        const { data: qrs } = await supabase.from('quote_requests').select('*, tradie:tradie_profiles(business_name, rating_avg, jobs_completed)').eq('job_id', jobs[0].id)
        setQuoteRequests(qrs || [])
        if (jobs[0].agreement_document_name) {
          setUploadedDoc({ name: jobs[0].agreement_document_name, path: jobs[0].agreement_document_url })
        }
        const hintKey = 'sh_scope_hint_seen_' + jobs[0].id
        const hintSeen = localStorage.getItem(hintKey)
        if (!hintSeen && jobs[0].tradie_id && !scopeData) {
          setTimeout(() => setShowScopeHint(true), 1200)
        }
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!job) return
    const supabase = createClient()
    const channel = supabase.channel('agreement_msgs:' + job.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages', filter: 'job_id=eq.' + job.id }, async (payload) => {
        const { data: msg } = await supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('id', payload.new.id).single()
        if (msg) setMessages(prev => [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [job])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const acceptQuote = async (quote: any) => {
    if (!job) return
    setAcceptingQuote(true)
    const supabase = createClient()
    await supabase.from('jobs').update({ tradie_id: quote.tradie_id, status: 'agreement' }).eq('id', job.id)
    await supabase.from('quote_requests').update({ status: 'accepted' }).eq('job_id', job.id).eq('tradie_id', quote.tradie_id)
    await supabase.from('quote_requests').update({ status: 'declined' }).eq('job_id', job.id).neq('tradie_id', quote.tradie_id)
    const { data: updatedQRs } = await supabase.from('quote_requests').select('*, tradie:tradie_profiles(business_name, rating_avg, jobs_completed)').eq('job_id', job.id)
    setQuoteRequests(updatedQRs || [])
    setJob({ ...job, tradie_id: quote.tradie_id })
    setCurrentQuote(quote)
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user.id, body: 'Quote from ' + (quote.tradie?.business_name || 'tradie') + ' accepted — $' + Number(quote.total_price).toLocaleString() + '. Generating scope agreement.' })
    setAcceptingQuote(false)
    await draftScope()
    setTimeout(() => {
      document.getElementById('scope-document')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 800)
  }

  const draftScope = async (suggestion?: string) => {
    if (!job) return
    setDrafting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session?.access_token },
      body: JSON.stringify({ job_id: job.id, suggestion }),
    })
    const data = await res.json()
    if (data.scope) { setScope(data.scope); setScopeVersion(v => v + 1) }
    setDrafting(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !job || !user) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user.id, body: newMessage.trim() })
    setNewMessage('')
    setSending(false)
  }

  const pushToScope = async (msg: any) => {
    setPushingMsg(msg.id)
    await draftScope(msg.body)
    const supabase = createClient()
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user.id, body: 'Scope updated from suggestion: "' + msg.body + '"' })
    setPushingMsg(null)
  }

  const saveEdit = async (updates: any) => {
    if (!scope) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    setScope({ ...scope, ...updates })
    await supabase.from('scope_agreements').update({ ...updates, last_edited_by: session?.user.id, last_edited_at: new Date().toISOString(), client_signed_at: null, tradie_signed_at: null }).eq('id', scope.id)

    const editedField = Object.keys(updates)[0]
    const fieldLabel: Record<string,string> = { inclusions: 'inclusions', exclusions: 'exclusions', milestones: 'payment milestones' }
    const label = fieldLabel[editedField] || editedField
    const editorName = profile?.role === 'tradie' ? job?.tradie?.business_name : job?.client?.full_name

    await supabase.from('job_messages').insert({
      job_id: job?.id,
      sender_id: session?.user.id,
      body: 'Scope updated by ' + editorName + ' — ' + label + ' revised. Both parties will need to re-sign.',
    })

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'scope_edited', job_id: job?.id, edited_by: editorName, field: label }),
    }).catch(() => {})

    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' }))
  }


  const signScope = async () => {
    if (!job || !scope) return
    const supabase = createClient()
    const field = profile?.role === 'tradie' ? 'tradie_signed_at' : 'client_signed_at'
    await supabase.from('scope_agreements').update({ [field]: new Date().toISOString() }).eq('id', scope.id)
    setScope({ ...scope, [field]: new Date().toISOString() })
    const updated = { ...scope, [field]: new Date().toISOString() }
    if (updated.client_signed_at && updated.tradie_signed_at) {
      await supabase.from('jobs').update({ status: 'delivery' }).eq('id', job.id)
      await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'score_stage', stage: 'confirm', job_id: job?.id }),
      }).catch(() => {})
      setTimeout(() => { window.location.href = profile?.role === 'tradie' ? '/tradie/job?id=' + job?.id : '/delivery' }, 1200)
    }
  }

  const uploadDocument = async (file: File) => {
    if (!job || !user) return
    setUploadingDoc(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_id', job.id)
    formData.append('user_id', user.id)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.uploaded) setUploadedDoc({ name: data.name, path: data.path })
    setUploadingDoc(false)
  }

  const isTradie = profile?.role === 'tradie'
  const STAGE_ORDER = ['matching', 'shortlisted', 'quotes', 'agreement', 'delivery', 'signoff', 'warranty', 'complete']
  const jobStageIndex = job ? STAGE_ORDER.indexOf(job.status) : -1
  const isPastAgreement = jobStageIndex > STAGE_ORDER.indexOf('agreement')
  const multipleQuotes = allQuotes.length > 1 || quoteRequests.length > 1
  const hasAcceptedQuote = quoteRequests.some(qr => qr.status === 'accepted')
  const jobRef = job ? 'SH-' + job.id.slice(0, 8).toUpperCase() : ''
  const today = new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={false}   />
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
        {[{n:1,l:'Request',p:'/request',c:'#2E7D60'},{n:2,l:'Match',p:'/shortlist',c:'#2E6A8F'},{n:3,l:'Assess',p:'/assess',c:'#9B6B9B'},{n:4,l:'Quote',p:'/quotes',c:'#C07830'},{n:5,l:'Confirm',p:'/agreement',c:'#6B4FA8'},{n:6,l:'Build',p:'/delivery',c:'#C07830'},{n:7,l:'Complete',p:'/signoff',c:'#D4522A'},{n:8,l:'Protect',p:'/warranty',c:'#1A6B5A'}].map(s => {
            const STAGE_ORDER = ['matching','shortlisted','assess','quotes','agreement','delivery','signoff','warranty','complete']
            const jobIdx = job ? STAGE_ORDER.indexOf(job.status) : -1
            const pathOrder = ['/request','/shortlist','/assess','/quotes','/agreement','/delivery','/signoff','/warranty','/warranty']
            const isComplete = pathOrder.indexOf(s.p) !== -1 && pathOrder.indexOf(s.p) < pathOrder.indexOf('/agreement') && pathOrder.indexOf(s.p) <= jobIdx
            const isCurrent = s.p === '/agreement'
            return (
          <a key={s.n} href={s.p} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {s.p === '/agreement' && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (s.n < 3 ? '#2E7D60' : s.p === '/agreement' ? s.c : 'rgba(28,43,50,0.2)'), background: s.n < 3 ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: s.n < 3 ? 'white' : s.p === '/agreement' ? s.c : '#7A9098' }}>
              {s.n < 3 ? '✓' : s.n}
            </div>
            <div style={{ fontSize:'12px', color: s.p === '/agreement' ? '#1C2B32' : s.n < 3 ? '#2E7D60' : '#7A9098', fontWeight: s.p === '/agreement' ? 600 : 400 }}>{s.l}</div>
          </a>
            )
        })}
      </div>
    </div>
  )

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div></>

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px', fontFamily:'sans-serif' }}>No job in agreement stage.</p>
        <a href="/shortlist"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to shortlist</button></a>
      </div>
    </div></>
  )

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'260px 1fr', gap:'24px', alignItems:'start' }} className="agreement-2col">

        {/* LEFT SIDEBAR */}
        <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px', position:'sticky' as const, top:'130px' }}>

          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'rgba(216,228,225,0.4)', letterSpacing:'1px', marginBottom:'2px' }}>DOCUMENT</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px' }}>{jobRef}</p>
            </div>
            <div style={{ padding:'14px 16px' }}>
              {[
                { label:'Status', value: scope ? (scope.client_signed_at && scope.tradie_signed_at ? 'Fully signed' : scope.client_signed_at || scope.tradie_signed_at ? 'Partially signed' : 'Draft') : 'No scope yet' },
                { label:'Version', value: 'v' + scopeVersion },
                { label:'Trade', value: job.trade_category },
                { label:'Location', value: job.suburb },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', flexDirection:'column' as const, padding:'6px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                  <span style={{ fontSize:'10px', color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{item.label}</span>
                  <span style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginTop:'1px' }}>{item.value}</span>
                </div>
              ))}
              {saving && <p style={{ fontSize:'12px', color:'#4A5E64', marginTop:'8px' }}>Saving...</p>}
              {savedAt && !saving && <p style={{ fontSize:'11px', color:'#2E7D60', marginTop:'8px' }}>✓ Saved {savedAt}</p>}
            </div>
          </div>

          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#1C2B32', letterSpacing:'0.5px' }}>SIGNING STATUS</p>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              {[
                { label: job.client?.full_name || 'Client', role:'client', signed: scope?.client_signed_at },
                { label: job.tradie?.business_name || 'Tradie', role:'tradie', signed: scope?.tradie_signed_at },
              ].map(party => (
                <div key={party.role} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: party.signed ? '#2E7D60' : 'rgba(28,43,50,0.08)', border:'1.5px solid ' + (party.signed ? '#2E7D60' : 'rgba(28,43,50,0.15)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', flexShrink:0 }}>
                    {party.signed ? '✓' : ''}
                  </div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', margin:0 }}>{party.label}</p>
                    <p style={{ fontSize:'10px', color: party.signed ? '#2E7D60' : '#9AA5AA', margin:0 }}>{party.signed ? 'Signed ' + new Date(party.signed).toLocaleDateString('en-AU') : 'Not yet signed'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <a href="/messages" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'13px 16px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', textDecoration:'none', transition:'all 0.15s' }}>
            <span style={{ fontSize:'18px' }}>💬</span>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Job messages</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Continue the conversation →</p>
            </div>
          </a>



        </div>

        {/* CENTRE — THE DOCUMENT */}
        {isPastAgreement && (
          <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
            <p style={{ fontSize:'13px', fontWeight:500, color:'#6B4FA8', marginBottom:'6px' }}>You are reviewing Stage 4 — Scope Agreement</p>
            <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px', lineHeight:'1.6' }}>
              This job has moved to the <strong>{job?.status}</strong> stage. The scope agreement below is read-only. Both parties signed on {scope?.client_signed_at ? new Date(scope.client_signed_at).toLocaleDateString('en-AU') : '—'}.
            </p>
            <a href={job?.status === 'delivery' ? '/delivery' : job?.status === 'signoff' ? '/signoff' : '/warranty'}>
              <button type="button" style={{ background:'#6B4FA8', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to current stage →
              </button>
            </a>
          </div>
        )}
        <div>
          {multipleQuotes && !isTradie && allQuotes.length > 0 && !hasAcceptedQuote && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(46,106,143,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#2E6A8F', letterSpacing:'0.5px' }}>SELECT A QUOTE TO PROCEED</p>
                <p style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{allQuotes.length} quotes received — accept one to begin the scope agreement</p>
              </div>
              <div style={{ padding:'16px', display:'grid', gridTemplateColumns: allQuotes.length === 1 ? '1fr' : '1fr 1fr', gap:'10px' }}>
                {allQuotes.map((q, i) => {
                  const isLowest = Number(q.total_price) === Math.min(...allQuotes.map((x: any) => Number(x.total_price)))
                  return (
                    <div key={q.id} style={{ border:'1.5px solid ' + (isLowest ? '#2E6A8F' : 'rgba(28,43,50,0.12)'), borderRadius:'10px', padding:'14px', background:'#C8D5D2', position:'relative' as const }}>
                      {isLowest && <div style={{ position:'absolute', top:'-9px', left:'12px', background:'#2E6A8F', color:'white', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'100px' }}>LOWEST</div>}
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', marginBottom:'4px' }}>{q.tradie?.business_name}</p>
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#1C2B32', marginBottom:'6px' }}>${Number(q.total_price).toLocaleString()}</p>
                      {q.estimated_days && <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'2px' }}>{q.estimated_days} days</p>}
                      {q.breakdown?.map((b: any, bi: number) => (
                        <div key={bi} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#4A5E64', padding:'2px 0' }}>
                          <span>{b.label}</span><span>${Number(b.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <button type="button" onClick={() => acceptQuote(q)} disabled={acceptingQuote}
                        style={{ width:'100%', background:'#1C2B32', color:'white', padding:'9px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', marginTop:'10px', opacity: acceptingQuote ? 0.7 : 1 }}>
                        Select this quote and review scope →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {multipleQuotes && !isTradie && quoteRequests.length > 0 && allQuotes.length === 0 && (
            <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px', textAlign:'center' as const }}>
              <p style={{ fontSize:'14px', color:'#C07830', fontWeight:500, marginBottom:'4px' }}>⏳ Waiting for quotes</p>
              <p style={{ fontSize:'13px', color:'#4A5E64' }}>Quote requests sent to {quoteRequests.length} tradie{quoteRequests.length > 1 ? 's' : ''}. They will appear here as they are submitted.</p>
            </div>
          )}

          {/* THE DOCUMENT */}
          <div id="scope-document" style={{ background:'white', borderRadius:'16px', boxShadow:'0 4px 40px rgba(28,43,50,0.12), 0 1px 8px rgba(28,43,50,0.08)', overflow:'hidden', marginBottom:'20px' }}>

            {/* Document header */}
            <div style={{ background:'#1C2B32', padding:'28px 36px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 90% 0%, rgba(212,82,42,0.2), transparent 55%)' }} />
              <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' as const }}>
                <div>
                  <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.4)', letterSpacing:'2px', marginBottom:'6px' }}>STEADYHAND</div>
                  <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>SCOPE AGREEMENT</h1>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)' }}>Request to warranty · Western Australia</p>
                </div>
                <div style={{ textAlign:'right' as const }}>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', letterSpacing:'0.5px', marginBottom:'3px' }}>DOCUMENT REF</p>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'rgba(216,228,225,0.7)', letterSpacing:'1px' }}>{jobRef}</p>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', marginTop:'6px' }}>{today}</p>
                  <div style={{ marginTop:'8px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.08)', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'100px', padding:'3px 10px' }}>
                    <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: scope?.client_signed_at && scope?.tradie_signed_at ? '#2E7D60' : '#C07830' }} />
                    <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.55)', letterSpacing:'0.5px' }}>
                      {scope?.client_signed_at && scope?.tradie_signed_at ? 'FULLY EXECUTED' : scope?.client_signed_at || scope?.tradie_signed_at ? 'PARTIALLY SIGNED' : 'DRAFT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid #F0F0F0' }}>
              <div style={{ padding:'24px 32px', borderRight:'1px solid #F0F0F0' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'10px', fontWeight:600 }}>Client</p>
                <p style={{ fontSize:'16px', fontWeight:600, color:'#1C2B32', marginBottom:'3px' }}>{job.client?.full_name}</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>{job.client?.suburb || job.suburb}</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>{job.client?.email}</p>
              </div>
              <div style={{ padding:'24px 32px' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'10px', fontWeight:600 }}>Tradie</p>
                {job.tradie ? (
                  <>
                    <p style={{ fontSize:'16px', fontWeight:600, color:'#1C2B32', marginBottom:'3px' }}>{job.tradie.business_name}</p>
                    <p style={{ fontSize:'13px', color:'#7A9098' }}>{job.tradie.profile?.full_name}</p>
                    {job.tradie.licence_number && <p style={{ fontSize:'13px', color:'#7A9098' }}>Lic. {job.tradie.licence_number}</p>}
                    {job.tradie.abn && <p style={{ fontSize:'13px', color:'#7A9098' }}>ABN {job.tradie.abn}</p>}
                  </>
                ) : (
                  <p style={{ fontSize:'13px', color:'#C07830', fontStyle:'italic' }}>Awaiting tradie selection</p>
                )}
              </div>
            </div>

            {/* Job summary */}
            <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0', background:'#FAFBFB' }}>
              <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'12px', fontWeight:600 }}>Job description</p>
              <p style={{ fontSize:'17px', fontWeight:600, color:'#1C2B32', marginBottom:'6px' }}>{job.title}</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.65', marginBottom:'10px' }}>{job.description}</p>
              <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' as const }}>
                <span style={{ fontSize:'12px', color:'#7A9098', background:'#F0F4F3', padding:'4px 10px', borderRadius:'6px' }}>{job.trade_category}</span>
                <span style={{ fontSize:'12px', color:'#7A9098', background:'#F0F4F3', padding:'4px 10px', borderRadius:'6px' }}>{job.suburb}</span>
                <span style={{ fontSize:'12px', color:'#7A9098', background:'#F0F4F3', padding:'4px 10px', borderRadius:'6px' }}>{job.property_type}</span>
                {currentQuote && <span style={{ fontSize:'12px', color:'#1C2B32', background:'#F0F4F3', padding:'4px 10px', borderRadius:'6px', fontWeight:600 }}>Quoted: ${Number(currentQuote.total_price).toLocaleString()}</span>}
              </div>
            </div>

                {scope && scope.last_edited_at && scope.last_edited_by && (!scope.client_signed_at || !scope.tradie_signed_at) && (
              <div style={{ padding:'14px 18px', background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderBottom:'1px solid rgba(107,79,168,0.1)' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#6B4FA8', marginBottom:'3px' }}>Scope was recently updated</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>
                  Last edited {new Date(scope.last_edited_at).toLocaleDateString('en-AU')} at {new Date(scope.last_edited_at).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}. Both parties need to review and re-sign before work can begin.
                </p>
              </div>
            )}

            {/* External document upload */}
                <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0', background:'#FAFBFB' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'6px', fontWeight:600 }}>Working in your own system?</p>
                  <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'14px' }}>If you have prepared your agreement or quote in Xero, your CRM, or another tool, upload the signed document here. Steadyhand will store it against this job and warranty tracking will continue from the signing date.</p>
                  {uploadedDoc ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px' }}>
                      <span style={{ fontSize:'20px' }}>📄</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{uploadedDoc.name}</p>
                        <p style={{ fontSize:'11px', color:'#2E7D60', margin:0 }}>✓ Stored against this job</p>
                      </div>
                      <label style={{ fontSize:'12px', color:'#7A9098', cursor:'pointer', textDecoration:'underline' }}>
                        Replace
                        <input type="file" accept=".pdf,.doc,.docx" onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])} style={{ display:'none' }} />
                      </label>
                    </div>
                  ) : (
                    <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'16px', border:'2px dashed rgba(28,43,50,0.15)', borderRadius:'10px', cursor:'pointer', background:'white' }}>
                      <span style={{ fontSize:'20px' }}>📎</span>
                      <div style={{ textAlign:'center' as const }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{uploadingDoc ? 'Uploading...' : 'Upload signed agreement or quote'}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>PDF, Word or image · Max 10MB</p>
                      </div>
                      <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])} style={{ display:'none' }} disabled={uploadingDoc} />
                    </label>
                  )}
                </div>

                            {/* Quote details */}
            {currentQuote && (
              <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'16px', fontWeight:600 }}>Agreed price</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:'12px', marginBottom:'16px' }}>
                  <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'40px', color:'#1C2B32', letterSpacing:'1px' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                  <span style={{ fontSize:'14px', color:'#7A9098' }}>AUD inc. GST</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, auto)', gap:'20px', marginBottom: currentQuote.breakdown?.length > 0 ? '20px' : '0' }}>
                  {currentQuote.estimated_start && (
                    <div>
                      <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'3px' }}>START DATE</p>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{new Date(currentQuote.estimated_start).toLocaleDateString('en-AU')}</p>
                    </div>
                  )}
                  {currentQuote.estimated_days && (
                    <div>
                      <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'3px' }}>DURATION</p>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{currentQuote.estimated_days} days</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'3px' }}>QUOTE VERSION</p>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>v{currentQuote.version}</p>
                  </div>
                </div>
                {currentQuote.breakdown?.length > 0 && (
                  <div style={{ background:'#F8FAFA', borderRadius:'8px', overflow:'hidden' }}>
                    <div style={{ padding:'10px 14px', background:'#F0F4F3', borderBottom:'1px solid #E8EEEC' }}>
                      <p style={{ fontSize:'11px', fontWeight:600, color:'#4A5E64', letterSpacing:'0.5px' }}>PRICE BREAKDOWN</p>
                    </div>
                    {currentQuote.breakdown.map((b: any, i: number) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:'1px solid #F0F0F0' }}>
                        <span style={{ fontSize:'13px', color:'#1C2B32' }}>{b.label}</span>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32' }}>${Number(b.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#F0F4F3' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32' }}>Total</span>
                      <span style={{ fontSize:'15px', fontWeight:700, color:'#1C2B32' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {currentQuote.conditions && (
                  <div style={{ marginTop:'12px', padding:'12px 14px', background:'#FFFBF0', border:'1px solid #F0E8C8', borderRadius:'8px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#9A8050', marginBottom:'4px', letterSpacing:'0.5px' }}>CONDITIONS</p>
                    <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.5', margin:0 }}>{currentQuote.conditions}</p>
                  </div>
                )}
              </div>
            )}

            {!currentQuote && job.tradie_id && (
              <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0', textAlign:'center' as const, background:'#FAFBFB' }}>
                <p style={{ fontSize:'14px', color:'#C07830', marginBottom:'4px' }}>⏳ Awaiting quote from tradie</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>The tradie will submit their quote through the platform. It will appear here automatically.</p>
              </div>
            )}

            {/* Scope */}
  
          {allQuotes.length > 1 && job?.tradie_id && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'2px' }}>QUOTE VERSION HISTORY</p>
                <p style={{ fontSize:'12px', color:'#7A9098' }}>Full revision trail — available to both parties for contract variation reference</p>
              </div>
              <div style={{ padding:'16px 18px' }}>
                {allQuotes.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: i < allQuotes.length - 1 ? '16px' : 0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ background: i === 0 ? '#2E7D60' : 'rgba(28,43,50,0.1)', color: i === 0 ? 'white' : '#7A9098', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'100px' }}>
                          {i === 0 ? 'CURRENT · v' + q.version : 'v' + q.version}
                        </div>
                        <span style={{ fontSize:'12px', color:'#7A9098' }}>{new Date(q.created_at).toLocaleDateString('en-AU')} at {new Date(q.created_at).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}</span>
                        {q.tradie?.business_name && <span style={{ fontSize:'12px', color:'#7A9098' }}>· {q.tradie.business_name}</span>}
                      </div>
                      <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color: i === 0 ? '#1C2B32' : '#7A9098' }}>${Number(q.total_price).toLocaleString()}</span>
                    </div>
                    {q.breakdown?.length > 0 && (
                      <div style={{ background: i === 0 ? '#F4F8F7' : 'rgba(28,43,50,0.03)', borderRadius:'8px', overflow:'hidden', marginBottom:'8px' }}>
                        {q.breakdown.map((b: any, bi: number) => {
                          const prev = i < allQuotes.length - 1 ? allQuotes[i + 1].breakdown?.find((pb: any) => pb.label === b.label) : null
                          const changed = prev && prev.amount !== b.amount
                          const isNew = i < allQuotes.length - 1 && !allQuotes[i + 1].breakdown?.find((pb: any) => pb.label === b.label)
                          return (
                            <div key={bi} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', borderBottom:'1px solid rgba(28,43,50,0.05)', background: isNew ? 'rgba(46,125,96,0.04)' : changed ? 'rgba(192,120,48,0.04)' : 'transparent' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                {isNew && <span style={{ fontSize:'9px', background:'rgba(46,125,96,0.1)', color:'#2E7D60', padding:'1px 5px', borderRadius:'4px', fontWeight:600 }}>NEW</span>}
                                {changed && <span style={{ fontSize:'9px', background:'rgba(192,120,48,0.1)', color:'#C07830', padding:'1px 5px', borderRadius:'4px', fontWeight:600 }}>CHANGED</span>}
                                <span style={{ fontSize:'12px', color:'#4A5E64' }}>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                              </div>
                              <div style={{ textAlign:'right' as const }}>
                                <span style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32' }}>${Number(b.amount).toLocaleString()}</span>
                                {changed && prev && <p style={{ fontSize:'10px', color:'#C07830', margin:0 }}>was ${Number(prev.amount).toLocaleString()}</p>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {q.conditions && i > 0 && q.conditions !== allQuotes[i-1]?.conditions && (
                      <div style={{ background:'rgba(192,120,48,0.04)', border:'1px solid rgba(192,120,48,0.15)', borderRadius:'6px', padding:'8px 10px' }}>
                        <p style={{ fontSize:'11px', fontWeight:600, color:'#C07830', margin:'0 0 3px', letterSpacing:'0.5px' }}>TERMS UPDATED</p>
                        <p style={{ fontSize:'11px', color:'#4A5E64', margin:0 }}>Conditions were revised in this version.</p>
                      </div>
                    )}
                    {i < allQuotes.length - 1 && (
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'12px 0 0' }}>
                        <div style={{ flex:1, height:'1px', background:'rgba(28,43,50,0.08)' }} />
                        <span style={{ fontSize:'10px', color:'#7A9098' }}>previous version</span>
                        <div style={{ flex:1, height:'1px', background:'rgba(28,43,50,0.08)' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!scope && (
              <div style={{ padding:'32px', textAlign:'center' as const, borderBottom:'1px solid #F0F0F0' }}>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>No scope drafted yet. Steadyhand will generate a scope from your job details.</p>
                <button type="button" onClick={() => draftScope()} disabled={drafting}
                  style={{ background:'#6B4FA8', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: drafting ? 0.7 : 1 }}>
                  {drafting ? 'Drafting...' : 'Draft scope with Steadyhand →'}
                </button>
              </div>
            )}

            {scope && (
              <>
                {scope.inclusions?.length > 0 && (
                  <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0' }}>
                    <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'14px', fontWeight:600 }}>Inclusions</p>
                    {scope.inclusions.map((item: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:'12px', padding:'6px 0', borderBottom:'1px solid #F8F8F8', alignItems:'center' }}>
                        <span style={{ color:'#2E7D60', fontSize:'14px', flexShrink:0 }}>✓</span>
                        <input type="text" defaultValue={item}
                          onBlur={e => { const updated = [...scope.inclusions]; updated[i] = e.target.value; saveEdit({ inclusions: updated }) }}
                          style={{ flex:1, border:'none', background:'transparent', fontSize:'14px', color:'#1C2B32', outline:'none', padding:'3px 6px', borderRadius:'4px', cursor:'text', fontFamily:'sans-serif' }}
                          onFocus={e => { e.target.style.background = '#F4F8F7'; e.target.style.outline = '1px solid #C8D5D2' }}
                          onBlurCapture={e => { e.target.style.background = 'transparent'; e.target.style.outline = 'none' }} />
                        <button type="button" onClick={() => saveEdit({ inclusions: scope.inclusions.filter((_: string, idx: number) => idx !== i) })}
                          style={{ background:'none', border:'none', color:'#CCC', cursor:'pointer', fontSize:'16px', flexShrink:0, padding:'0 4px', lineHeight:1 }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => saveEdit({ inclusions: [...scope.inclusions, 'New inclusion'] })}
                      style={{ marginTop:'10px', fontSize:'12px', color:'#2E7D60', background:'none', border:'1px dashed rgba(46,125,96,0.3)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                      + Add inclusion
                    </button>
                  </div>
                )}

                {scope.exclusions?.length > 0 && (
                  <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0' }}>
                    <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'14px', fontWeight:600 }}>Exclusions</p>
                    {scope.exclusions.map((item: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:'12px', padding:'6px 0', borderBottom:'1px solid #F8F8F8', alignItems:'center' }}>
                        <span style={{ color:'#D4522A', fontSize:'14px', flexShrink:0 }}>×</span>
                        <input type="text" defaultValue={item}
                          onBlur={e => { const updated = [...scope.exclusions]; updated[i] = e.target.value; saveEdit({ exclusions: updated }) }}
                          style={{ flex:1, border:'none', background:'transparent', fontSize:'14px', color:'#1C2B32', outline:'none', padding:'3px 6px', borderRadius:'4px', cursor:'text', fontFamily:'sans-serif' }}
                          onFocus={e => { e.target.style.background = '#F4F8F7' }}
                          onBlurCapture={e => { e.target.style.background = 'transparent' }} />
                        <button type="button" onClick={() => saveEdit({ exclusions: scope.exclusions.filter((_: string, idx: number) => idx !== i) })}
                          style={{ background:'none', border:'none', color:'#CCC', cursor:'pointer', fontSize:'16px', flexShrink:0, padding:'0 4px', lineHeight:1 }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => saveEdit({ exclusions: [...scope.exclusions, 'New exclusion'] })}
                      style={{ marginTop:'10px', fontSize:'12px', color:'#D4522A', background:'none', border:'1px dashed rgba(212,82,42,0.3)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                      + Add exclusion
                    </button>
                  </div>
                )}

                <MilestoneEditor scope={scope} currentQuote={currentQuote} onSave={(milestones: any) => saveEdit({ milestones })} />

                <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0', background:'#FAFBFB' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'14px', fontWeight:600 }}>Warranty terms</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
                    {[
                      { label:'Warranty period', value: (scope.warranty_days || 90) + ' days' },
                      { label:'Response SLA', value: (scope.response_sla_days || 5) + ' business days' },
                      { label:'Remediation', value: (scope.remediation_days || 14) + ' days' },
                    ].map(item => (
                      <div key={item.label} style={{ padding:'12px', background:'#F0F4F3', borderRadius:'8px' }}>
                        <p style={{ fontSize:'10px', color:'#7A9098', marginBottom:'4px', letterSpacing:'0.5px' }}>{item.label.toUpperCase()}</p>
                        <p style={{ fontSize:'14px', fontWeight:600, color:'#1C2B32' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signature blocks */}
                <div style={{ padding:'32px', background:'#FAFBFB' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'20px', fontWeight:600 }}>Signatures</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
                    {[
                      { label:'Client', name: job.client?.full_name, signed: scope.client_signed_at, role:'client' },
                      { label:'Tradie', name: job.tradie?.business_name || job.tradie?.profile?.full_name, signed: scope.tradie_signed_at, role:'tradie' },
                    ].map(party => (
                      <div key={party.label} style={{ border:'1px solid ' + (party.signed ? '#2E7D60' : '#E0E8E6'), borderRadius:'10px', overflow:'hidden' }}>
                        <div style={{ padding:'12px 16px', background: party.signed ? 'rgba(46,125,96,0.06)' : '#F8FAFA', borderBottom:'1px solid ' + (party.signed ? 'rgba(46,125,96,0.15)' : '#EEF0F0') }}>
                          <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'2px' }}>{party.label.toUpperCase()}</p>
                          <p style={{ fontSize:'14px', fontWeight:600, color:'#1C2B32' }}>{party.name || 'Not assigned'}</p>
                        </div>
                        <div style={{ padding:'16px', minHeight:'60px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {party.signed ? (
                            <div style={{ textAlign:'center' as const }}>
                              <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, marginBottom:'2px' }}>✓ Signed</p>
                              <p style={{ fontSize:'11px', color:'#7A9098' }}>{new Date(party.signed).toLocaleDateString('en-AU')} at {new Date(party.signed).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}</p>
                            </div>
                          ) : (
                            <p style={{ fontSize:'12px', color:'#BBBEC0', fontStyle:'italic' }}>Awaiting signature</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!(profile?.role === 'tradie' ? scope.tradie_signed_at : scope.client_signed_at) && (
                    <>
                      {!scope && !uploadedDoc ? (
                        <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'10px' }}>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#C07830', marginBottom:'4px' }}>Scope required before signing</p>
                          <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Generate a scope agreement with Steadyhand or upload your own document before signing.</p>
                        </div>
                      ) : (
                        <button type="button" onClick={signScope}
                          style={{ width:'100%', background:'#1C2B32', color:'white', padding:'15px', borderRadius:'10px', fontSize:'15px', fontWeight:600, border:'none', cursor:'pointer', letterSpacing:'0.3px', marginBottom:'10px' }}>
                          Sign as {profile?.role === 'tradie' ? job.tradie?.business_name : job.client?.full_name} →
                        </button>
                      )}
                    </>
                  )}
                  <button type="button" onClick={() => draftScope()} disabled={drafting}
                    style={{ width:'100%', background:'transparent', color:'#6B4FA8', padding:'12px', borderRadius:'10px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(107,79,168,0.25)', cursor:'pointer', opacity: drafting ? 0.7 : 1 }}>
                    {drafting ? 'Redrafting...' : '↻ Redraft scope with Steadyhand'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div></>
  )
}
