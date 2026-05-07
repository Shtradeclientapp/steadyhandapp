'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'
import { StageRail, WaitingPanel } from '@/components/ui'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { OnboardingModal } from '@/components/ui/OnboardingModal'
import { JobSelector } from '@/components/ui/JobSelector'


const CLIENT_PROMPTS = [
  { key: 'client_what_discussed', label: 'What work was discussed?', placeholder: 'Describe what the tradie came to look at and what you talked through together...' },
  { key: 'client_site_conditions', label: 'What site conditions or access issues were noted?', placeholder: 'e.g. Limited roof access, asbestos suspected, existing damage noted...' },
  { key: 'client_tradie_advice', label: "What was the tradie's initial advice or reaction?", placeholder: 'e.g. They recommended replacing rather than repairing, suggested a different approach...' },
  { key: 'client_unresolved', label: 'What was left unresolved or unclear?', placeholder: 'e.g. They needed to check pricing on materials, unsure about council approval requirements...' },
  { key: 'client_expectations', label: 'What do you expect the quote to cover?', placeholder: 'e.g. Full replacement of all tiles including waterproofing, disposal of old materials, supply of grout...' },
]

const TRADIE_PROMPTS = [
  { key: 'tradie_observations', label: 'What did you observe on site?', placeholder: 'Describe the condition of the site, existing work, materials, access...' },
  { key: 'tradie_scope_considerations', label: 'What are the key scope considerations?', placeholder: 'e.g. Waterproofing will need to be redone, existing substrate needs preparation...' },
  { key: 'tradie_complications', label: 'Any complications or variations from the initial brief?', placeholder: 'e.g. The scope is larger than described, additional work required before starting...' },
  { key: 'tradie_quote_assumptions', label: 'What assumptions is your quote based on?', placeholder: 'e.g. Client supplies tiles, access available Monday-Friday, no asbestos present...' },
]

export default function AssessPage() {
  const [job, setJob] = useState<any>(null)
  const [noJobId, setNoJobId] = useState(false)
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [urlTradieName, setUrlTradieName] = useState<string|null>(null)
  const [urlTradieProfile, setUrlTradieProfile] = useState<any>(null)
  const [urlTradieId, setUrlTradieId] = useState<string|null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isTradie, setIsTradie] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [showWaitModal, setShowWaitModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [form, setForm] = useState<any>({})
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [photoError, setPhotoError] = useState<string|null>(null)
  const [clientPhotos, setClientPhotos] = useState<string[]>([])
  const [tradiePhotos, setTradiePhotos] = useState<string[]>([])
  const [consultDate, setConsultDate] = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [preVisitGuidance, setPreVisitGuidance] = useState<string|null>(null)
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'mine'|'theirs'>('mine')
  const supabase = useSupabase()


  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase.from('profiles').select('id, full_name, email, role, tradie:tradie_profiles!tradie_profiles_id_fkey(business_name, id)').eq('id', session.user.id).single()
      setProfile(prof)
      const tradie = prof?.role === 'tradie'
      setIsTradie(tradie)

      // Double-check role via tradie_profiles existence
      const tradieProf = prof?.tradie as any
      const hasTraidieProfile = !!(Array.isArray(tradieProf) ? tradieProf?.[0]?.id : tradieProf?.id)
      const resolvedTradie = tradie || hasTraidieProfile
      const col = resolvedTradie ? 'tradie_id' : 'client_id'
      if (resolvedTradie !== tradie) setIsTradie(resolvedTradie)
      const urlJobId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('job_id') : null
      let jobsQuery = supabase
        .from('jobs')
        .select('*, consult_skipped_by_client, tradie:tradie_profiles(business_name, id), client:profiles!jobs_client_id_fkey(full_name)')
        .in('status', ['assess', 'consult', 'quote', 'compare', 'agreement', 'shortlisted', 'matching', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
      if (urlJobId) {
        jobsQuery = jobsQuery.eq('id', urlJobId)
      } else {
        jobsQuery = jobsQuery.eq(col, session.user.id)
      }
      const { data: jobs } = await jobsQuery
        

      if (jobs && jobs.length > 0) {
        setAllJobs(jobs)
        if (!urlJobId && jobs.length > 1) { setNoJobId(true); return }
        const consultJob = jobs[0]
        setJob(consultJob)
        // Get tradie_id from URL if present (per-tradie consult)
        const urlTradieId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tradie_id') : null

        // For tradie users, their own tradie_id
        const effectiveTradieId = urlTradieId || (resolvedTradie ? (Array.isArray(tradieProf) ? tradieProf?.[0]?.id : tradieProf?.id) : null)

        // Fetch existing assessment for this job+tradie combo
        let assessQuery = supabase.from('site_assessments').select('*').eq('job_id', consultJob.id)
        if (effectiveTradieId) assessQuery = assessQuery.eq('tradie_id', effectiveTradieId)
        const { data: assess } = await assessQuery.maybeSingle()

        if (assess) {
          setAssessment(assess)
          setForm(assess)
          setClientPhotos(assess.client_photo_urls || [])
          setTradiePhotos(assess.tradie_photo_urls || [])
        } else {
          // Create new assessment scoped to this tradie
          const tradieIdForInsert = effectiveTradieId || null
          const { data: newAssess } = await supabase
            .from('site_assessments')
            .insert({ job_id: consultJob.id, tradie_id: tradieIdForInsert, consult_date: new Date().toISOString() })
            .select()
            .single()
          if (newAssess) { setAssessment(newAssess); setForm(newAssess) }
        }
      }
      setLoading(false)
    })
  }, [])

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const uploadPhoto = async (file: File) => {
    if (!assessment) return
    setUploadingPhotos(true)
    const ext = file.name.split('.').pop()
    const path = 'assessments/' + assessment.id + '/' + Date.now() + '.' + ext
    setPhotoError(null)
    const { error } = await supabase.storage.from('Job Photos').upload(path, file)
    if (error) { setPhotoError('Photo upload failed — please try again or check your connection.'); setUploadingPhotos(false); return }
    if (!error) {
      const { data: urlData } = supabase.storage.from('Job Photos').getPublicUrl(path)
      const url = urlData.publicUrl
      const field = isTradie ? 'tradie_photo_urls' : 'client_photo_urls'
      const current = isTradie ? tradiePhotos : clientPhotos
      const updated = [...current, url]
      await supabase.from('site_assessments').update({ [field]: updated }).eq('id', assessment.id)
      if (isTradie) setTradiePhotos(updated)
      else setClientPhotos(updated)
    }
    setUploadingPhotos(false)
  }

  const removePhoto = async (url: string) => {
    if (!assessment) return
    const field = isTradie ? 'tradie_photo_urls' : 'client_photo_urls'
    const current = isTradie ? tradiePhotos : clientPhotos
    const updated = current.filter(p => p !== url)
    await supabase.from('site_assessments').update({ [field]: updated }).eq('id', assessment.id)
    if (isTradie) setTradiePhotos(updated)
    else setClientPhotos(updated)
  }


  const saveConsultDate = async (date: string) => {
    if (!assessment || !date) return
    setSavingDate(true)
    await supabase.from('site_assessments').update({ consult_date: date, slot_confirmed_at: new Date().toISOString() }).eq('id', assessment.id)
    setAssessment((a: any) => ({ ...a, consult_date: date, slot_confirmed_at: new Date().toISOString() }))
    const { data: { session } } = await supabase.auth.getSession()
    const label = isTradie ? (profile?.tradie?.business_name || 'Tradie') : (profile?.full_name || 'Client')
    try {
      await supabase.from('job_messages').insert({
        job_id: job?.id,
        sender_id: session?.user.id,
        body: label + ' has set the consult date to ' + new Date(date).toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) + '. Use the message thread to confirm or suggest a different time.',
      })
    } catch (err) { console.error('assessment save error:', err) }
    setSavingDate(false)
  }

  const save = async () => {
    if (!assessment) return
    setSaving(true)
    await supabase.from('site_assessments').update({
      consult_date: form.consult_date,
      consult_attendees: form.consult_attendees,
      ...(isTradie ? {
        tradie_observations: form.tradie_observations,
        tradie_scope_considerations: form.tradie_scope_considerations,
        tradie_complications: form.tradie_complications,
        tradie_quote_assumptions: form.tradie_quote_assumptions,
      } : {
        client_what_discussed: form.client_what_discussed,
        client_site_conditions: form.client_site_conditions,
        client_tradie_advice: form.client_tradie_advice,
        client_unresolved: form.client_unresolved,
        client_expectations: form.client_expectations,
      }),
      updated_at: new Date().toISOString(),
    }).eq('id', assessment.id)
    setSaving(false)
  }

  const share = async () => {
    if (!job) return
    setSharing(true)
    const field = isTradie ? 'tradie_shared_at' : 'client_shared_at'
    // Upsert assessment if it doesn't exist yet
    let assessId = assessment?.id
    if (!assessId) {
      const { data: newAssess } = await supabase.from('site_assessments')
        .upsert({ job_id: job.id, [field]: new Date().toISOString() }, { onConflict: 'job_id' })
        .select().single()
      if (newAssess) { setAssessment(newAssess); assessId = newAssess.id }
    } else {
      await supabase.from('site_assessments').update({
        [field]: new Date().toISOString(),
      }).eq('id', assessId)
    }

    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: (isTradie ? profile.tradie?.business_name : profile.full_name) + ' has shared their consult notes. Please review and acknowledge before quoting begins.',
    })

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assessment_shared', job_id: job.id, shared_by: isTradie ? 'tradie' : 'client' }),
    }).catch(() => {})

    setAssessment((a: any) => ({ ...a, [field]: new Date().toISOString() }))
    // Post encouragement message
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: '📋 ' + (isTradie ? profile.tradie?.business_name : profile.full_name) + ' has shared their consult notes. Taking time to document observations before quoting begins is one of the most important trust acts in any trade relationship.',
    })
    setSharing(false)
  }

  const acknowledge = async () => {
    if (!assessment || !job) return
    setAcknowledging(true)
    const field = isTradie ? 'tradie_acknowledged_at' : 'client_acknowledged_at'
    await supabase.from('site_assessments').update({
      [field]: new Date().toISOString(),
    }).eq('id', assessment.id)

    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: (isTradie ? profile.tradie?.business_name : profile.full_name) + ' has acknowledged the consult notes. The consult stage is complete.',
    })

    setAssessment((a: any) => ({ ...a, [field]: new Date().toISOString() }))
    setAcknowledging(false)

    // Advance to compare once client has acknowledged (tradie ack is encouraged but not blocking)
    const updated = { ...assessment, [field]: new Date().toISOString() }
    const canAdvance = updated.client_acknowledged_at && (updated.tradie_acknowledged_at || updated.tradie_shared_at || isTradie)
    if (canAdvance) {
        await supabase.from('jobs').update({ status: 'compare' }).eq('id', job.id)
      await fetch('/api/notify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'consult_complete', job_id: job.id }) }).catch(console.error)

      // Auto-file consult record to both client and tradie vaults via service role API
      try {
        const docs = []
        const consultNote = {
          job_id: job.id,
          job_title: job.title,
          title: job.title + ' — consult notes',
          document_type: 'consult',
          tradie_name: job.tradie?.business_name || null,
          issued_date: new Date().toISOString().split('T')[0],
          notes: 'Consult notes acknowledged by both parties on ' + new Date().toLocaleDateString('en-AU'),
        }
        if (job.client_id) docs.push({ ...consultNote, user_id: job.client_id })
        const { data: cqr } = await supabase.from('quote_requests').select('tradie_id').eq('job_id', job.id).eq('qr_status','accepted').maybeSingle()
        if (cqr?.tradie_id) docs.push({ ...consultNote, user_id: cqr.tradie_id })
        if (docs.length > 0) {
          await fetch('/api/vault/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documents: docs }),
          })
        }
      } catch { /* non-critical */ }
      if (!isTradie) {
        setShowCompleteModal(true)
      } else {
        setTimeout(() => { window.location.href = '/tradie/dashboard' }, 1200)
      }
    } else if (!isTradie) {
      setShowWaitModal(true)
    }
  }

  const myShared = isTradie ? assessment?.tradie_shared_at : assessment?.client_shared_at
  const [internalNotes, setInternalNotes] = useState({ materials: '', labour: '', brief: '' })
  const [savingInternal, setSavingInternal] = useState(false)
  const [internalSaved, setInternalSaved] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const theirShared = isTradie ? assessment?.client_shared_at : assessment?.tradie_shared_at

  // Auto-show wait modal on page load if already shared but waiting
  useEffect(() => {
    if (myShared && !theirShared) setShowWaitModal(true)
  }, [myShared, theirShared])
  const myAcknowledged = isTradie ? assessment?.tradie_acknowledged_at : assessment?.client_acknowledged_at
  const theirAcknowledged = isTradie ? assessment?.client_acknowledged_at : assessment?.tradie_acknowledged_at
  const myPrompts = isTradie ? TRADIE_PROMPTS : CLIENT_PROMPTS
  const theirLabel = isTradie ? (job?.client?.full_name || 'the client') : (job?.tradie?.business_name || 'your tradie')

  const loadPreVisitGuidance = async () => {
    if (!job || preVisitGuidance) { setGuidanceOpen(v => !v); return }
    setGuidanceLoading(true)
    setGuidanceOpen(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 700,
          messages: [{ role: 'user', content: 'A homeowner is about to have a tradie visit their property for a site consult. Help them prepare.\n\nJob: ' + (job.title||'') + '\nTrade: ' + (job.trade_category||'') + '\nDescription: ' + (job.description||'Not provided') + '\nProperty type: ' + (job.property_type||'residential') + '\n\nProvide:\n1. THINGS TO LOOK FOR — 3-4 specific things to observe during the visit\n2. QUESTIONS TO ASK — 3-4 direct questions to put to the tradie\n3. WHAT TO HAVE READY — 2-3 practical things to prepare before they arrive\n\nBe specific to this job. No generic advice.' }]
        })
      })
      const data = await res.json()
      setPreVisitGuidance(data.content?.find((b: any) => b.type === 'text')?.text || null)
    } catch { setPreVisitGuidance(null) }
    setGuidanceLoading(false)
  }

  const saveInternalNotes = async () => {
    if (!assessment) return
    setSavingInternal(true)
    await supabase.from('site_assessments').update({
      tradie_materials_notes: internalNotes.materials,
      tradie_labour_notes: internalNotes.labour,
      tradie_site_brief: internalNotes.brief,
    }).eq('id', assessment.id)
    setInternalSaved(true)
    setSavingInternal(false)
    setTimeout(() => setInternalSaved(false), 2000)
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif', lineHeight:'1.6' }

  if (noJobId) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'white', borderRadius:'14px', padding:'32px', maxWidth:'400px', width:'100%', textAlign:'center' as const }}>
        <p style={{ fontSize:'24px', marginBottom:'12px' }}>🔍</p>
        <h2 style={{ fontSize:'18px', fontWeight:600, color:'#0A0A0A', marginBottom:'8px' }}>Which job is this for?</h2>
        <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:1.6, marginBottom:'20px' }}>You have multiple active jobs. Please go back to your dashboard and navigate to this page from the job you want to work on.</p>
        <a href="/dashboard" style={{ display:'inline-block', background:'#0A0A0A', color:'white', padding:'11px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, textDecoration:'none' }}>← Back to dashboard</a>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' as const, maxWidth:'480px', padding:'0 24px' }}>
        {isTradie ? (
          <>
            <p style={{ fontSize:'15px', fontWeight:500, color:'#0A0A0A', margin:'0 0 8px' }}>No consult scheduled for this job</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 20px' }}>
              Use the message thread to arrange a site visit time with the client. Both parties need to complete and acknowledge their consult notes before the job moves to the quoting stage.
            </p>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const, justifyContent:'center' }}>
              <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'white', background:'#0A0A0A', padding:'10px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>← Back to dashboard</a>
              <a href="/messages" style={{ fontSize:'13px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', padding:'10px 18px', borderRadius:'8px', textDecoration:'none' }}>Message client →</a>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize:'15px', fontWeight:500, color:'#0A0A0A', margin:'0 0 8px' }}>No consult notes yet</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 20px' }}>
              If you skipped the consult stage, contact your tradie through messages to arrange a site visit. Or continue to the estimate stage if a consult is not needed.
            </p>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const, justifyContent:'center' }}>
              <a href="/shortlist" style={{ fontSize:'13px', color:'white', background:'#0A0A0A', padding:'10px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>← Back to matches</a>
              <a href="/messages" style={{ fontSize:'13px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', padding:'10px 18px', borderRadius:'8px', textDecoration:'none' }}>Message your tradie →</a>
              <button type="button" onClick={async () => {
                            const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                  // use the job already in context rather than re-querying
                  if (job) await supabase.from('jobs').update({ consult_skipped_by_client: true }).eq('id', job.id)
                }
                window.location.href = '/compare?job_id=' + job?.id
              }} style={{ fontSize:'13px', color:'#4A5E64', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.15)', padding:'10px 18px', borderRadius:'8px', cursor:'pointer' }}>Skip to quote →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )


  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={isTradie} />

      {/* STAGE RAIL */}
      <OnboardingModal storageKey="seen_consult_explainer" slides={[
        {
          icon: '📋',
          title: 'The consult record',
          body: 'This is where you document what was discussed during the site visit — before any quote is submitted. You and your tradie write independent notes, then share them with each other.',
          sub: 'Once shared, notes are locked. This creates a tamper-proof record that protects both parties if the scope is ever disputed.',
        },
        {
          icon: '✍️',
          title: 'What to write',
          body: 'Note what the tradie looked at and said, any access issues or complications they flagged, their initial advice, anything left unresolved, and what you expect the quote to include. The more specific you are, the stronger your position.',
        },
        {
          icon: '✅',
          title: 'Acknowledge and proceed',
          body: "Once both parties have shared their notes, you each acknowledge the other's record. This unlocks the quoting stage and makes the consult notes a permanent part of the job file.",
        },
      ]} />
      <StageRail currentPath="/consult" jobStatus={job?.status} role={isTradie ? 'tradie' : 'client'} />
      {allJobs.length > 1 && (
        <div style={{ maxWidth:'780px', margin:'0 auto', padding:'16px 24px 0' }}>
          <JobSelector jobs={allJobs} selectedJobId={job?.id} onSelect={async (id) => {
            const selected = allJobs.find(j => j.id === id)
            setJob(selected)
            // Reload assessment for selected job
            const { data: assess } = await supabase.from('site_assessments').select('*').eq('job_id', id).single()
            if (assess) { setAssessment(assess); setForm(assess) }
          }} />
        </div>
      )}

      <div style={{ maxWidth:'780px', margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#9B6B9B', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Consult</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'6px' }}>CONSULT</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'4px' }}>{job.title}</p>
        {(urlTradieProfile || urlTradieName || job.tradie?.business_name) && (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', background:'rgba(155,107,155,0.06)', border:'1px solid rgba(155,107,155,0.15)', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
            {urlTradieProfile?.logo_url ? (
              <img src={urlTradieProfile.logo_url} alt="" style={{ width:'36px', height:'36px', borderRadius:'8px', objectFit:'cover' as const, flexShrink:0 }} />
            ) : (
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'rgba(155,107,155,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'16px', color:'#9B6B9B', fontWeight:600 }}>{(urlTradieName || job.tradie?.business_name || '?').charAt(0)}</span>
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:'13px', color:'#9B6B9B', fontWeight:600, margin:'0 0 2px' }}>
                {urlTradieName || job.tradie?.business_name}
                {urlTradieProfile?.licence_verified && <span style={{ marginLeft:'6px', fontSize:'10px', background:'rgba(46,125,96,0.1)', color:'#2E7D60', padding:'1px 6px', borderRadius:'4px', fontWeight:500 }}>✓ Verified</span>}
              </p>
              {urlTradieProfile?.trade_categories?.length > 0 && (
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{urlTradieProfile.trade_categories.join(', ')}</p>
              )}
            </div>
            {urlTradieId && (
              <a href={'/tradie/' + urlTradieId} target="_blank" rel="noreferrer"
                style={{ fontSize:'11px', color:'#2E6A8F', textDecoration:'none', flexShrink:0 }}>
                View profile ↗
              </a>
            )}
          </div>
        )}
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'8px' }}>{job.trade_category} · {job.suburb}</p>
        <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'32px' }}>
          Record your notes from the site consultation. Share them with {theirLabel} and acknowledge theirs before quoting begins. Both records become part of the job file.
        </p>

        {/* Consult skipped notice for tradie */}
        {isTradie && (job?.consult_skipped_by_client || job?.status === 'compare') && (
          <div style={{ background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'12px', padding:'20px 24px', marginBottom:'28px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#C07830', margin:'0 0 6px' }}>⚡ Client has skipped the site consult</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:'0 0 16px' }}>
              {job?.client?.full_name || 'The client'} has chosen to proceed directly to quoting without a site visit. You can still complete consult notes below if helpful, or go straight to submitting your quote.
            </p>
            <a href={'/agreement?job_id=' + job?.id} style={{ display:'inline-block', background:'#C07830', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:600, textDecoration:'none' }}>
              Submit your quote →
            </a>
          </div>
        )}

        {/* Tradie skip option — when consult not yet skipped by either party */}
        {isTradie && !job?.consult_skipped_by_client && job?.status !== 'compare' && !assessment?.tradie_shared_at && (
          <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 4px' }}>Skip the site consult?</p>
              <p style={{ fontSize:'12px', color:'#7A9098', lineHeight:'1.6', margin:0 }}>
                If you already have enough information to quote — or the client has agreed to proceed without a visit — you can go straight to submitting your quote. Your consult notes will be marked as not required.
              </p>
            </div>
            <button type="button" onClick={async () => {
              if (!job) return
              const supabase = (await import('@/lib/supabase/client')).createClient()
              const { data: { session } } = await supabase.auth.getSession()
              await supabase.from('jobs').update({ consult_skipped_by_client: true, status: 'quote' }).eq('id', job.id)
              await supabase.from('job_messages').insert({ job_id: job.id, sender_id: session?.user.id, body: 'Tradie has proposed to skip the site consult and proceed directly to quoting.' })
              window.location.href = '/quote?job_id=' + job.id
            }} style={{ background:'#0A0A0A', color:'white', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', whiteSpace:'nowrap' as const, flexShrink:0 }}>
              Skip to quote →
            </button>
          </div>
        )}

        {/* CONSULT DATE */}
        {!isTradie && !myShared && (
          <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 18px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
            <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Prefer to go straight to quotes without a site consult?</p>
            <button type="button" onClick={async () => {
              if (!job) return
                        const { data: { session } } = await supabase.auth.getSession()
              await supabase.from('site_assessments').upsert({
                job_id: job.id,
                client_what_discussed: 'Consult skipped by client — proceeded directly to quoting.',
              }, { onConflict: 'job_id' })
              await supabase.from('jobs').update({ status: 'quote', consult_skipped_by_client: true }).eq('id', job.id)
              await supabase.from('job_messages').insert({
                job_id: job.id,
                sender_id: session?.user.id,
                body: 'Consult skipped — client has proceeded directly to quoting.',
              })
              window.location.href = '/compare?job_id=' + job.id
            }} style={{ fontSize:'12px', color:'#9AA5AA', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'6px 14px', cursor:'pointer', whiteSpace:'nowrap' as const }}>
              Skip consult →
            </button>
          </div>
        )}

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:'0 0 2px' }}>CONSULTATION DATE</p>
              {job?.tradie?.business_name && (
                <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.45)', margin:0 }}>with {job.tradie.business_name}</p>
              )}
            </div>
            {/* ── Consult scheduling — via messenger ── */}
            <a href={'/messages' + (job?.id ? '?job=' + job.id : '')}
              style={{ display:'inline-block', background:'#9B6B9B', color:'white', padding:'8px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:500, textDecoration:'none', whiteSpace:'nowrap' as const }}>
              Message thread →
            </a>

            {assessment?.consult_date && (
              <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(28,43,50,0.06)' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'6px' }}>Who attended</p>
                <input type="text" value={form.consult_attendees || ''} onChange={e => setF('consult_attendees', e.target.value)}
                  style={inp} placeholder="e.g. Homeowner + lead electrician" />
              </div>
            )}
          </div>
        </div>

        {/* Both acknowledged CTA */}
        {myAcknowledged && theirAcknowledged && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'2px solid rgba(46,125,96,0.3)', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
            <div>
              <p style={{ fontSize:'14px', fontWeight:600, color:'#2E7D60', margin:'0 0 4px' }}>Consult complete</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>{isTradie ? 'Both parties have acknowledged. Submit your quote to proceed.' : 'Both parties have acknowledged. Review the quote and proceed to scope agreement.'}</p>
            </div>
            <a href={isTradie ? '/quote?job_id=' + job?.id : '/compare?job_id=' + job?.id}>
              <button type="button" style={{ background:'#2E7D60', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' as const }}>
                {isTradie ? 'Submit your quote →' : 'Review quotes →'}
              </button>
            </a>
          </div>
        )}
        {/* TABS */}
        {/* STATUS STRIP */}
        <div style={{ marginBottom:'16px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 16px' }}>
          <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'8px' }}>Consult status</p>
          <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' as const }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: myShared ? '#2E7D60' : '#C07830', flexShrink:0 }} />
              <span style={{ fontSize:'12px', color: myShared ? '#2E7D60' : '#C07830', fontWeight:500 }}>
                {myShared ? 'Your notes shared' : 'Your notes not yet shared'}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: theirShared ? '#2E7D60' : '#9AA5AA', flexShrink:0 }} />
              <span style={{ fontSize:'12px', color: theirShared ? '#2E7D60' : '#9AA5AA', fontWeight:500 }}>
                {theirShared ? (theirLabel + ' notes shared') : ('Waiting for ' + theirLabel)}
              </span>
            </div>
            {myShared && theirShared && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: (myAcknowledged && theirAcknowledged) ? '#2E7D60' : '#C07830', flexShrink:0 }} />
                <span style={{ fontSize:'12px', color: (myAcknowledged && theirAcknowledged) ? '#2E7D60' : '#C07830', fontWeight:500 }}>
                  {(myAcknowledged && theirAcknowledged) ? 'Both acknowledged — ready to quote' : myAcknowledged ? ('Waiting for ' + theirLabel + ' to acknowledge') : ('Acknowledge ' + theirLabel + '’s notes to proceed')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Appointment card — tradie only ── */}
        {isTradie && assessment?.consult_date && (
          <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'20px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 20%, rgba(212,82,42,0.12), transparent 55%)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'8px' }}>Day of consult</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'16px', marginBottom:'16px' }}>
                <div>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'3px' }}>Date & time</p>
                  <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:0 }}>
                    {new Date(assessment.consult_date).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' })}
                    {' · '}
                    {new Date(assessment.consult_date).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'3px' }}>Client</p>
                  <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:'0 0 2px' }}>{job?.client?.full_name}</p>
                  {job?.client?.phone && (
                    <a href={'tel:' + job.client.phone} style={{ fontSize:'13px', color:'#D4522A', textDecoration:'none' }}>{job.client.phone}</a>
                  )}
                </div>
                <div>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'3px' }}>Address</p>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', margin:'0 0 4px' }}>
                    {[job?.address, job?.suburb, job?.state].filter(Boolean).join(', ') || job?.suburb || 'See job details'}
                  </p>
                  {(job?.suburb || job?.address) && (
                    <a href={'https://maps.google.com/?q=' + encodeURIComponent([job?.address, job?.suburb, 'WA', 'Australia'].filter(Boolean).join(' '))}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize:'12px', color:'#4A9EE8', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                      📍 Open in Google Maps →
                    </a>
                  )}
                </div>
                <div>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'3px' }}>Job</p>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', margin:0 }}>{job?.title}</p>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:'2px 0 0' }}>{job?.trade_category}</p>
                </div>
              </div>
              {job?.description && (
                <div style={{ borderTop:'1px solid rgba(216,228,225,0.08)', paddingTop:'12px' }}>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'6px' }}>Client brief</p>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.6)', lineHeight:'1.6', margin:0 }}>{job.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)', marginBottom:'20px' }}>
          <button type="button" onClick={() => setActiveTab('mine')}
            style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === 'mine' ? '2px solid #9B6B9B' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === 'mine' ? 600 : 400, color: activeTab === 'mine' ? '#0A0A0A' : '#7A9098' }}>
            My notes {myShared ? '✓ Shared' : ''}
          </button>
          <button type="button" onClick={() => setActiveTab('theirs')}
            style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === 'theirs' ? '2px solid #9B6B9B' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === 'theirs' ? 600 : 400, color: activeTab === 'theirs' ? '#0A0A0A' : '#7A9098' }}>
            {theirLabel}&apos;s notes {theirShared ? '✓ Shared' : '— not yet shared'}
          </button>
        </div>

        {activeTab === 'mine' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>

            {/* CLIENT EXPLAINER — shown before notes are shared */}
            {!isTradie && !myShared && (
              <div style={{ background:'rgba(155,107,155,0.06)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#9B6B9B', marginBottom:'12px', letterSpacing:'0.2px' }}>What is the consult for?</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'12px' }}>
                  The consult is a site visit where you and your tradie see the job together in person. It creates a shared record — before any quote is submitted — of what was discussed, what was observed, and what each party expects.
                </p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'16px' }}>
                  This record protects you both. If the scope changes later, you have a written baseline. If there is a dispute, you have evidence of what was agreed before work started.
                </p>
                <div style={{ borderTop:'1px solid rgba(155,107,155,0.15)', paddingTop:'12px' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'8px' }}>During the visit, note down:</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px' }}>
                    {[
                      'What the tradie looked at and what they said about it',
                      'Any access issues, existing damage or complications they flagged',
                      'Their initial advice — did they suggest a different approach?',
                      'Anything left unresolved — pricing TBC, council approval needed, etc.',
                      'What you expect the quote to include',
                    ].map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'rgba(155,107,155,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#9B6B9B', fontWeight:700, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                        <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', margin:0 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#0A0A0A' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>YOUR CONSULT NOTES</p>
              </div>
              <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>
                {/* AI pre-visit guidance — client only */}
                {!isTradie && (
                  <div>
                    <button type="button" onClick={loadPreVisitGuidance}
                      style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'10px', padding:'12px 16px', width:'100%', cursor:'pointer', textAlign:'left' as const, marginBottom: guidanceOpen ? 0 : '0' }}>
                      <span style={{ fontSize:'15px' }}>✦</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'#6B4FA8', margin:0 }}>AI pre-visit guidance</p>
                        <p style={{ fontSize:'11px', color:'#9B6B9B', margin:0 }}>What to look for, what to ask, and what to have ready</p>
                      </div>
                      <span style={{ fontSize:'11px', color:'#9B6B9B' }}>{guidanceOpen ? '▲' : '▼'}</span>
                    </button>
                    {guidanceOpen && (
                      <div style={{ background:'rgba(107,79,168,0.03)', border:'1px solid rgba(107,79,168,0.15)', borderTop:'none', borderRadius:'0 0 10px 10px', padding:'14px 16px' }}>
                        {guidanceLoading
                          ? <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Preparing guidance for your visit...</p>
                          : <div style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', whiteSpace:'pre-wrap' as const }}>{preVisitGuidance}</div>
                        }
                      </div>
                    )}
                  </div>
                )}
                {myPrompts.map(prompt => (
                  <div key={prompt.key}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'6px' }}>{prompt.label}</p>
                    <textarea value={form[prompt.key] || ''} onChange={e => setF(prompt.key, e.target.value)}
                      rows={3} placeholder={prompt.placeholder}
                      style={{ ...inp, resize:'vertical' as const }}
                      disabled={!!myShared}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* INTERNAL NOTES — tradie only, never shared */}
            {isTradie && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>INTERNAL NOTES</p>
                    <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Private — never shared with the client. Informs your quote and site brief.</p>
                  </div>
                  <span style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'100px', padding:'3px 10px' }}>🔒 Private</span>
                </div>
                <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', marginBottom:'5px' }}>Materials & quantities</p>
                    <textarea value={internalNotes.materials} onChange={e => setInternalNotes(n => ({ ...n, materials: e.target.value }))}
                      rows={3} placeholder="e.g. 20m² tiles @ $45/m², 2x taps, 15m copper pipe 15mm, waterproofing membrane..."
                      style={{ ...inp, resize:'vertical' as const }} />
                  </div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', marginBottom:'5px' }}>Labour & sequence</p>
                    <textarea value={internalNotes.labour} onChange={e => setInternalNotes(n => ({ ...n, labour: e.target.value }))}
                      rows={3} placeholder="e.g. Day 1: demo and waterproof. Day 2-3: tiling. Day 4: fixtures and grouting. 2 workers needed day 1..."
                      style={{ ...inp, resize:'vertical' as const }} />
                  </div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', marginBottom:'5px' }}>Site brief for workers</p>
                    <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'6px' }}>What workers need to know before arriving on site.</p>
                    <textarea value={internalNotes.brief} onChange={e => setInternalNotes(n => ({ ...n, brief: e.target.value }))}
                      rows={4} placeholder="e.g. Access via side gate — call client day before. Asbestos suspected in wall cavity, treat as live. Park in street. Client works from home — keep noise down before 9am..."
                      style={{ ...inp, resize:'vertical' as const }} />
                  </div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <button type="button" onClick={saveInternalNotes} disabled={savingInternal}
                      style={{ background: internalSaved ? '#2E7D60' : '#0A0A0A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: savingInternal ? 0.7 : 1 }}>
                      {internalSaved ? '✓ Saved' : savingInternal ? 'Saving...' : 'Save internal notes'}
                    </button>
                    {internalNotes.brief && (
                      <button type="button" onClick={() => setShowBrief(!showBrief)}
                        style={{ background:'rgba(46,106,143,0.08)', color:'#2E6A8F', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(46,106,143,0.2)', cursor:'pointer' }}>
                        {showBrief ? 'Hide brief' : '📋 Preview site brief →'}
                      </button>
                    )}
                  </div>
                  {showBrief && internalNotes.brief && (
                    <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'20px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>SITE BRIEF</p>
                        <button type="button" onClick={() => window.print()}
                          style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'5px 10px', cursor:'pointer' }}>
                          Print / save →
                        </button>
                      </div>
                      <div style={{ borderBottom:'1px solid rgba(28,43,50,0.08)', paddingBottom:'12px', marginBottom:'12px' }}>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>{job?.title}</p>
                        <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                          {[job?.address, job?.suburb].filter(Boolean).join(', ') || job?.suburb}
                          {assessment?.consult_date && ' · ' + new Date(assessment.consult_date).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                      {internalNotes.materials && (
                        <div style={{ marginBottom:'12px' }}>
                          <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'4px' }}>Materials</p>
                          <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' as const }}>{internalNotes.materials}</p>
                        </div>
                      )}
                      {internalNotes.labour && (
                        <div style={{ marginBottom:'12px' }}>
                          <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'4px' }}>Labour & sequence</p>
                          <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' as const }}>{internalNotes.labour}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'4px' }}>Site notes for workers</p>
                        <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' as const }}>{internalNotes.brief}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PHOTO UPLOAD */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#0A0A0A' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>SITE PHOTOS</p>
              </div>
              <div style={{ padding:'16px' }}>
                <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px', lineHeight:'1.6' }}>
                  Upload photos from the site visit — existing conditions, areas of concern, access points. Photos are shared with your notes.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginBottom:'12px' }}>
                  {(isTradie ? tradiePhotos : clientPhotos).map((url, i) => (
                    <div key={i} style={{ position:'relative', aspectRatio:'1', borderRadius:'8px', overflow:'hidden', background:'rgba(28,43,50,0.06)' }}>
                      <img src={url} alt={'Photo ' + (i+1)} style={{ width:'100%', height:'100%', objectFit:'cover' as const }} />
                      {!myShared && (
                        <button type="button" onClick={() => removePhoto(url)}
                          style={{ position:'absolute', top:'4px', right:'4px', background:'rgba(28,43,50,0.7)', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {!myShared && (
                    <label style={{ aspectRatio:'1', borderRadius:'8px', border:'1.5px dashed rgba(28,43,50,0.2)', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#F4F8F7' }}>
                      <input type="file" accept="image/*" multiple style={{ display:'none' }}
                        onChange={async e => {
                          const files = Array.from(e.target.files || [])
                          for (const file of files) await uploadPhoto(file)
                          e.target.value = ''
                        }}
                      />
                      {photoError && (
                        <p style={{ fontSize:'12px', color:'#D4522A', margin:'8px 0 0' }}>⚠ {photoError}</p>
                      )}
                      {uploadingPhotos ? (
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Uploading...</p>
                      ) : (
                        <>
                          <span style={{ fontSize:'20px', marginBottom:'4px', opacity:0.4 }}>📷</span>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Add photos</p>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>

            {!myShared ? (
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" onClick={save} disabled={saving}
                  style={{ flex:1, background:'transparent', color:'#0A0A0A', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save draft'}
                </button>
                <button type="button" onClick={async () => {
                    // Create assessment record if it doesn't exist yet
                    if (!assessment && job) {
                                const { data: newAssess } = await supabase.from('site_assessments').insert({ job_id: job.id, consult_date: new Date().toISOString() }).select().single()
                      if (newAssess) { setAssessment(newAssess); setForm(newAssess) }
                      await new Promise(r => setTimeout(r, 100))
                    }
                    await save(); await share();
                  }}
                  disabled={sharing}
                  style={{ flex:2, background:'#9B6B9B', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: sharing ? 0.7 : 1 }}>
                  {sharing ? 'Sharing...' : 'Save and share with ' + theirLabel + ' →'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ background:'rgba(155,107,155,0.06)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'10px', padding:'14px 16px' }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'#9B6B9B', marginBottom:'4px' }}>✓ Notes shared with {theirLabel}</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Shared {new Date(myShared).toLocaleDateString('en-AU')} at {new Date(myShared).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}. Your notes are now locked.</p>
                </div>
                {!theirShared && (
                  <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px 18px', marginTop:'10px' }}>
                    <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', marginBottom:'8px' }}>You are done for now — waiting for {theirLabel}</p>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'12px' }}>
                      {[
                        { icon:'📅', text:'The tradie will propose times for the site visit — you will confirm which suits you.' },
                        { icon:'📋', text:'After the visit, the tradie will write up their own notes and share them with you.' },
                        { icon:'✅', text:'Once both sets of notes are shared and acknowledged, quoting begins.' },
                      ].map((item, i) => (
                        <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                          <span style={{ fontSize:'14px', flexShrink:0 }}>{item.icon}</span>
                          <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize:'11px', color:'#9AA5AA', marginBottom:'8px' }}>This usually takes 1–3 business days. If you have not heard back after 2 days:</p>
                    <a href="/messages" style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>Message {theirLabel} directly →</a>
                  </div>
                )}
                {theirShared && !myAcknowledged && (
                  <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'10px', padding:'14px 16px', marginTop:'10px' }}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#2E6A8F', marginBottom:'4px' }}>{theirLabel} has shared their notes</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', margin:'0 0 10px' }}>Read their notes on the {theirLabel} tab and acknowledge them to proceed to quoting.</p>
                    <button type="button" onClick={() => setActiveTab('theirs')}
                      style={{ fontSize:'12px', color:'white', background:'#2E6A8F', border:'none', borderRadius:'6px', padding:'6px 14px', cursor:'pointer' }}>
                      Read {theirLabel} notes →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'theirs' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            {!theirShared ? (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'48px', textAlign:'center' as const }}>
                <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.4 }}>📋</div>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>{theirLabel} hasn&apos;t shared their notes yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'20px' }}>You&apos;ll be notified by email when they share their assessment.</p>
                {!isTradie && myShared && (
                  <div style={{ marginBottom:'12px', padding:'12px 14px', background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.15)', borderRadius:'8px' }}>
                    <p style={{ fontSize:'12px', color:'#2E6A8F', marginBottom:'8px' }}>You&apos;ve shared your notes. You can go to Compare Quotes now — you don&apos;t need to wait for the other party to acknowledge.</p>
                    <a href="/compare" style={{ fontSize:'13px', color:'#2E6A8F', fontWeight:500, textDecoration:'none' }}>Proceed to compare quotes →</a>
                  </div>
                )}
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const }}>
                  <a href="/messages" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'13px', padding:'8px 14px', border:'1px solid rgba(46,106,143,0.3)', borderRadius:'7px' }}>Message {theirLabel} →</a>
                  <button type="button" onClick={async () => {
                    await fetch('/api/email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'assess_reminder', job_id: job.id, remind_party: isTradie ? 'client' : 'tradie' }),
                    })
                    setReminderSent(true); setTimeout(() => setReminderSent(false), 3000)
                  }} style={{ fontSize:'13px', color:'#9B6B9B', background:'none', border:'1px solid rgba(155,107,155,0.3)', borderRadius:'7px', padding:'8px 14px', cursor:'pointer' }}>
                    Send email reminder
                  </button>
                  {reminderSent && (
                    <p style={{ fontSize:'12px', color:'#2E7D60', margin:'6px 0 0' }}>✓ Reminder sent</p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#0A0A0A', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>{theirLabel?.toUpperCase()}&apos;S NOTES</p>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:0 }}>Shared {new Date(theirShared).toLocaleDateString('en-AU')}</p>
                </div>
                <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>
                  {/* THEIR PHOTOS */}
                {(isTradie ? clientPhotos : tradiePhotos).length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'8px' }}>Site photos</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px' }}>
                      {(isTradie ? clientPhotos : tradiePhotos).map((url, i) => (
                        <div key={i} style={{ aspectRatio:'1', borderRadius:'8px', overflow:'hidden', background:'rgba(28,43,50,0.06)' }}>
                          <img src={url} alt={'Photo ' + (i+1)} style={{ width:'100%', height:'100%', objectFit:'cover' as const }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(isTradie ? CLIENT_PROMPTS : TRADIE_PROMPTS).map(prompt => {
                    const value = assessment?.[prompt.key]
                    if (!value) return null
                    return (
                      <div key={prompt.key} style={{ padding:'14px 16px', background:'#F4F8F7', borderRadius:'10px' }}>
                        <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'8px' }}>{prompt.label}</p>
                        <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.6', margin:0 }}>{value}</p>
                      </div>
                    )
                  })}
                </div>
                {!myAcknowledged ? (
                  <div style={{ padding:'0 20px 20px' }}>
                    <button type="button" onClick={acknowledge} disabled={acknowledging}
                      style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: acknowledging ? 0.7 : 1 }}>
                      {acknowledging ? 'Acknowledging...' : '✓ I have read and acknowledge these notes →'}
                    </button>
                    <p style={{ fontSize:'12px', color:'#7A9098', textAlign:'center' as const, marginTop:'8px' }}>Acknowledging does not mean you agree with everything — it means you have read the record.</p>
                  </div>
                ) : (
                  <div style={{ padding:'0 20px 20px' }}>
                    <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'12px 14px' }}>
                      <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:0 }}>✓ Acknowledged {new Date(myAcknowledged).toLocaleDateString('en-AU')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* UNIFIED TRANSITION PANEL */}
            <div style={{ marginTop:'16px' }}>
              {myAcknowledged && theirAcknowledged ? (
                // Both acknowledged — consult complete
                <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'12px', padding:'20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#2E7D60', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', color:'white', flexShrink:0 }}>✓</div>
                    <p style={{ fontSize:'15px', fontWeight:600, color:'#2E7D60', margin:0 }}>Consult complete</p>
                  </div>
                  <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>
                    Both parties have acknowledged each other&apos;s notes. The consult record is saved.
                    {isTradie ? ' Quoting is now open. Submit your quote and the client will proceed to scope agreement.' : ' You are ready to review the quote and proceed to scope agreement.'}
                  </p>
                  <a href={isTradie ? '/quote?job_id=' + job?.id : '/compare?job_id=' + job?.id} style={{ textDecoration:'none' }}>
                    <button type="button" style={{ background:'#2E7D60', color:'white', padding:'12px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer', width:'100%' }}>
                      {isTradie ? 'Submit your quote →' : 'Review quotes →'}
                    </button>
                  </a>
                </div>
              ) : myAcknowledged && !theirAcknowledged ? (
                // I acknowledged, waiting for them
                <div style={{ background:'rgba(192,120,48,0.05)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'12px', padding:'18px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#C07830', flexShrink:0 }} />
                    <p style={{ fontSize:'13px', fontWeight:600, color:'#C07830', margin:0 }}>Waiting for {theirLabel} to acknowledge</p>
                  </div>
                  <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'14px', lineHeight:'1.6' }}>
                    You&apos;ve acknowledged {theirLabel}&apos;s notes. {isTradie ? 'The client will be notified when they can proceed.' : 'You can review the quote now, or wait for your tradie to acknowledge first.'}
                  </p>
                  {!isTradie && (
                    <a href={'/compare?job_id=' + job?.id} style={{ textDecoration:'none' }}>
                      <button type="button" style={{ background:'#0A0A0A', color:'white', padding:'10px 22px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                        Proceed to compare quotes →
                      </button>
                    </a>
                  )}
                </div>
              ) : !myAcknowledged && theirShared ? (
                // They shared, I haven't acknowledged yet
                <div style={{ background:'rgba(46,106,143,0.05)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'12px', padding:'18px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2E6A8F', flexShrink:0 }} />
                    <p style={{ fontSize:'13px', fontWeight:600, color:'#2E6A8F', margin:0 }}>{theirLabel} has shared their notes</p>
                  </div>
                  <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6' }}>
                    Read {theirLabel}&apos;s notes in the &ldquo;Their notes&rdquo; tab, then acknowledge to complete the consult.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* MESSAGES — post-lock notes */}
        <div style={{ marginTop:'24px' }}>
          {myShared && (
            <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', padding:'10px 14px', marginBottom:'10px', display:'flex', gap:'8px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'14px', flexShrink:0 }}>🔒</span>
              <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                <strong style={{ color:'#0A0A0A' }}>Consult record is locked.</strong> Any observations or follow-up notes after this point go in the job thread below — they are timestamped and visible to both parties, but separate from the locked record.
              </p>
            </div>
          )}
          <a href={'/messages' + (job?.id ? '?job=' + job.id : '')} style={{ display:'block', textDecoration:'none' }}>
            <div style={{ background:'#0A0A0A', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'16px' }}>💬</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:'0 0 2px' }}>Job thread — add notes or follow up</p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:0 }}>All messages, system updates and stage records in one place →</p>
              </div>
              <span style={{ fontSize:'16px', color:'rgba(216,228,225,0.4)' }}>→</span>
            </div>
          </a>
        </div>

      </div>
      <StageGuideModal
        storageKey="seen_consult_guide"
        stageNumber={3}
        stageColor="#9B6B9B"
        stageLabel="Consult"
        headline="The consult is the most important hour of the job"
        intro="Before any quote is submitted, both parties document what was seen, said and expected on site. This record is locked once shared."
        checklist={[
          { text: 'Write your notes independently before sharing', emphasis: true },
          { text: 'Record what was observed, discussed, and what remains unresolved', emphasis: false },
          { text: 'Be specific — vague notes provide no protection', emphasis: false },
          { text: 'Read the other party record carefully before acknowledging it', emphasis: false },
        ]}
        warning="Acknowledging the other party record means you accept it as accurate. Do not acknowledge without reading."
        ctaLabel="Start my consult notes"
      />

      {/* WAITING modal — client acknowledged, tradie hasn't yet */}
      {showWaitModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(28,43,50,0.82)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'500px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
            <div style={{ background:'#0A0A0A', padding:'20px 28px', borderBottom:'2px solid #9B6B9B' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:0 }}>CONSULT NOTES LOCKED</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>Your record is saved — waiting for the other party</p>
            </div>
            <div style={{ padding:'24px 28px' }}>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'16px' }}>
                Your consult notes are locked and shared. They are permanently saved to your Document Vault as the first entry in your job file.
              </p>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'20px' }}>
                Once the other party shares and both records are acknowledged, quoting opens. You will be notified at each step.
              </p>
              <div style={{ background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#9B6B9B', margin:'0 0 4px' }}>While you wait — explore your Document Vault</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:'0 0 12px', lineHeight:'1.5' }}>Every Steadyhand job automatically builds your property record. Your consult notes are already there. Scope agreements, milestone records and warranty certificates will follow as the job progresses.</p>
                <a href="/vault" style={{ display:'inline-block', background:'#9B6B9B', color:'white', padding:'10px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, textDecoration:'none' }}>See my Document Vault →</a>
              </div>
              <button type="button" onClick={() => setShowWaitModal(false)}
                style={{ display:'block', margin:'0 auto', background:'none', border:'none', fontSize:'12px', color:'#9AA5AA', cursor:'pointer', textDecoration:'underline' }}>
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE modal — both acknowledged, quotes now open */}
      {showCompleteModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(28,43,50,0.82)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#E8F0EE', borderRadius:'20px', maxWidth:'500px', width:'100%', overflow:'hidden', boxShadow:'0 24px 80px rgba(28,43,50,0.3)' }}>
            <div style={{ background:'#0A0A0A', padding:'20px 28px', borderBottom:'2px solid #2E7D60' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:0 }}>CONSULT COMPLETE</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', margin:'4px 0 0' }}>Both parties have acknowledged — quoting is now open</p>
            </div>
            <div style={{ padding:'24px 28px' }}>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'16px' }}>
                Both parties have acknowledged the consult record. It is now locked, timestamped and saved permanently to your Document Vault — the first entry in your job file.
              </p>
              <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'20px' }}>
                Tradies can now submit their quotes. You will be notified when each quote arrives.
              </p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                <a href="/compare" style={{ textDecoration:'none' }}>
                  <div style={{ background:'#2E7D60', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'white', margin:'0 0 2px' }}>Go to Compare</p>
                      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', margin:0 }}>Review quotes as they arrive</p>
                    </div>
                    <span style={{ fontSize:'18px', color:'white' }}>→</span>
                  </div>
                </a>
                <a href="/vault" style={{ textDecoration:'none' }}>
                  <div style={{ background:'white', border:'1.5px solid rgba(155,107,155,0.3)', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#9B6B9B', margin:'0 0 2px' }}>Explore my Document Vault</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Your consult record is already saved there</p>
                    </div>
                    <span style={{ fontSize:'18px', color:'#9B6B9B' }}>→</span>
                  </div>
                </a>
                <a href={'/messages' + (job?.id ? '?job=' + job.id : '')} style={{ textDecoration:'none' }}>
                  <div style={{ background:'white', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>Add follow-up notes</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Job thread — for anything after the locked record</p>
                    </div>
                    <span style={{ fontSize:'18px', color:'#7A9098' }}>→</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  )
}
