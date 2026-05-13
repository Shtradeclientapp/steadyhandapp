'use client'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { DialogueGuide } from '@/components/ui/DialogueGuide'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAcceptedTradie } from '@/lib/supabase/helpers'
import { StageRail } from '@/components/ui'
import { JobSelector } from '@/components/ui/JobSelector'
import { MilestoneEditor } from '@/components/ui/MilestoneEditor'


export default function AgreementPage() {
  const [user, setUser]               = useState<any>(null)
  const [profile, setProfile]         = useState<any>(null)
  const [isTradie, setIsTradie]       = useState(false)
  const [job, setJob]                 = useState<any>(null)
  const [allJobs, setAllJobs]         = useState<any[]>([])
  const [scope, setScope]             = useState<any>(null)
  const [scopeVersion, setScopeVersion] = useState(1)
  const [currentQuote, setCurrentQuote] = useState<any>(null)
  const [allQuotes, setAllQuotes]     = useState<any[]>([])
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [messages, setMessages]       = useState<any[]>([])
  const [newMessage, setNewMessage]   = useState('')
  const [loading, setLoading]         = useState(true)
  const [drafting, setDrafting]       = useState(false)
  const [intentForm, setIntentForm]   = useState({ goal:'', concern:'', success:'', access:'' })
  const [intentSent, setIntentSent]   = useState(false)
  const [intentDrafting, setIntentDrafting] = useState(false)
  const [siteBrief, setSiteBrief]     = useState<string|null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [signing, setSigning]         = useState(false)
  const [stripeRequired, setStripeRequired] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('stripe') === 'connected') {
      setStripeRequired(false)
    }
  }, [])
  const [saving, setSaving]           = useState(false)
  const [savedAt, setSavedAt]         = useState<string|null>(null)
  const [saveError, setSaveError]     = useState<string|null>(null)
  const [draftError, setDraftError]   = useState<string|null>(null)
  const [sending, setSending]         = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadedDoc, setUploadedDoc] = useState<any>(null)
  const [xeroConnected, setXeroConnected] = useState(false)
  const [xeroSyncing, setXeroSyncing] = useState(false)
  const [xeroSynced, setXeroSynced]   = useState(false)
  const [xeroError, setXeroError]     = useState<string|null>(null)
  const [acceptingQuote, setAcceptingQuote] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadJobData = async (supabase: any, jobId: string) => {
    const [scopeRes, msgsRes, quotesRes, qrsRes] = await Promise.all([
      supabase.from('scope_agreements').select('*').eq('job_id', jobId).maybeSingle(),
      supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('job_id', jobId).order('created_at', { ascending: true }),
      supabase.from('quotes').select('*, tradie:tradie_profiles(business_name)').eq('job_id', jobId).order('created_at', { ascending: false }),
      supabase.from('quote_requests').select('*, tradie:tradie_profiles(business_name, rating_avg, jobs_completed)').eq('job_id', jobId),
    ])
    if (scopeRes.data) { setScope(scopeRes.data); setScopeVersion(scopeRes.data.version || 1) }
    setMessages(msgsRes.data || [])
    if (quotesRes.data?.length > 0) { setCurrentQuote(quotesRes.data[0]); setAllQuotes(quotesRes.data) }
    setQuoteRequests(qrsRes.data || [])
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      // ── Load profile with explicit FK hint to avoid PGRST201 ──────────────
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tradie:tradie_profiles!tradie_profiles_id_fkey(id, business_name, subscription_tier, subscription_active, licence_verified, abn)')
        .eq('id', session.user.id)
        .single()
      if (!prof) { window.location.href = '/login'; return }
      setProfile(prof)

      const tradie = prof.role === 'tradie'
      setIsTradie(tradie)

      // ── Check URL for a specific job ID (from tradie job page link) ───────
      const urlJobId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('job_id')
        : null

      if (tradie) {
        let tradieJobs: any[] = []

        if (urlJobId) {
          // Direct load by job ID — try direct first, then via quote_requests (Option A)
          const { data: directJob } = await supabase
            .from('jobs')
            .select('*, tradie:tradie_profiles(*, profile:profiles(full_name, email)), client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
            .eq('id', urlJobId)
            .maybeSingle()
          if (directJob) {
            tradieJobs = [directJob]
          } else {
            // Tradie can't read job directly via RLS — go via accepted quote_request
            const { data: qrJob } = await supabase
              .from('quote_requests')
              .select('job:jobs(*, tradie:tradie_profiles(*, profile:profiles(full_name, email)), client:profiles!jobs_client_id_fkey(full_name, email, suburb))')
              .eq('tradie_id', session.user.id)
              .eq('qr_status', 'accepted')
              .eq('job_id', urlJobId)
              .maybeSingle()
            if (qrJob?.job) tradieJobs = [qrJob.job]
          }
        } else {
          // No job_id — Option A: load via accepted quote_requests (tradie_id on jobs deprecated)
          const { data: qrData } = await supabase
            .from('quote_requests')
            .select('job:jobs(*, tradie:tradie_profiles(*, profile:profiles(full_name, email)), client:profiles!jobs_client_id_fkey(full_name, email, suburb))')
            .eq('tradie_id', session.user.id)
            .eq('qr_status', 'accepted')
            .order('created_at', { ascending: false })
            .limit(5)
          tradieJobs = (qrData || []).map((r: any) => r.job).filter(Boolean)
        }

        if (tradieJobs.length > 0) {
          setJob(tradieJobs[0])
          setAllJobs(tradieJobs)
          await loadJobData(supabase, tradieJobs[0].id)
          if (tradieJobs[0].agreement_document_name) {
            setUploadedDoc({ name: tradieJobs[0].agreement_document_name, path: tradieJobs[0].agreement_document_url })
          }
        }
      } else {
        // ── CLIENT: load by client_id, respect ?job_id= param ──────────────
        let clientQuery = supabase
          .from('jobs')
          .select('*, tradie:tradie_profiles(*, profile:profiles(full_name, email)), client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
          .eq('client_id', session.user.id)
          .in('status', ['agreement','delivery','signoff','warranty','complete'])
          .order('updated_at', { ascending: false })
        if (urlJobId) clientQuery = clientQuery.eq('id', urlJobId)
        else clientQuery = clientQuery.limit(10)
        const { data: clientJobs } = await clientQuery

        if (clientJobs && clientJobs.length > 0) {
          setJob(clientJobs[0])
          setAllJobs(clientJobs)
          await loadJobData(supabase, clientJobs[0].id)
          if (clientJobs[0].agreement_document_name) {
            setUploadedDoc({ name: clientJobs[0].agreement_document_name, path: clientJobs[0].agreement_document_url })
          }
        }
      }

      // ── Xero connection check ────────────────────────────────────────────
      fetch('/api/xero/status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: session.user.id }) })
        .then(r => r.json()).then(d => setXeroConnected(d.connected || false)).catch(console.error)

      setLoading(false)
    })
  }, [])

  // ── Realtime messages ────────────────────────────────────────────────────
  useEffect(() => {
    if (!job) return
    const supabase = createClient()
    const channel = supabase.channel('agreement_msgs:' + job.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'job_messages', filter:'job_id=eq.' + job.id }, async (payload) => {
        const { data: msg } = await supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('id', payload.new.id).single()
        if (msg) setMessages(prev => [...prev, msg])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [job])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  // ── Actions ──────────────────────────────────────────────────────────────
  const draftClientIntent = async () => {
    if (!job) return
    setIntentDrafting(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: 'A homeowner needs to write a plain-language intent statement for a trade job scope agreement. Help them fill in these four fields based on their job description. Return ONLY a JSON object with keys: goal, concern, success, access.\n\nJob: ' + (job.title||'') + '\nTrade: ' + (job.trade_category||'') + '\nDescription: ' + (job.description||'Not provided') + '\n\nKeep each field to 1-2 plain sentences. Use first-person voice ("I want...", "I am worried...", "I will consider it done when..."). The access field should note practical site access information.' }]
        })
      })
      const data = await res.json()
      const text = data.content?.find((b: any) => b.type === 'text')?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setIntentForm({ goal: parsed.goal||'', concern: parsed.concern||'', success: parsed.success||'', access: parsed.access||'' })
    } catch { /* leave form empty */ }
    setIntentDrafting(false)
  }

  const sendClientIntent = async () => {
    if (!job || !user) return
    const supabase = createClient()
    const body = '📋 Client intent for scope:\n\nWhat I want achieved: ' + intentForm.goal + '\n\nWhat I am worried about: ' + intentForm.concern + '\n\nWhat success looks like: ' + intentForm.success + '\n\nSite access notes: ' + intentForm.access
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user.id, body })
    setIntentSent(true)
  }

  const loadSiteBrief = async () => {
    if (!job) return
    setBriefLoading(true)
    const supabase = createClient()
    const { data: msgs } = await supabase.from('job_messages').select('body, sender:profiles(role, full_name)').eq('job_id', job.id).order('created_at', { ascending: true }).limit(40)
    const intentMsg = msgs?.find((m: any) => m.body?.startsWith('📋 Client intent'))?.body || ''
    const consultMsgs = msgs?.filter((m: any) => !m.body?.startsWith('📋') && !m.body?.includes('has signed')).map((m: any) => '[' + (m.sender?.role||'user') + ']: ' + m.body).join('\n') || ''
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: 'You are preparing a site brief for a tradie about to draft a scope agreement.\n\nJob: ' + (job.title||'') + '\nTrade: ' + (job.trade_category||'') + '\nSuburb: ' + (job.suburb||'') + '\nDescription: ' + (job.description||'') + (intentMsg ? '\n\nClient intent statement:\n' + intentMsg : '') + (consultMsgs ? '\n\nConsult dialogue:\n' + consultMsgs : '') + '\n\nWrite a concise site brief covering: (1) What the client actually wants in plain terms, (2) Their key concerns or worries to address in the scope, (3) Access and site conditions to note, (4) Scope risks or things to be specific about. Use clear headings, 3-5 sentences total per section. Professional tone.' }]
        })
      })
      const data = await res.json()
      setSiteBrief(data.content?.find((b: any) => b.type === 'text')?.text || null)
    } catch { setSiteBrief(null) }
    setBriefLoading(false)
  }

  const draftScope = async (suggestion?: string) => {
    if (!job) return
    setDrafting(true); setDraftError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch('/api/scope', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + session?.access_token },
        body: JSON.stringify({ job_id: job.id, suggestion }),
      })
      const data = await res.json()
      if (data.scope) { setScope(data.scope); setScopeVersion(v => v + 1) }
      else setDraftError('Could not generate scope — please try again or write it manually.')
    } catch { setDraftError('Connection error — please try again.') }
    setDrafting(false)
  }

  const saveEdit = async (updates: any) => {
    if (!scope || !job) return
    setSaving(true); setSaveError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    setScope({ ...scope, ...updates })
    const { error } = await supabase.from('scope_agreements').update({
      ...updates,
      last_edited_by: session?.user.id,
      last_edited_at: new Date().toISOString(),
      client_signed_at: null,
      tradie_signed_at: null,
    }).eq('id', scope.id)
    if (error) { setSaveError('Save failed — check your connection.'); setSaving(false); return }
    const editorName = isTradie ? job.tradie?.business_name : job.client?.full_name
    const fieldLabel: Record<string,string> = { inclusions:'inclusions', exclusions:'exclusions', milestones:'payment milestones' }
    const label = fieldLabel[Object.keys(updates)[0]] || Object.keys(updates)[0]
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: session?.user.id, body: 'Scope updated by ' + editorName + ' — ' + label + ' revised. Both parties will need to re-sign.' })
    // Notify other party of scope update
    await fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type:'scope_updated', job_id: job.id, updated_by: isTradie ? 'tradie' : 'client' }) }).catch(console.error)
    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' }))
  }

  const signScope = async () => {
    if (!job || !scope) return
    // Gate tradie signing on Stripe Connect being set up
    if (isTradie) {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const { data: prof } = await supabase.from('profiles').select('stripe_account_id').eq('id', session?.user.id).single()
      if (!prof?.stripe_account_id) { setStripeRequired(true); return }
      // Check tradie has Stripe Connect set up before client signs
      if (!isTradie) {
        const { data: tradieProf } = await supabase
          .from('tradie_profiles')
          .select('stripe_account_id, charges_enabled')
          .eq('id', job?.tradie_id)
          .single()
        if (!tradieProf?.charges_enabled) {
          const ok = window.confirm(
            'The tradie has not yet connected their bank account to receive payment. ' +
            'You can sign the scope now, but payment cannot be processed until they do. ' +
            'Consider asking them to connect their bank account first. Continue anyway?'
          )
          if (!ok) { setSigning(false); return }
        }
      }
    }
    setSigning(true)
    setSaveError(null)
    try {
      // Use server-side signing to capture IP address and user agent for ETA compliance
      const signRes = await fetch('/api/sign-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope_id: scope.id, role: isTradie ? 'tradie' : 'client' }),
      })
      const signData = await signRes.json()
      if (!signRes.ok || !signData.success) throw new Error(signData.error || 'Signing failed')
      const updated = signData.scope
      setScope(updated)
      const supabase = createClient()
      const signerName = isTradie ? (job.tradie?.business_name || 'Tradie') : (job.client?.full_name || 'Client')
      // Snapshot party details at signing time for legal record integrity
      const snapshotFields: Record<string,string|null> = {}
      if (isTradie) {
        snapshotFields.tradie_business_name_snapshot = job.tradie?.business_name || null
        snapshotFields.tradie_licence_number_snapshot = job.tradie?.licence_number || null
      } else {
        snapshotFields.client_full_name_snapshot = job.client?.full_name || null
      }
      if (Object.keys(snapshotFields).length > 0) {
        supabase.from('scope_agreements').update(snapshotFields).eq('id', scope.id).then(() => {})
      }
      await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user?.id, body: signerName + ' has signed the scope agreement.' })
      await fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'scope_signed', job_id: job.id, signed_by: isTradie ? 'tradie' : 'client' }) }).catch(console.error)
      if (updated.client_signed_at && updated.tradie_signed_at) {
        await supabase.from('jobs').update({ status:'delivery' }).eq('id', job.id)
        // File signed scope to both vaults
        try {
          const scopeNotes = [
            'Signed by both parties on ' + new Date().toLocaleDateString('en-AU'),
            scope.inclusions ? 'Inclusions: ' + scope.inclusions.slice(0, 200) : null,
            scope.exclusions ? 'Exclusions: ' + scope.exclusions.slice(0, 200) : null,
            scope.total_price ? 'Total agreed price: $' + Number(scope.total_price).toLocaleString() : null,
            scope.warranty_days ? 'Warranty period: ' + scope.warranty_days + ' days' : null,
          ].filter(Boolean).join(' | ')
          const scopeDoc = {
            job_id: job.id,
            job_title: job.title,
            title: job.title + ' — signed scope agreement',
            document_type: 'scope',
            tradie_name: job.tradie?.business_name || null,
            issued_date: new Date().toISOString().split('T')[0],
            notes: scopeNotes,
          }
          if (job.client_id) await supabase.from('vault_documents').insert({ ...scopeDoc, user_id: job.client_id })
          const acceptedTradieId = await getAcceptedTradie(supabase, job.id)
          if (acceptedTradieId) await supabase.from('vault_documents').insert({ ...scopeDoc, user_id: acceptedTradieId })
        } catch { /* non-critical */ }
        setTimeout(() => { window.location.href = isTradie ? '/tradie/jobs/' + job.id : '/delivery?job_id=' + job.id }, 1000)
      }
    } catch (err: any) {
      setSaveError('Signing failed — ' + (err.message || 'please try again'))
    }
    setSigning(false)
  }

  const acceptQuote = async (quote: any) => {
    if (!job) return
    setAcceptingQuote(true)
    const supabase = createClient()
    await supabase.from('quote_requests').update({ qr_status: 'accepted' }).eq('job_id', job.id).eq('tradie_id', quote.tradie_id)
    await supabase.from('quote_requests').update({ qr_status: 'declined' }).eq('job_id', job.id).neq('tradie_id', quote.tradie_id)
    await supabase.from('jobs').update({ status:'agreement' }).eq('id', job.id)
    await supabase.from('quote_requests').update({ status:'accepted' }).eq('job_id', job.id).eq('tradie_id', quote.tradie_id)
    await supabase.from('quote_requests').update({ status:'declined' }).eq('job_id', job.id).neq('tradie_id', quote.tradie_id)
    setJob({ ...job, status:'agreement' })
    setCurrentQuote(quote)
    setAcceptingQuote(false)
    // Tradie drafts the scope — notify them via email
    await fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'scope_ready', job_id: job.id }) }).catch(console.error)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !job || !user) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user.id, body: newMessage.trim() })
    setNewMessage('')
    setSending(false)
  }

  const uploadDocument = async (file: File) => {
    if (!job || !user) return
    setUploadingDoc(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_id', job.id)
    formData.append('user_id', user.id)
    const res = await fetch('/api/upload', { method:'POST', body: formData })
    const data = await res.json()
    if (data.uploaded) setUploadedDoc({ name: data.name, path: data.path })
    setUploadingDoc(false)
  }

  // ── Derived state ────────────────────────────────────────────────────────
  const isPastAgreement = job ? ['delivery','signoff','warranty','complete'].includes(job.status) : false
  const multipleQuotes  = allQuotes.length > 1 || quoteRequests.length > 1
  const hasAcceptedQuote = quoteRequests.some((qr:any) => qr.status === 'accepted')
  const jobRef  = job ? 'SH-' + job.id.slice(0,8).toUpperCase() : ''
  const today   = new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })
  const mySignedAt    = scope?.[isTradie ? 'tradie_signed_at' : 'client_signed_at']
  const otherSignedAt = scope?.[isTradie ? 'client_signed_at' : 'tradie_signed_at']

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={isTradie} />
      <StageRail currentPath="/agreement" jobStatus={job?.status} role={isTradie ? 'tradie' : 'client'} />
      {allJobs.length > 1 && (
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'16px 24px 0' }}>
          <JobSelector jobs={allJobs} selectedJobId={job?.id} onSelect={async (id) => {
            const found = allJobs.find((j:any) => j.id === id)
            if (found) {
              setJob(found); setScope(null); setCurrentQuote(null); setAllQuotes([]); setQuoteRequests([]); setMessages([])
              const supabase = createClient()
              await loadJobData(supabase, id)
            }
          }} />
        </div>
      )}
    </div>
  )

  if (loading) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div></>
  )

  // ── No job found ─────────────────────────────────────────────────────────
  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 110px)', background:'#C8D5D2', padding:'24px' }}>
      <div style={{ maxWidth:'480px', width:'100%', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'16px', overflow:'hidden' }}>
        <div style={{ background:'#0A0A0A', padding:'20px 24px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 4px' }}>SCOPE AGREEMENT</p>
          <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:0 }}>
            {isTradie ? 'No active job found' : 'Write your intent scope or wait for your tradie'}
          </p>
        </div>
        <div style={{ padding:'24px' }}>
          {isTradie ? (
            <>
              <p style={{ fontSize:'14px', color:'#0A0A0A', fontWeight:500, margin:'0 0 8px' }}>No job at agreement stage</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 20px' }}>
                You do not currently have a job that has reached the scope agreement stage. Check your dashboard for active jobs, or wait for a client to progress a quote to scope agreement.
              </p>
              <div style={{ display:'flex', gap:'10px' }}>
                <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'white', background:'#0A0A0A', padding:'10px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>← Back to dashboard</a>
                <a href="/messages" style={{ fontSize:'13px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', padding:'10px 18px', borderRadius:'8px', textDecoration:'none' }}>Messages</a>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize:'14px', color:'#0A0A0A', fontWeight:500, margin:'0 0 8px' }}>Your tradie is drafting the scope agreement</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 16px' }}>
                Once you progressed to this stage, your tradie was notified to prepare the scope agreement. You will be notified by email when it is ready to review.
              </p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 20px' }}>
                If you have not heard back within 2 business days, message your tradie directly.
              </p>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const }}>
                <a href="/messages" style={{ fontSize:'13px', color:'white', background:'#0A0A0A', padding:'10px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>Message your tradie →</a>
                <a href="/compare" style={{ fontSize:'13px', color:'#4A5E64', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.15)', padding:'10px 18px', borderRadius:'8px', textDecoration:'none' }}>← Back to quote</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div></>
  )

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <div style={{ maxWidth: isPastAgreement ? '860px' : '1200px', margin:'0 auto', padding:'32px 24px', display: isPastAgreement ? 'block' : 'grid', gridTemplateColumns:'260px 1fr', gap:'24px', alignItems:'start' }} className={isPastAgreement ? '' : 'agreement-2col'}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px', position:'sticky' as const, top:'130px' }}>

          {/* Document meta */}
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#0A0A0A' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'rgba(216,228,225,0.4)', letterSpacing:'1px', marginBottom:'2px' }}>DOCUMENT</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>{jobRef}</p>
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
                  <span style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginTop:'1px' }}>{item.value}</span>
                </div>
              ))}
              {saving && <p style={{ fontSize:'12px', color:'#4A5E64', marginTop:'8px' }}>Saving...</p>}
              {savedAt && !saving && !saveError && <p style={{ fontSize:'11px', color:'#2E7D60', marginTop:'8px' }}>✓ Saved {savedAt}</p>}
              {stripeRequired && isTradie && (
                <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.25)', borderRadius:'10px', padding:'16px 20px', marginBottom:'16px' }}>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#D4522A', margin:'0 0 6px' }}>⚠ Bank account required before signing</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', margin:'0 0 12px', lineHeight:1.6 }}>Connect your bank account via Stripe before signing this scope. This is how you'll receive payment at job signoff.</p>
                  <button type="button" onClick={async () => {
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    const returnUrl = window.location.origin + '/agreement?job_id=' + job?.id + '&stripe=connected'
                    const res = await fetch('/api/stripe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'create_connect_account', tradie_id: session?.user.id, email: session?.user.email, return_url: returnUrl }) })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  }} style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px 20px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>
                    Connect bank account →
                  </button>
                </div>
              )}
              {saveError && <p style={{ fontSize:'11px', color:'#D4522A', marginTop:'8px' }}>⚠ {saveError}</p>}
            </div>
          </div>

          {/* Signing status */}
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>SIGNING STATUS</p>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              {[
                { label: job.client?.full_name || 'Client', signed: scope?.client_signed_at },
                { label: job.tradie?.business_name || 'Tradie', signed: scope?.tradie_signed_at },
              ].map((party, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: party.signed ? '#2E7D60' : 'rgba(28,43,50,0.08)', border:'1.5px solid ' + (party.signed ? '#2E7D60' : 'rgba(28,43,50,0.15)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', flexShrink:0 }}>
                    {party.signed ? '✓' : ''}
                  </div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{party.label}</p>
                    <p style={{ fontSize:'10px', color: party.signed ? '#2E7D60' : '#9AA5AA', margin:0 }}>{party.signed ? 'Signed ' + new Date(party.signed).toLocaleDateString('en-AU') : 'Not yet signed'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your turn to sign prompt */}
          {scope && !mySignedAt && otherSignedAt && (
            <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'14px 16px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#2E7D60', margin:'0 0 4px' }}>✍️ Your turn to sign</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>The other party has signed. Review the scope and add your signature to proceed.</p>
            </div>
          )}

          {/* Messages link */}
          <a href="/messages" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'13px 16px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', textDecoration:'none' }}>
            <span style={{ fontSize:'18px' }}>💬</span>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>Job messages</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Continue the conversation →</p>
            </div>
          </a>
        </div>

        {/* ── MAIN DOCUMENT AREA ── */}
        <div>
          {/* Past agreement banner */}
          {isPastAgreement && (
            <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#6B4FA8', marginBottom:'6px' }}>This job has moved to the <strong>{job.status}</strong> stage</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px', lineHeight:'1.6' }}>The scope agreement below is read-only. Both parties signed on {scope?.client_signed_at ? new Date(scope.client_signed_at).toLocaleDateString('en-AU') : '—'}.</p>
              <a href={job.status === 'delivery' ? '/delivery' : job.status === 'signoff' ? '/signoff' : '/warranty'}>
                <button type="button" style={{ background:'#6B4FA8', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>Go to current stage →</button>
              </a>
            </div>
          )}

          {/* Client: quote selection if multiple and none accepted */}
          {!isTradie && multipleQuotes && allQuotes.length > 0 && !hasAcceptedQuote && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(46,106,143,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 2px' }}>SELECT A QUOTE TO PROCEED</p>
                <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{allQuotes.length} quotes received — accept one to begin the scope agreement</p>
              </div>
              <div style={{ padding:'16px', display:'grid', gridTemplateColumns: allQuotes.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(260px,1fr))', gap:'10px' }}>
                {allQuotes.map((q:any) => {
                  const isLowest = Number(q.total_price) === Math.min(...allQuotes.map((x:any) => Number(x.total_price)))
                  return (
                    <div key={q.id} style={{ border:'1.5px solid ' + (isLowest ? '#2E6A8F' : 'rgba(28,43,50,0.12)'), borderRadius:'10px', padding:'14px', background:'#C8D5D2', position:'relative' as const }}>
                      {isLowest && <div style={{ position:'absolute', top:'-9px', left:'12px', background:'#2E6A8F', color:'white', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'100px' }}>LOWEST</div>}
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', marginBottom:'4px' }}>{q.tradie?.business_name}</p>
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#0A0A0A', marginBottom:'6px' }}>${Number(q.total_price).toLocaleString()}</p>
                      {q.estimated_days && <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'6px' }}>{q.estimated_days} days</p>}
                      {q.breakdown?.map((b:any, bi:number) => (
                        <div key={bi} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#4A5E64', padding:'2px 0' }}>
                          <span>{b.label}</span><span>${Number(b.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <button type="button" onClick={() => acceptQuote(q)} disabled={acceptingQuote}
                        style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'9px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', marginTop:'10px', opacity: acceptingQuote ? 0.7 : 1 }}>
                        {acceptingQuote ? 'Processing...' : 'Proceed to scope agreement →'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* THE SCOPE DOCUMENT */}
          <div id="scope-document" style={{ background:'white', borderRadius:'16px', boxShadow:'0 4px 40px rgba(28,43,50,0.12)', overflow:'hidden', marginBottom:'20px' }}>

            {/* Document header */}
            <div style={{ background:'#0A0A0A', padding:'28px 36px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 90% 0%, rgba(212,82,42,0.2), transparent 55%)' }} />
              <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' as const }}>
                <div>
                  <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.4)', letterSpacing:'2px', marginBottom:'6px' }}>STEADYHAND</div>
                  <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>SCOPE AGREEMENT</h1>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Request to warranty · Western Australia</p>
                </div>
                <div style={{ textAlign:'right' as const }}>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', letterSpacing:'0.5px', marginBottom:'3px' }}>DOCUMENT REF</p>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'rgba(216,228,225,0.7)', letterSpacing:'1px', margin:'0 0 6px' }}>{jobRef}</p>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:'0 0 8px' }}>{today}</p>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.08)', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'100px', padding:'3px 10px' }}>
                    <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: scope?.client_signed_at && scope?.tradie_signed_at ? '#2E7D60' : '#C07830' }} />
                    <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.55)', letterSpacing:'0.5px' }}>
                      {scope?.client_signed_at && scope?.tradie_signed_at ? 'FULLY EXECUTED' : scope?.client_signed_at || scope?.tradie_signed_at ? 'PARTIALLY SIGNED' : 'DRAFT'}
                    </span>
                  </div>
                  {scope?.client_signed_at && scope?.tradie_signed_at && !isPastAgreement && (
                    <a href="/delivery" style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#2E7D60', color:'white', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, textDecoration:'none', marginLeft:'10px' }}>
                      Proceed to delivery →
                    </a>
                  )}
                  {scope?.client_signed_at && scope?.tradie_signed_at && !isPastAgreement && (
                    <a href="/delivery" style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#2E7D60', color:'white', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, textDecoration:'none', marginLeft:'10px' }}>
                      Proceed to delivery →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid #F0F0F0' }}>
              <div style={{ padding:'24px 32px', borderRight:'1px solid #F0F0F0' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'10px', fontWeight:600 }}>Client</p>
                <p style={{ fontSize:'16px', fontWeight:600, color:'#0A0A0A', marginBottom:'3px' }}>{job.client?.full_name}</p>
                <p style={{ fontSize:'13px', color:'#7A9098', margin:'2px 0' }}>{job.client?.suburb || job.suburb}</p>
                <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>{job.client?.email}</p>
              </div>
              <div style={{ padding:'24px 32px' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'10px', fontWeight:600 }}>Tradie</p>
                {job.tradie ? (
                  <>
                    <p style={{ fontSize:'16px', fontWeight:600, color:'#0A0A0A', marginBottom:'3px' }}>{job.tradie.business_name}</p>
                    {job.tradie.profile?.full_name && <p style={{ fontSize:'13px', color:'#7A9098', margin:'2px 0' }}>{job.tradie.profile.full_name}</p>}
                    {job.tradie.abn && <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>ABN {job.tradie.abn}</p>}
                  </>
                ) : (
                  <p style={{ fontSize:'13px', color:'#C07830', fontStyle:'italic' }}>Awaiting tradie selection</p>
                )}
              </div>
            </div>

            {/* Job summary */}
            <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0', background:'#FAFBFB' }}>
              <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'12px', fontWeight:600 }}>Job description</p>
              <p style={{ fontSize:'17px', fontWeight:600, color:'#0A0A0A', marginBottom:'6px' }}>{job.title}</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.65', marginBottom:'10px' }}>{job.description}</p>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const, alignItems:'center' }}>
                {[job.trade_category, job.suburb, job.property_type].filter(Boolean).map((tag:string) => (
                  <span key={tag} style={{ fontSize:'12px', color:'#7A9098', background:'#F0F4F3', padding:'4px 10px', borderRadius:'6px' }}>{tag}</span>
                ))}
                {currentQuote && <span style={{ fontSize:'12px', color:'#0A0A0A', background:'#F0F4F3', padding:'4px 10px', borderRadius:'6px', fontWeight:600 }}>Quoted: ${Number(currentQuote.total_price).toLocaleString()}</span>}
                {isPastAgreement && xeroConnected && currentQuote && (
                  <button type="button" onClick={async () => {
                    setXeroSyncing(true); setXeroError(null)
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    const res = await fetch('/api/xero/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: session?.user.id, job_id: job.id }) })
                    const data = await res.json()
                    if (data.success) setXeroSynced(true); else setXeroError(data.error || 'Sync failed')
                    setXeroSyncing(false)
                  }} disabled={xeroSyncing || xeroSynced}
                    style={{ fontSize:'12px', color:'white', background: xeroSynced ? '#2E7D60' : '#13B875', border:'none', borderRadius:'6px', padding:'6px 14px', cursor:'pointer', fontWeight:500 }}>
                    {xeroSynced ? '✓ Pushed to Xero' : xeroSyncing ? 'Syncing...' : 'Push to Xero →'}
                  </button>
                )}
                {xeroError && <p style={{ fontSize:'12px', color:'#D4522A', margin:0 }}>{xeroError}</p>}
              </div>
            </div>

            {/* Quote price — client sees full breakdown, tradie sees compact summary */}
            {currentQuote && !isTradie && (
              <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'16px', fontWeight:600 }}>Agreed price</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:'12px', marginBottom:'16px' }}>
                  <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'40px', color:'#0A0A0A', letterSpacing:'1px' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                  <span style={{ fontSize:'14px', color:'#7A9098' }}>AUD inc. GST</span>
                </div>
                {currentQuote.breakdown?.length > 0 && (
                  <div style={{ background:'#F8FAFA', borderRadius:'8px', overflow:'hidden' }}>
                    <div style={{ padding:'10px 14px', background:'#F0F4F3', borderBottom:'1px solid #E8EEEC' }}>
                      <p style={{ fontSize:'11px', fontWeight:600, color:'#4A5E64', letterSpacing:'0.5px', margin:0 }}>PRICE BREAKDOWN</p>
                    </div>
                    {currentQuote.breakdown.map((b:any, i:number) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid #F0F0F0' }}>
                        <span style={{ fontSize:'13px', color:'#0A0A0A' }}>{b.label}</span>
                        <span style={{ fontSize:'13px', fontWeight:600 }}>${Number(b.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background:'#F0F4F3' }}>
                      <span style={{ fontSize:'13px', fontWeight:600 }}>Total</span>
                      <span style={{ fontSize:'15px', fontWeight:700 }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {currentQuote && isTradie && (
              <div style={{ padding:'16px 32px', borderBottom:'1px solid #F0F0F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 2px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Quote selected for scope</p>
                  <p style={{ fontSize:'18px', fontWeight:700, color:'#0A0A0A', margin:0 }}>${Number(currentQuote.total_price).toLocaleString()} AUD inc. GST</p>
                </div>
                <span style={{ fontSize:'11px', color:'#2E7D60', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'100px', padding:'3px 10px', fontWeight:500 }}>✓ Accepted</span>
              </div>
            )}

            {/* Recent edit notice */}
            {scope?.last_edited_at && (!scope.client_signed_at || !scope.tradie_signed_at) && (
              <div style={{ padding:'12px 18px', background:'rgba(107,79,168,0.06)', borderBottom:'1px solid rgba(107,79,168,0.1)' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#6B4FA8', margin:'0 0 2px' }}>Scope was recently updated</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Last edited {new Date(scope.last_edited_at).toLocaleDateString('en-AU')}. Both parties need to re-sign before work can begin.</p>
              </div>
            )}

            {/* External document upload */}
            <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0', background:'#FAFBFB' }}>
              <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'6px', fontWeight:600 }}>Working in your own system?</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'14px' }}>Upload a signed document from Xero, your CRM or another tool. Steadyhand will store it against this job and warranty tracking will continue from the signing date.</p>
              {uploadedDoc ? (
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px' }}>
                  <span style={{ fontSize:'20px' }}>📄</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{uploadedDoc.name}</p>
                    <p style={{ fontSize:'11px', color:'#2E7D60', margin:0 }}>✓ Stored against this job</p>
                  </div>
                </div>
              ) : (
                <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'16px', border:'2px dashed rgba(28,43,50,0.15)', borderRadius:'10px', cursor:'pointer', background:'white' }}>
                  <span style={{ fontSize:'20px' }}>📎</span>
                  <div style={{ textAlign:'center' as const }}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{uploadingDoc ? 'Uploading...' : 'Upload signed agreement or quote'}</p>
                    <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>PDF, Word or image · Max 10MB</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])} style={{ display:'none' }} disabled={uploadingDoc} />
                </label>
              )}
            </div>

            {/* No scope yet */}
            {!scope && (
              <div style={{ padding:'32px', textAlign:'center' as const, borderBottom:'1px solid #F0F0F0' }}>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>No scope drafted yet. Steadyhand will generate a scope from your job details and quote.</p>
                {draftError && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'10px' }}>⚠ {draftError}</p>}
                {isTradie ? (
                  <>
                    <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px', textAlign:'left' as const }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#D4522A', margin:'0 0 4px' }}>Your client is waiting for the scope agreement</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>Draft the scope below. This defines what is included, the payment milestones and warranty terms. Your client will be notified to review and sign once you submit.</p>
                    </div>
                    {!siteBrief && (
                      <button type="button" onClick={loadSiteBrief} disabled={briefLoading}
                        style={{ background:'rgba(107,79,168,0.08)', color:'#6B4FA8', border:'1px solid rgba(107,79,168,0.2)', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, cursor:'pointer', marginBottom:'12px', opacity: briefLoading ? 0.7 : 1 }}>
                        {briefLoading ? '⏳ Compiling brief...' : '✦ Generate site brief from job history'}
                      </button>
                    )}
                    {siteBrief && (
                      <div style={{ background:'rgba(107,79,168,0.04)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'10px', padding:'16px 18px', marginBottom:'16px', textAlign:'left' as const }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                          <p style={{ fontSize:'12px', fontWeight:600, color:'#6B4FA8', margin:0, textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>✦ Site brief — compiled from job history</p>
                          <button type="button" onClick={() => setSiteBrief(null)} style={{ background:'none', border:'none', color:'#9AA5AA', cursor:'pointer', fontSize:'14px' }}>×</button>
                        </div>
                        <div style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', whiteSpace:'pre-wrap' as const }}>{siteBrief}</div>
                      </div>
                    )}
                    <button type="button" onClick={() => draftScope()} disabled={drafting}
                      style={{ background:'#6B4FA8', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: drafting ? 0.7 : 1 }}>
                      {drafting ? 'Drafting...' : 'Draft scope with Steadyhand →'}
                    </button>
                  </>
                ) : (
                  <div>
                    {!intentSent ? (
                      <div style={{ background:'rgba(107,79,168,0.04)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'12px', padding:'20px 24px', marginBottom:'16px', textAlign:'left' as const }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                          <div>
                            <p style={{ fontSize:'14px', fontWeight:600, color:'#6B4FA8', margin:'0 0 2px' }}>Write your intent scope</p>
                            <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Tell the tradie what you want in plain language — they will turn this into a technical scope agreement.</p>
                          </div>
                          <button type="button" onClick={draftClientIntent} disabled={intentDrafting}
                            style={{ background:'rgba(107,79,168,0.1)', color:'#6B4FA8', border:'1px solid rgba(107,79,168,0.25)', borderRadius:'7px', padding:'6px 12px', fontSize:'12px', fontWeight:500, cursor:'pointer', flexShrink:0, opacity: intentDrafting ? 0.7 : 1 }}>
                            {intentDrafting ? 'Drafting...' : '✦ AI draft'}
                          </button>
                        </div>
                        {[
                          { key:'goal', label:'What do you want achieved?', placeholder:'e.g. I want the hot water system replaced with a new gas unit of similar capacity, installed in the same location.' },
                          { key:'concern', label:'What are you worried about?', placeholder:'e.g. I am worried about hidden pipe damage behind the wall, and whether the warranty covers parts and labour.' },
                          { key:'success', label:'What does success look like?', placeholder:'e.g. I will consider it done when the new system is working, the area is clean, and I have the warranty paperwork.' },
                          { key:'access', label:'Site access and practical notes', placeholder:'e.g. Access via side gate, code is 1234. Available Mon–Fri after 9am. Parking on street.' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom:'12px' }}>
                            <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#4A5E64', marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.4px' }}>{label}</label>
                            <textarea value={(intentForm as any)[key]} onChange={e => setIntentForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={placeholder} rows={2}
                              style={{ width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
                          </div>
                        ))}
                        <button type="button" onClick={sendClientIntent}
                          disabled={!intentForm.goal.trim()}
                          style={{ background:'#6B4FA8', color:'white', padding:'11px 24px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !intentForm.goal.trim() ? 0.5 : 1 }}>
                          Send to tradie →
                        </button>
                      </div>
                    ) : (
                      <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'12px' }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60', margin:'0 0 4px' }}>✓ Intent scope sent to your tradie</p>
                        <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>You will be notified by email when the scope agreement is ready to review and sign.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Scope content */}
            {scope && (
              <>
                {/* Quote reference panel */}
                {currentQuote?.breakdown?.length > 0 && (
                  <div style={{ padding:'16px 32px', borderBottom:'1px solid #F0F0F0', background:'rgba(46,106,143,0.03)' }}>
                    <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#2E6A8F', letterSpacing:'0.5px', margin:'0 0 10px' }}>ACCEPTED QUOTE — SCOPE BASIS</p>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px', marginBottom:'10px' }}>
                      {currentQuote.breakdown.map((b:any, i:number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                          <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0 }}>{b.label}{b.category ? <span style={{ fontSize:'11px', color:'#7A9098', marginLeft:'6px' }}>[{b.category}]</span> : null}</p>
                          <p style={{ fontSize:'13px', fontWeight:600, color:'#2E6A8F', margin:0, flexShrink:0 }}>${Number(b.amount).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop:'1px solid rgba(46,106,143,0.15)', paddingTop:'8px', display:'flex', justifyContent:'space-between' }}>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Quote total</p>
                      <p style={{ fontSize:'14px', fontWeight:700, color:'#2E6A8F', margin:0 }}>${Number(currentQuote.total_price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Inclusions */}
                {scope.inclusions?.length > 0 && (
                  <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0' }}>
                    <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'14px', fontWeight:600 }}>Inclusions</p>
                    {scope.inclusions.map((item:string, i:number) => (
                      <div key={i} style={{ display:'flex', gap:'12px', padding:'6px 0', borderBottom:'1px solid #F8F8F8', alignItems:'center' }}>
                        <span style={{ color:'#2E7D60', fontSize:'14px', flexShrink:0 }}>✓</span>
                        <input type="text" defaultValue={item}
                          onBlur={e => { const u = [...scope.inclusions]; u[i] = e.target.value; saveEdit({ inclusions: u }) }}
                          style={{ flex:1, border:'none', background:'transparent', fontSize:'14px', color:'#0A0A0A', outline:'none', padding:'3px 6px', borderRadius:'4px', cursor:'text', fontFamily:'sans-serif' }}
                          onFocus={e => { e.target.style.background = '#F4F8F7'; e.target.style.outline = '1px solid #C8D5D2' }}
                          onBlurCapture={e => { e.target.style.background = 'transparent'; e.target.style.outline = 'none' }} />
                        <button type="button" onClick={() => saveEdit({ inclusions: scope.inclusions.filter((_:string, idx:number) => idx !== i) })}
                          style={{ background:'none', border:'none', color:'#CCC', cursor:'pointer', fontSize:'16px', flexShrink:0, padding:'0 4px' }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => saveEdit({ inclusions: [...scope.inclusions, 'New inclusion'] })}
                      style={{ marginTop:'10px', fontSize:'12px', color:'#2E7D60', background:'none', border:'1px dashed rgba(46,125,96,0.3)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                      + Add inclusion
                    </button>
                  </div>
                )}

                {/* Exclusions */}
                {scope.exclusions?.length > 0 && (
                  <div style={{ padding:'24px 32px', borderBottom:'1px solid #F0F0F0' }}>
                    <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'14px', fontWeight:600 }}>Exclusions</p>
                    {scope.exclusions.map((item:string, i:number) => (
                      <div key={i} style={{ display:'flex', gap:'12px', padding:'6px 0', borderBottom:'1px solid #F8F8F8', alignItems:'center' }}>
                        <span style={{ color:'#D4522A', fontSize:'14px', flexShrink:0 }}>×</span>
                        <input type="text" defaultValue={item}
                          onBlur={e => { const u = [...scope.exclusions]; u[i] = e.target.value; saveEdit({ exclusions: u }) }}
                          style={{ flex:1, border:'none', background:'transparent', fontSize:'14px', color:'#0A0A0A', outline:'none', padding:'3px 6px', borderRadius:'4px', cursor:'text', fontFamily:'sans-serif' }}
                          onFocus={e => { e.target.style.background = '#F4F8F7' }}
                          onBlurCapture={e => { e.target.style.background = 'transparent' }} />
                        <button type="button" onClick={() => saveEdit({ exclusions: scope.exclusions.filter((_:string, idx:number) => idx !== i) })}
                          style={{ background:'none', border:'none', color:'#CCC', cursor:'pointer', fontSize:'16px', flexShrink:0, padding:'0 4px' }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => saveEdit({ exclusions: [...scope.exclusions, 'New exclusion'] })}
                      style={{ marginTop:'10px', fontSize:'12px', color:'#D4522A', background:'none', border:'1px dashed rgba(212,82,42,0.3)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                      + Add exclusion
                    </button>
                  </div>
                )}

                <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px' }}>

                </div>
                <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#2E7D60', margin:0 }}>A <strong>deposit + completion</strong> structure is set by default — adjust the amounts and labels to match the job. Clients pay each milestone as work is approved.</p>
                </div>
                <MilestoneEditor scope={scope} currentQuote={currentQuote} onSave={(milestones:any) => saveEdit({ milestones })} />

                {/* Warranty terms */}
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
                        <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ padding:'32px', background:'#FAFBFB' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'20px', fontWeight:600 }}>Signatures</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
                    {[
                      { label:'Client', name: job.client?.full_name, signed: scope.client_signed_at },
                      { label:'Tradie', name: job.tradie?.business_name || job.tradie?.profile?.full_name, signed: scope.tradie_signed_at },
                    ].map(party => (
                      <div key={party.label} style={{ border:'1px solid ' + (party.signed ? '#2E7D60' : '#E0E8E6'), borderRadius:'10px', overflow:'hidden' }}>
                        <div style={{ padding:'12px 16px', background: party.signed ? 'rgba(46,125,96,0.06)' : '#F8FAFA', borderBottom:'1px solid ' + (party.signed ? 'rgba(46,125,96,0.15)' : '#EEF0F0') }}>
                          <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'2px' }}>{party.label.toUpperCase()}</p>
                          <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{party.name || 'Not assigned'}</p>
                        </div>
                        <div style={{ padding:'16px', minHeight:'60px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {party.signed ? (
                            <div style={{ textAlign:'center' as const }}>
                              <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:'0 0 2px' }}>✓ Signed</p>
                              <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{new Date(party.signed).toLocaleDateString('en-AU')} at {new Date(party.signed).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}</p>
                            </div>
                          ) : (
                            <p style={{ fontSize:'12px', color:'#BBBEC0', fontStyle:'italic', margin:0 }}>Awaiting signature</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pre-signing dialogue */}
                  {!mySignedAt && job && user && (
                    <DialogueGuide
                      jobId={job.id}
                      userRole={isTradie ? 'tradie' : 'client'}
                      userId={user.id}
                    />
                  )}

                  {!mySignedAt && (
                    <>
                      {otherSignedAt && (
                        <div style={{ background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ fontSize:'16px' }}>✍️</span>
                          <p style={{ fontSize:'13px', color:'#2E6A8F', margin:0, fontWeight:500 }}>
                            {isTradie ? (job.client?.full_name || 'The client') : (job.tradie?.business_name || 'The tradie')} has signed. Your signature is needed to proceed.
                          </p>
                        </div>
                      )}
                      <button type="button" onClick={signScope} disabled={signing}
                        style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'15px', borderRadius:'10px', fontSize:'15px', fontWeight:600, border:'none', cursor:'pointer', letterSpacing:'0.3px', marginBottom:'10px', opacity: signing ? 0.7 : 1 }}>
                        {signing ? 'Signing...' : 'Sign as ' + (isTradie ? job.tradie?.business_name : job.client?.full_name) + ' →'}
                      </button>
                    </>
                  )}

                  {/* PDF download */}
                  {job && (
                    <a href={`/api/pdf/generate/scope?job_id=${job.id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:'block', textAlign:'center' as const, fontSize:'12px', color:'#7A9098', textDecoration:'none', padding:'8px', marginBottom:'8px' }}>
                      ↓ Download scope agreement PDF
                    </a>
                  )}

                  {draftError && <p style={{ fontSize:'12px', color:'#D4522A', margin:'0 0 8px' }}>⚠ {draftError}</p>}
                  {isTradie && (
                    <button type="button" onClick={() => draftScope()} disabled={drafting}
                      style={{ width:'100%', background:'transparent', color:'#6B4FA8', padding:'12px', borderRadius:'10px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(107,79,168,0.25)', cursor:'pointer', opacity: drafting ? 0.7 : 1 }}>
                      {drafting ? 'Redrafting...' : '↻ Redraft scope with Steadyhand'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
      <StageGuideModal
        storageKey="seen_agreement_guide"
        stageNumber={5}
        stageColor="#534AB7"
        stageLabel="Contract"
        headline={isTradie ? "Draft the scope — this is your professional record" : "Review the scope before you sign"}
        intro={isTradie ? "The scope agreement defines exactly what work is included, the payment milestones and the warranty period. Draft it carefully — it protects you as much as the client." : "The scope agreement is the legal foundation of the job. Read every section before signing — it defines what is included, how you will pay and what warranty applies."}
        checklist={isTradie ? [
          { text: 'Make sure the scope matches exactly what was discussed in the consult', emphasis: true },
          { text: 'Set realistic milestone amounts — front-loading payments creates client resistance', emphasis: false },
          { text: 'Include exclusions clearly — this prevents scope creep later', emphasis: false },
          { text: 'Once both parties sign, variations require a formal change order', emphasis: false },
        ] : [
          { text: 'Check that the scope reflects what was discussed at the consult', emphasis: true },
          { text: 'Review the milestone amounts — you pay as each stage is approved', emphasis: false },
          { text: 'Confirm the warranty period and what it covers', emphasis: false },
          { text: 'Once signed, any changes go through the variations process', emphasis: false },
        ]}
        warning={isTradie ? "A scope that is vague or misaligned with the consult record is the most common source of disputes. Be specific." : "Do not sign until you are comfortable with every section. You can request edits before signing."}
        ctaLabel={isTradie ? "Draft scope" : "Review scope"}
      />
    </>
  )
}
