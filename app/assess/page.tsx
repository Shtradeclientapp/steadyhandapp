'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StageRail } from '@/components/ui'
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
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isTradie, setIsTradie] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [form, setForm] = useState<any>({})
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [clientPhotos, setClientPhotos] = useState<string[]>([])
  const [tradiePhotos, setTradiePhotos] = useState<string[]>([])
  const [proposingDate, setProposingDate] = useState(false)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedSlots, setProposedSlots] = useState(['','',''])
  const [savingDate, setSavingDate] = useState(false)
  const [confirmingSlot, setConfirmingSlot] = useState(false)
  const [activeTab, setActiveTab] = useState<'mine'|'theirs'>('mine')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const tradie = prof?.role === 'tradie'
      setIsTradie(tradie)

      const col = tradie ? 'tradie_id' : 'client_id'
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, id), client:profiles!jobs_client_id_fkey(full_name)')
        .eq(col, session.user.id)
        .in('status', ['assess', 'quotes', 'agreement', 'shortlisted', 'matching', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: assess } = await supabase
          .from('site_assessments')
          .select('*')
          .eq('job_id', jobs[0].id)
          .single()

        if (assess) {
          setAssessment(assess)
          setForm(assess)
          setClientPhotos(assess.client_photo_urls || [])
          setTradiePhotos(assess.tradie_photo_urls || [])
        } else if (jobs[0].tradie_id) {
          // Only create assessment record if a tradie has been assigned
          const { data: newAssess } = await supabase
            .from('site_assessments')
            .insert({ job_id: jobs[0].id, consult_date: new Date().toISOString() })
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
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = 'assessments/' + assessment.id + '/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('Job Photos').upload(path, file)
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
    const supabase = createClient()
    const field = isTradie ? 'tradie_photo_urls' : 'client_photo_urls'
    const current = isTradie ? tradiePhotos : clientPhotos
    const updated = current.filter(p => p !== url)
    await supabase.from('site_assessments').update({ [field]: updated }).eq('id', assessment.id)
    if (isTradie) setTradiePhotos(updated)
    else setClientPhotos(updated)
  }

  const proposeConsultDate = async () => {
    const filled = proposedSlots.filter(s => s.trim())
    if (!filled.length || !assessment || !job) return
    setSavingDate(true)
    const supabase = createClient()
    const senderName = isTradie ? profile.tradie?.business_name : profile.full_name
    const slotLines = filled.map((s, i) => 'Option ' + (i+1) + ': ' + new Date(s).toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long', year:'numeric' })).join('\n')
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: senderName + ' has proposed ' + filled.length + ' consultation time' + (filled.length > 1 ? 's' : '') + ':\n' + slotLines + '\n\nPlease confirm which time works for you.',
    })
    // Store proposed slots in assessment
    await supabase.from('site_assessments').update({
      consult_date: filled[0],
    }).eq('id', assessment.id)
    setAssessment((a: any) => ({ ...a, consult_date: filled[0], proposed_slots: filled }))
    setForm((f: any) => ({ ...f, consult_date: filled[0] }))
    setProposingDate(false)
    setProposedSlots(['','',''])
    setSavingDate(false)
  }

  const confirmSlot = async (slot: string) => {
    if (!assessment || !job) return
    setConfirmingSlot(true)
    const supabase = createClient()
    await supabase.from('site_assessments').update({ consult_date: slot }).eq('id', assessment.id)
    const senderName = isTradie ? profile.tradie?.business_name : profile.full_name
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: senderName + ' has confirmed the consultation: ' + new Date(slot).toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    })
    setAssessment((a: any) => ({ ...a, consult_date: slot }))
    setForm((f: any) => ({ ...f, consult_date: slot }))
    setConfirmingSlot(false)
  }

  const save = async () => {
    if (!assessment) return
    setSaving(true)
    const supabase = createClient()
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
    if (!assessment || !job) return
    setSharing(true)
    const supabase = createClient()
    const field = isTradie ? 'tradie_shared_at' : 'client_shared_at'
    await supabase.from('site_assessments').update({
      [field]: new Date().toISOString(),
    }).eq('id', assessment.id)

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
    const supabase2 = createClient()
    await supabase2.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: '📋 ' + (isTradie ? profile.tradie?.business_name : profile.full_name) + ' has shared their consult notes. Taking time to document observations before quoting begins is one of the most important trust acts in any trade relationship.',
    })
    setSharing(false)
  }

  const acknowledge = async () => {
    if (!assessment || !job) return
    setAcknowledging(true)
    const supabase = createClient()
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

    // If both acknowledged, move to quotes
    const updated = { ...assessment, [field]: new Date().toISOString() }
    if (updated.client_acknowledged_at && updated.tradie_acknowledged_at) {
      const supabase2 = createClient()
      await supabase2.from('jobs').update({ status: 'shortlisted' }).eq('id', job.id)
      setTimeout(() => { window.location.href = isTradie ? '/tradie/dashboard' : '/quotes' }, 1200)
    }
  }

  const myShared = isTradie ? assessment?.tradie_shared_at : assessment?.client_shared_at
  const theirShared = isTradie ? assessment?.client_shared_at : assessment?.tradie_shared_at
  const myAcknowledged = isTradie ? assessment?.tradie_acknowledged_at : assessment?.client_acknowledged_at
  const theirAcknowledged = isTradie ? assessment?.client_acknowledged_at : assessment?.tradie_acknowledged_at
  const myPrompts = isTradie ? TRADIE_PROMPTS : CLIENT_PROMPTS
  const theirLabel = isTradie ? (job?.client?.full_name || 'the client') : (job?.tradie?.business_name || 'your tradie')

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif', lineHeight:'1.6' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' as const }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No assessment in progress.</p>
        <a href="/shortlist" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'14px' }}>← Back to matches</a>
      </div>
    </div>
  )


  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false}   />

      {/* STAGE RAIL */}
      <StageRail currentPath="/consult" jobStatus={job?.status} />
      {allJobs.length > 1 && (
        <div style={{ maxWidth:'780px', margin:'0 auto', padding:'16px 24px 0' }}>
          <JobSelector jobs={allJobs} selectedJobId={job?.id} onSelect={async (id) => {
            const selected = allJobs.find(j => j.id === id)
            setJob(selected)
            // Reload assessment for selected job
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const { data: assess } = await supabase.from('site_assessments').select('*').eq('job_id', id).single()
            if (assess) { setAssessment(assess); setForm(assess) }
          }} />
        </div>
      )}

      <div style={{ maxWidth:'780px', margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#9B6B9B', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Consult</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>CONSULT</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'4px' }}>{job.title}</p>
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'8px' }}>{job.trade_category} · {job.suburb}</p>
        <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'32px' }}>
          Record your notes from the site consultation. Share them with {theirLabel} and acknowledge theirs before quoting begins. Both records become part of the job file.
        </p>

        {/* CONSULT DATE */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>CONSULTATION DATE</p>
            {assessment?.consult_date && !proposingDate && (
              <button type="button" onClick={() => setProposingDate(true)}
                style={{ fontSize:'11px', color:'rgba(216,228,225,0.5)', background:'none', border:'1px solid rgba(216,228,225,0.15)', borderRadius:'6px', padding:'3px 8px', cursor:'pointer' }}>
                Change date
              </button>
            )}
          </div>
          <div style={{ padding:'20px' }}>
            {assessment?.consult_date && !proposingDate ? (
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(155,107,155,0.1)', border:'1px solid rgba(155,107,155,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'18px' }}>📅</span>
                </div>
                <div>
                  <p style={{ fontSize:'15px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>
                    {new Date(assessment.consult_date).toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                  </p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Agreed consultation date</p>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>
                  {assessment?.consult_date ? 'Propose new times:' : 'Suggest up to 3 times that work for you. ' + theirLabel + ' will confirm which suits them.'}
                </p>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'14px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', width:'60px', flexShrink:0 }}>Option {i+1}{i === 0 ? ' *' : ''}</span>
                      <input type="datetime-local" value={proposedSlots[i]}
                        onChange={e => { const s = [...proposedSlots]; s[i] = e.target.value; setProposedSlots(s) }}
                        min={new Date().toISOString().slice(0,16)}
                        style={{ ...inp, flex:1 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button type="button" onClick={proposeConsultDate}
                    disabled={!proposedSlots[0] || savingDate}
                    style={{ flex:1, background:'#9B6B9B', color:'white', padding:'10px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !proposedSlots[0] || savingDate ? 0.5 : 1 }}>
                    {savingDate ? 'Sending...' : 'Send times to ' + theirLabel + ' →'}
                  </button>
                  {proposingDate && (
                    <button type="button" onClick={() => setProposingDate(false)}
                      style={{ fontSize:'13px', color:'#7A9098', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', padding:'10px 14px', cursor:'pointer' }}>
                      Cancel
                    </button>
                  )}
                </div>
                <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'8px' }}>* At least one time required. Options 2 and 3 are optional.</p>
              </div>
            )}
            {assessment?.consult_date && (
              <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(28,43,50,0.06)' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'6px' }}>Who attended</p>
                <input type="text" value={form.consult_attendees || ''} onChange={e => setF('consult_attendees', e.target.value)}
                  style={inp} placeholder="e.g. Homeowner + lead electrician" />
              </div>
            )}
          </div>
        </div>

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

        <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)', marginBottom:'20px' }}>
          <button type="button" onClick={() => setActiveTab('mine')}
            style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === 'mine' ? '2px solid #9B6B9B' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === 'mine' ? 600 : 400, color: activeTab === 'mine' ? '#1C2B32' : '#7A9098' }}>
            My notes {myShared ? '✓ Shared' : ''}
          </button>
          <button type="button" onClick={() => setActiveTab('theirs')}
            style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === 'theirs' ? '2px solid #9B6B9B' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === 'theirs' ? 600 : 400, color: activeTab === 'theirs' ? '#1C2B32' : '#7A9098' }}>
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
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>YOUR CONSULT NOTES</p>
              </div>
              <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>
                {myPrompts.map(prompt => (
                  <div key={prompt.key}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'6px' }}>{prompt.label}</p>
                    <textarea value={form[prompt.key] || ''} onChange={e => setF(prompt.key, e.target.value)}
                      rows={3} placeholder={prompt.placeholder}
                      style={{ ...inp, resize:'vertical' as const }}
                      disabled={!!myShared}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* PHOTO UPLOAD */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
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
                  style={{ flex:1, background:'transparent', color:'#1C2B32', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save draft'}
                </button>
                <button type="button" onClick={async () => { await save(); await share(); }}
                  disabled={sharing}
                  style={{ flex:2, background:'#9B6B9B', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: sharing ? 0.7 : 1 }}>
                  {sharing ? 'Sharing...' : 'Save and share with ' + theirLabel + ' →'}
                </button>
              </div>
            ) : (
              <div style={{ background:'rgba(155,107,155,0.06)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#9B6B9B', marginBottom:'4px' }}>✓ Notes shared with {theirLabel}</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Shared {new Date(myShared).toLocaleDateString('en-AU')} at {new Date(myShared).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}. Your notes are now locked.</p>
              </div>
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
                    <p style={{ fontSize:'12px', color:'#2E6A8F', marginBottom:'8px' }}>You&apos;ve shared your notes. You can proceed to compare quotes without waiting.</p>
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
                    alert('Reminder sent to ' + theirLabel)
                  }} style={{ fontSize:'13px', color:'#9B6B9B', background:'none', border:'1px solid rgba(155,107,155,0.3)', borderRadius:'7px', padding:'8px 14px', cursor:'pointer' }}>
                    Send email reminder
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
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
                        <p style={{ fontSize:'13px', color:'#1C2B32', lineHeight:'1.6', margin:0 }}>{value}</p>
                      </div>
                    )
                  })}
                </div>
                {!myAcknowledged ? (
                  <div style={{ padding:'0 20px 20px' }}>
                    <button type="button" onClick={acknowledge} disabled={acknowledging}
                      style={{ width:'100%', background:'#1C2B32', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: acknowledging ? 0.7 : 1 }}>
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
                    {isTradie ? ' Quoting is now open — the client will compare and accept a quote to proceed.' : ' You are ready to compare quotes and select a tradie to proceed.'}
                  </p>
                  <a href={isTradie ? '/tradie/dashboard' : '/compare'} style={{ textDecoration:'none' }}>
                    <button type="button" style={{ background:'#2E7D60', color:'white', padding:'12px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer', width:'100%' }}>
                      {isTradie ? 'Back to dashboard →' : 'Compare quotes →'}
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
                    You&apos;ve acknowledged {theirLabel}&apos;s notes. {isTradie ? 'The client will be notified.' : 'You can proceed to compare quotes now, or wait for them to acknowledge first.'}
                  </p>
                  {!isTradie && (
                    <a href="/compare" style={{ textDecoration:'none' }}>
                      <button type="button" style={{ background:'#1C2B32', color:'white', padding:'10px 22px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
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

        {/* MESSAGES */}
        <a href={'/messages' + (job?.id ? '?job=' + job.id : '')} style={{ display:'block', marginTop:'24px', textDecoration:'none' }}>
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'16px' }}>💬</span>
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Continue the conversation</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Message {theirLabel} about the assessment →</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}
