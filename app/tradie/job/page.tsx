'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TEMPLATES = [
  {
    id: 'detailed',
    name: 'Detailed breakdown',
    description: 'Labour, materials, plant and subcontractors listed separately',
    best_for: 'Builders, carpenters, plumbers on larger jobs',
    categories: ['Labour', 'Materials', 'Plant & Equipment', 'Subcontractors', 'Preliminaries', 'Contingency'],
  },
  {
    id: 'fixed',
    name: 'Fixed price',
    description: 'Single price with scope description and inclusions',
    best_for: 'Painters, landscapers, well-defined scope jobs',
    categories: ['Scope items'],
  },
  {
    id: 'rate',
    name: 'Rate-based',
    description: 'Per-unit rates that bundle labour and materials',
    best_for: 'Electricians, plumbers, tilers with standard rates',
    categories: ['Installation rates', 'Service rates', 'Allowances'],
  },
  {
    id: 'dayrate',
    name: 'Day rate',
    description: 'Days on site plus materials allowance',
    best_for: 'Handymen, variable-scope jobs',
    categories: ['Day rates', 'Materials allowance', 'Other'],
  },
]

const DEFAULT_CONDITIONS = `Payment terms: As per milestone schedule agreed in scope.
Variations: Any changes to scope must be agreed in writing before work proceeds.
Access: Client to ensure clear site access on agreed start date.
Materials: All materials remain property of contractor until paid in full.
Weather delays: Timeline subject to reasonable weather conditions.
Defects liability: 90 days from practical completion, as per scope agreement.
Dispute resolution: Steadyhand mediation in first instance.
GST: All prices inclusive of GST unless otherwise stated.`

const BLANK_ITEM = (category: string) => ({ category, label: '', quantity: '1', unit: 'lot', unit_price: '', amount: '' })

export default function TradieJobPage() {
  const [user, setUser] = useState<any>(null)
  const [proposedSlots, setProposedSlots] = useState(['','',''])
  const [proposingConsult, setProposingConsult] = useState(false)
  const [consultSent, setConsultSent] = useState(false)
  const [savingSlots, setSavingSlots] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [progressNote, setProgressNote] = useState('')
  const [sendingNote, setSendingNote] = useState(false)
  const [noteSent, setNoteSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState<string|null>(null)
  const [quoteSubmitted, setQuoteSubmitted] = useState(false)
  const [warrantyIssues, setWarrantyIssues] = useState<any[]>([])
  const [respondingTo, setRespondingTo] = useState<string|null>(null)
  const [guideSlide, setGuideSlide] = useState(0)
  const [responseForm, setResponseForm] = useState<Record<string,string>>({})
  const [activeTemplate, setActiveTemplate] = useState<string>('detailed')
  const [sharedDocs, setSharedDocs] = useState<any[]>([])
  const [cocFile, setCocFile] = useState<File|null>(null)
  const [uploadingCoc, setUploadingCoc] = useState(false)
  const [cocError, setCocError] = useState<string|null>(null)
  const [cocUploaded, setCocUploaded] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    estimated_start: '',
    estimated_days: '',
    conditions: DEFAULT_CONDITIONS,
    lineItems: [BLANK_ITEM('Labour'), BLANK_ITEM('Materials')],
  })

  const currentQuote = quotes[0] || null
  const template = TEMPLATES.find(t => t.id === activeTemplate) || TEMPLATES[0]

  const calcTotal = () => quoteForm.lineItems.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.unit_price)) || 0
    return sum + amt
  }, 0)

  const updateLineItem = (i: number, field: string, value: string) => {
    setQuoteForm(f => {
      const updated = [...f.lineItems]
      updated[i] = { ...updated[i], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(field === 'quantity' ? value : updated[i].quantity) || 0
        const price = parseFloat(field === 'unit_price' ? value : updated[i].unit_price) || 0
        if (qty && price) updated[i].amount = (qty * price).toFixed(2)
      }
      return { ...f, lineItems: updated }
    })
  }

  const addLineItem = (category: string) => {
    setQuoteForm(f => ({ ...f, lineItems: [...f.lineItems, BLANK_ITEM(category)] }))
  }

  const removeLineItem = (i: number) => {
    setQuoteForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }))
  }

  const switchTemplate = (templateId: string) => {
    const t = TEMPLATES.find(t => t.id === templateId)!
    setActiveTemplate(templateId)
    setShowTemplates(false)
    localStorage.setItem('sh_preferred_template', templateId)
    setQuoteForm(f => ({
      ...f,
      lineItems: f.lineItems.length > 0 ? f.lineItems.map(item => ({
        ...item,
        category: t.categories.includes(item.category) ? item.category : t.categories[0]
      })) : [BLANK_ITEM(t.categories[0])]
    }))
  }

  useEffect(() => {
    const saved = localStorage.getItem('sh_preferred_template')
    if (saved && TEMPLATES.find(t => t.id === saved)) setActiveTemplate(saved)
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const params = new URLSearchParams(window.location.search)
      const jobId = params.get('id')
      if (!jobId) { window.location.href = '/tradie/dashboard'; return }
      const { data: jobData } = await supabase.from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
        .eq('id', jobId).single()
      setJob(jobData)
      const { data: scopeData } = await supabase.from('scope_agreements').select('*').eq('job_id', jobId).maybeSingle()
      setScope(scopeData)
      const { data: qs } = await supabase.from('quotes').select('*').eq('job_id', jobId).order('created_at', { ascending: false })
      setQuotes(qs || [])
      const { data: ms } = await supabase.from('milestones').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setMilestones(ms || [])
      setLoading(false)
    })
  }, [])

  const profileComplete = !!(
    job?.tradie?.business_name &&
    (job?.tradie?.trade_categories || []).length > 0
  )

  const submitQuote = async () => {
    const total = calcTotal()
    if (!job || total === 0) return
    setSubmittingQuote(true)
    const supabase = createClient()
    const latestVersion = quotes.length > 0 ? quotes[0].version + 1 : 1
    const breakdown = quoteForm.lineItems
      .filter(item => item.label && item.amount)
      .map(item => ({ label: item.label, amount: parseFloat(item.amount), category: item.category }))
    const { data: quote, error: quoteInsertError } = await supabase.from('quotes').insert({
      job_id: job.id,
      tradie_id: user.id,
      version: latestVersion,
      total_price: total,
      breakdown: breakdown.length > 0 ? breakdown : null,
      estimated_start: quoteForm.estimated_start || null,
      estimated_days: quoteForm.estimated_days ? Number(quoteForm.estimated_days) : null,
      conditions: quoteForm.conditions || null,
    }).select().single()
    if (quoteInsertError || !quote) {
      setQuoteError('Failed to submit quote — please check your connection and try again.')
      setSubmittingQuote(false)
      return
    }
    if (quote) {
      setQuotes(prev => [quote, ...prev])
      const supabase2 = createClient()
      await supabase2.from('job_messages').insert({
        job_id: job.id,
        sender_id: user.id,
        body: 'Quote v' + latestVersion + ' submitted: $' + total.toLocaleString() + (quoteForm.estimated_days ? ' · Est. ' + quoteForm.estimated_days + ' days' : '') + (quoteForm.estimated_start ? ' · Starting ' + new Date(quoteForm.estimated_start).toLocaleDateString('en-AU') : ''),
      })
      // Move job to compare stage so client sees quote is ready
      await fetch('/api/jobs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, status: 'compare', only_if_status: ['shortlisted', 'matching', 'consult'] }),
      })
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quote_submitted', job_id: job.id }),
      })
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quote_submitted', job_id: job.id }),
      })
    }
    setShowQuoteForm(false)
    setSubmittingQuote(false)
    setTimeout(() => setQuoteSubmitted(true), 100)
  }

  const respondToIssue = async (issueId: string) => {
    const response = responseForm[issueId]
    if (!response?.trim()) return
    const supabase = createClient()
    await supabase.from('warranty_issues').update({
      tradie_response: response,
      tradie_responded_at: new Date().toISOString(),
      status: 'in_progress',
    }).eq('id', issueId)
    // Check if response was within 24 hours and add encouragement
    const issue = warrantyIssues.find((i: any) => i.id === issueId)
    if (issue) {
      const hrs = (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60)
      if (hrs < 24) {
        const supabase2 = createClient()
        await supabase2.from('job_messages').insert({
          job_id: job.id,
          sender_id: user.id,
          body: '⚡ The tradie responded to this warranty issue within 24 hours — above the Steadyhand standard. This has been recorded in their Dialogue Rating.',
        })
      }
    }
    setWarrantyIssues(prev => prev.map((i: any) => i.id === issueId ? { ...i, tradie_response: response, tradie_responded_at: new Date().toISOString(), status: 'in_progress' } : i))
    setRespondingTo(null)
    setResponseForm(prev => ({ ...prev, [issueId]: '' }))
  }

  // Derive tradie's current stage at component level
  const hasQuote = quotes && quotes.length > 0
  const scopeSigned = scope && scope.tradie_signed_at
  const allMilestonesApproved = milestones.length > 0 && milestones.every((m: any) => m.status === 'approved')
  const inWarranty = job && ['warranty', 'complete'].includes(job.status)

  const uploadCoc = async () => {
    if (!cocFile || !job) return
    setUploadingCoc(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const ext = cocFile.name.split('.').pop()
    const path = 'vault/coc/' + job.id + '/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('Documents').upload(path, cocFile)
    if (error) {
      setCocError('Upload failed — the Documents bucket may be missing or have no upload policy.')
      setUploadingCoc(false)
      return
    }
    setCocError(null)
    if (!error) {
      const { data: signedData } = await supabase.storage.from('Documents').createSignedUrl(path, 60 * 60 * 24 * 365)
      const file_url = signedData?.signedUrl || null
      // Save to vault under client's user_id
      await supabase.from('vault_documents').insert({
        user_id: job.client_id,
        job_id: job.id,
        job_title: job.title,
        title: (job.tradie?.business_name || 'Tradie') + ' — Certificate of compliance — ' + job.title,
        document_type: 'compliance',
        tradie_name: job.tradie?.business_name || null,
        issued_date: new Date().toISOString().split('T')[0],
        file_url,
        file_name: cocFile.name,
        diy_project_id: job.diy_project_id || null,
        phase: 'close-out',
      })
      // Post message confirming upload
      await supabase.from('job_messages').insert({
        job_id: job.id,
        sender_id: session?.user.id,
        body: (job.tradie?.business_name || 'Tradie') + ' has uploaded the certificate of compliance for this job. It has been saved to the client vault.',
      })
      setCocUploaded(true)
    }
    setUploadingCoc(false)
  }
  const currentStageN = !job ? 1 : inWarranty ? 6
    : allMilestonesApproved && job.status === 'signoff' ? 5
    : milestones.length > 0 && job.status === 'delivery' ? 4
    : scopeSigned && job.status === 'delivery' ? 4
    : scopeSigned ? 3
    : hasQuote ? 2
    : 1

  const sendProgressNote = async () => {
    if (!progressNote.trim() || !job) return
    setSendingNote(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: session?.user.id,
      body: '📋 Progress update: ' + progressNote.trim(),
    })
    setProgressNote('')
    setNoteSent(true)
    setTimeout(() => setNoteSent(false), 3000)
    setSendingNote(false)
  }

  const submitMilestone = async (milestone: any) => {
    const supabase = createClient()
    await supabase.from('milestones').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', milestone.id)
    setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, status: 'submitted' } : m))
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'milestone_submitted', job_id: job.id }),
    })
  }

  const inp = { width: '100%', padding: '9px 11px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '7px', fontSize: '13px', background: '#F4F8F7', color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' as const }
  const total = calcTotal()

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}><p style={{ color: '#4A5E64' }}>Loading...</p></div>
  if (!job) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}><p style={{ color: '#4A5E64' }}>Job not found.</p></div>

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', textDecoration: 'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Back to dashboard</a>
      </nav>

      {/* TRADIE STAGE RAIL */}
      {(() => {
        const TRADIE_STAGES = [
          {n:1,l:'Request',  c:'#2E7D60'},
          {n:2,l:'Match',    c:'#2E6A8F'},
          {n:3,l:'Consult',  c:'#9B6B9B'},
          {n:4,l:'Quote',    c:'#7B5EA7'},
          {n:5,l:'Agreement',c:'#6B4FA8'},
          {n:6,l:'Build',    c:'#C07830'},
          {n:7,l:'Sign off', c:'#D4522A'},
          {n:8,l:'Warranty', c:'#1A6B5A'},
        ]
        // Determine tradie's actual stage based on their actions (not job status)
        const hasQuote = quotes && quotes.length > 0
        const scopeSigned = scope && scope.tradie_signed_at
        const allMilestonesApproved = milestones.length > 0 && milestones.every((m: any) => m.status === 'approved')
        const inWarranty = ['warranty', 'complete'].includes(job.status)
        const currentStageN = inWarranty ? 8
          : job.status === 'signoff' ? 7
          : (milestones.length > 0 || job.status === 'delivery') ? 6
          : (scopeSigned || job.status === 'agreement') ? 5
          : (hasQuote || job.status === 'compare') ? 4
          : job.status === 'consult' || job.status === 'assess' ? 3
          : job.status === 'shortlisted' ? 2
          : 1
        return (
          <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
            {TRADIE_STAGES.map(s => {
              const isComplete = s.n < currentStageN
              const isCurrent = s.n === currentStageN
              return (
                <div key={s.n} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', position:'relative' as const }}>
                  {isCurrent && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
                  <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (isComplete ? '#2E7D60' : isCurrent ? s.c : 'rgba(28,43,50,0.2)'), background: isComplete ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color: isComplete ? 'white' : isCurrent ? s.c : '#7A9098' }}>
                    {isComplete ? '✓' : s.n}
                  </div>
                  <div style={{ fontSize:'12px', color: isCurrent ? '#0A0A0A' : isComplete ? '#2E7D60' : '#7A9098', fontWeight: isCurrent ? 600 : 400 }}>{s.l}</div>
                </div>
              )
            })}
          </div>
        )
      })()}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46,125,96,0.08)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#2E7D60', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Tradie view</span>
        </div>

        {/* CONSULT STAGE GUIDANCE — SLIDER */}
        {currentStageN === 1 && (() => {
          const slides = [
            {
              icon: '👋',
              title: 'You have been invited to quote',
              body: job.client?.full_name + ' has asked Steadyhand to match them with a trade business for this job. Before submitting a quote, both parties complete a site consult.',
              action: null,
            },
            {
              icon: '📋',
              title: 'How the consult works',
              body: 'Arrange a time to visit the site. Record your observations in the consult form — what you saw, scope considerations, and your quote assumptions. Share your notes with the client and acknowledge theirs.',
              action: null,
            },
            {
              icon: '🛡',
              title: 'Why it matters',
              body: 'Your consult notes become part of the permanent job record. They protect you from scope creep and disputes later — and build your Dialogue Rating.',
              action: null,
            },
          ]
          const slide = slides[guideSlide]
          return (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ background:'#9B6B9B', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'white', letterSpacing:'0.5px', margin:0 }}>CONSULT STAGE</p>
                <div style={{ display:'flex', gap:'5px' }}>
                  {slides.map((_, i) => (
                    <div key={i} onClick={() => setGuideSlide(i)}
                      style={{ width: i === guideSlide ? '18px' : '6px', height:'6px', borderRadius:'3px', background: i === guideSlide ? 'white' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.2s' }} />
                  ))}
                </div>
              </div>
              <div style={{ padding:'20px' }}>
                <div style={{ fontSize:'28px', marginBottom:'10px' }}>{slide.icon}</div>
                <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', marginBottom:'8px' }}>{slide.title}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'16px' }}>{slide.body}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {guideSlide > 0 && (
                      <button type="button" onClick={() => setGuideSlide(g => g - 1)}
                        style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'6px 12px', cursor:'pointer' }}>
                        ← Back
                      </button>
                    )}
                    {guideSlide < slides.length - 1 && (
                      <button type="button" onClick={() => setGuideSlide(g => g + 1)}
                        style={{ fontSize:'12px', color:'#9B6B9B', background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontWeight:500 }}>
                        Next →
                      </button>
                    )}
                  </div>
                  {guideSlide === slides.length - 1 && !consultSent && !proposingConsult && (
                    <button type="button" onClick={() => setProposingConsult(true)}
                      style={{ background:'#9B6B9B', color:'white', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                      Propose consult times →
                    </button>
                  )}
                  {guideSlide === slides.length - 1 && proposingConsult && !consultSent && (
                    <div style={{ marginTop:'12px', background:'rgba(155,107,155,0.06)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'10px', padding:'14px' }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#9B6B9B', marginBottom:'10px' }}>Suggest up to 3 times — the client will confirm which suits them</p>
                      <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'12px' }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontSize:'11px', color:'#7A9098', width:'56px', flexShrink:0 }}>Option {i+1}{i===0?' *':''}</span>
                            <input type="datetime-local" value={proposedSlots[i]}
                              onChange={e => { const s = [...proposedSlots]; s[i] = e.target.value; setProposedSlots(s) }}
                              min={new Date().toISOString().slice(0,16)}
                              style={{ flex:1, padding:'7px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'12px', background:'#F4F8F7', color:'#0A0A0A', outline:'none' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button type="button" onClick={async () => {
                          const filled = proposedSlots.filter(s => s.trim())
                          if (!filled.length) return
                          setSavingSlots(true)
                          const supabase = createClient()
                          const { data: existing } = await supabase.from('site_assessments').select('id').eq('job_id', job.id).single()
                          const slotData = { job_id: job.id, proposed_slots: filled, consult_date: filled[0], slot_proposed_by: 'tradie' }
                          if (existing) {
                            await supabase.from('site_assessments').update(slotData).eq('job_id', job.id)
                          } else {
                            await supabase.from('site_assessments').insert(slotData)
                          }
                          const slotLines = filled.map((s, i) => 'Option ' + (i+1) + ': ' + new Date(s).toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long' }) + ' at ' + new Date(s).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })).join(', ')
                          await supabase.from('job_messages').insert({
                            job_id: job.id,
                            sender_id: user?.id,
                            body: 'Consult times proposed: ' + slotLines + '. Please confirm via the Consult page.',
                          })
                          await fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'consult_ready', job_id: job.id }) })
                          setSavingSlots(false)
                          setConsultSent(true)
                          setProposingConsult(false)
                        }} disabled={!proposedSlots[0] || savingSlots}
                          style={{ flex:1, background:'#9B6B9B', color:'white', padding:'9px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !proposedSlots[0] || savingSlots ? 0.5 : 1 }}>
                          {savingSlots ? 'Sending...' : 'Send times to client →'}
                        </button>
                        <button type="button" onClick={() => setProposingConsult(false)}
                          style={{ background:'transparent', color:'#7A9098', padding:'9px 14px', borderRadius:'7px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {consultSent && (
                    <div style={{ marginTop:'12px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'12px 14px' }}>
                      <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:'0 0 4px' }}>✓ Times sent to client</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:'0 0 10px' }}>After the site visit, record your observations in the Consult page and share them with the client before quoting.</p>
                      <a href="/consult" style={{ fontSize:'12px', color:'#9B6B9B', fontWeight:500, textDecoration:'none' }}>Go to Consult page to write your notes →</a>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding:'10px 16px 14px', borderTop:'1px solid rgba(28,43,50,0.06)' }}>
                <button type="button" onClick={async () => {
                  const supabase = createClient()
                  await supabase.from('site_assessments').upsert({
                    job_id: job.id,
                    client_shared_at: null,
                    tradie_shared_at: null,
                    client_acknowledged_at: null,
                    tradie_acknowledged_at: null,
                    tradie_observations: 'Consult skipped — quote submitted without site visit.',
                  }, { onConflict: 'job_id' })
                  await supabase.from('jobs').update({ status: 'shortlisted' }).eq('id', job.id)
                  await supabase.from('job_messages').insert({
                    job_id: job.id,
                    sender_id: user.id,
                    body: '⚠ Consult skipped — ' + (job.tradie?.business_name || 'Tradie') + ' has proceeded directly to quoting without a site consult.',
                  })
                  window.location.reload()
                }}
                  style={{ fontSize:'12px', color:'#9AA5AA', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                  Skip consult and go straight to quoting
                </button>
              </div>
            </div>
          )
        })()}

        {/* QUOTE STAGE GUIDANCE */}
        {currentStageN === 2 && !currentQuote && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(192,120,48,0.2)', borderLeft:'3px solid #C07830', borderRadius:'10px', padding:'16px 18px', marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#C07830', letterSpacing:'0.5px', marginBottom:'8px' }}>QUOTE STAGE</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'8px' }}>
              You are ready to build and submit your quote. Use the builder below to itemise your pricing — labour, materials, and any other costs.
            </p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7' }}>
              A detailed breakdown helps the client understand your pricing and reduces scope disputes later. The client will compare your quote with others — you will be notified when they respond.
            </p>
          </div>
        )}
        <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '24px', color: '#0A0A0A', letterSpacing: '1.5px', marginBottom: '4px' }}>{job.title}</h1>
        <p style={{ fontSize: '14px', color: '#7A9098', marginBottom: '24px' }}>{job.trade_category} · {job.suburb} · {job.client?.full_name}</p>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' as const, color: '#7A9098', marginBottom: '8px', fontWeight: 500 }}>Job description</p>
          <p style={{ fontSize: '14px', color: '#0A0A0A', lineHeight: '1.65', marginBottom: '12px' }}>{job.description}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {job.budget_range && <span style={{ fontSize: '12px', color: '#4A5E64', background: '#C8D5D2', padding: '3px 10px', borderRadius: '6px' }}>Budget: {job.budget_range}</span>}
            {job.urgency && <span style={{ fontSize: '12px', color: '#C07830', background: 'rgba(192,120,48,0.08)', border: '1px solid rgba(192,120,48,0.2)', padding: '3px 10px', borderRadius: '6px' }}>⏱ {job.urgency}</span>}
            {job.property_type && <span style={{ fontSize: '12px', color: '#4A5E64', background: '#C8D5D2', padding: '3px 10px', borderRadius: '6px' }}>{job.property_type}</span>}
            <span style={{ fontSize: '12px', color: '#4A5E64', background: '#C8D5D2', padding: '3px 10px', borderRadius: '6px' }}>{job.suburb}</span>
          </div>
        </div>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '10px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#0A0A0A', letterSpacing: '0.5px', marginBottom: '2px' }}>QUOTE</p>
              <p style={{ fontSize: '12px', color: '#7A9098' }}>{currentQuote ? 'Version ' + currentQuote.version + ' · ' + new Date(currentQuote.created_at).toLocaleDateString('en-AU') : 'No quote submitted yet'}</p>
            </div>
            {['agreement','delivery','signoff','warranty','complete'].includes(job?.status) ? (
              <span style={{ fontSize:'12px', color:'#2E7D60', background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'6px', padding:'7px 14px' }}>
                ✓ Quote accepted
              </span>
            ) : (
              <button type="button" onClick={() => setShowQuoteForm(!showQuoteForm)}
                style={{ background: showQuoteForm ? 'rgba(28,43,50,0.08)' : '#2E7D60', color: showQuoteForm ? '#0A0A0A' : 'white', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                {showQuoteForm ? 'Cancel' : currentQuote ? 'Revise quote' : 'Build quote →'}
              </button>
            )}
          </div>

          {/* Certificate of compliance upload */}
              {(job?.status === 'signoff' || job?.status === 'warranty' || job?.status === 'complete') && (
                <div style={{ background: cocUploaded ? 'rgba(46,125,96,0.08)' : 'rgba(107,79,168,0.06)', border:'1px solid ' + (cocUploaded ? 'rgba(46,125,96,0.25)' : 'rgba(107,79,168,0.2)'), borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color: cocUploaded ? '#2E7D60' : '#6B4FA8', marginBottom:'6px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>
                    {cocUploaded ? '✓ Certificate of compliance uploaded' : 'Certificate of compliance required'}
                  </p>
                  {!cocUploaded && (
                    <>
                      <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', marginBottom:'10px', lineHeight:'1.5' }}>
                        The client requires your certificate of compliance for this job. Upload it here — it will be saved directly to their Document Vault.
                      </p>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => setCocFile(e.target.files?.[0] || null)}
                          style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)', flex:1 }} />
                        <button type="button" onClick={uploadCoc} disabled={!cocFile || uploadingCoc}
                          style={{ background: !cocFile || uploadingCoc ? 'rgba(107,79,168,0.3)' : '#6B4FA8', color:'white', border:'none', borderRadius:'7px', padding:'7px 14px', fontSize:'12px', fontWeight:500, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' as const }}>
                          {uploadingCoc ? 'Uploading...' : 'Upload →'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

          {/* Decline quote request */}
          {!currentQuote && !quoteSubmitted && !showQuoteForm && job?.status === 'shortlisted' && (
            <div style={{ padding:'0 20px 12px' }}>
              <button type="button" onClick={async () => {
                if (!confirm('Decline this quote request? The client will be notified.')) return
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                const { data: qr } = await supabase.from('quote_requests').select('id').eq('job_id', job.id).eq('tradie_id', session?.user.id).single()
                if (qr) await supabase.from('quote_requests').update({ status: 'declined' }).eq('id', qr.id)
                await supabase.from('job_messages').insert({
                  job_id: job.id,
                  sender_id: session?.user.id,
                  body: (job?.tradie?.business_name || 'The tradie') + ' has declined to quote on this job.',
                })
                window.location.href = '/tradie/dashboard'
              }} style={{ fontSize:'12px', color:'#9AA5AA', background:'none', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'6px', padding:'6px 12px', cursor:'pointer' }}>
                Decline this quote request
              </button>
            </div>
          )}

          {quoteSubmitted && (
            <div style={{ padding:'20px' }}>
              <div style={{ textAlign:'center' as const, padding:'24px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'12px', marginBottom:'16px' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>✅</div>
                <p style={{ fontSize:'16px', fontWeight:500, color:'#2E7D60', marginBottom:'6px' }}>Quote submitted successfully</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6' }}>The client will review your quote and respond by email. This usually takes 1-2 business days.</p>
              </div>
              <div style={{ background:'#F4F8F7', borderRadius:'10px', padding:'16px', marginBottom:'16px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'10px' }}>While you wait</p>
                {[
                  { step:'✓', text:'Confirm your availability for the estimated start date — if circumstances change, message the client now rather than later.', action: null },
                  { step:'✓', text:'Check your licence and insurance are current — the client may ask before signing the scope agreement.', action: null },
                  { step:'✓', text:'Review the job description once more — if you have spotted anything that may affect your price, send a message to the client before they accept.', action: null },
                  { step:'✓', text:'If 3 business days pass without a response, it is reasonable to follow up via the job thread.', action: null },
                ].map(s => (
                  <div key={s.step} style={{ display:'flex', gap:'10px', marginBottom:'8px', alignItems:'flex-start' }}>
                    <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#2E7D60', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', fontWeight:600, flexShrink:0, marginTop:'1px' }}>{s.step}</div>
                    <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.5', margin:0 }}>{s.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <a href="/tradie/dashboard" style={{ flex:1 }}>
                  <button type="button" style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                    Back to dashboard
                  </button>
                </a>
                <button type="button" onClick={() => { setQuoteSubmitted(false); setShowQuoteForm(true) }}
                  style={{ flex:1, background:'transparent', color:'#2E6A8F', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(46,106,143,0.3)', cursor:'pointer' }}>
                  Revise quote
                </button>
              </div>
            </div>
          )}

          {currentQuote && !showQuoteForm && !quoteSubmitted && job?.status === 'compare' && (
            <div style={{ margin:'0 20px 12px', background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'18px', flexShrink:0 }}>⏳</span>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#C07830', margin:'0 0 2px' }}>Waiting for client to accept your quote</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>The client is reviewing quotes. You will be notified by email when they respond.</p>
              </div>
            </div>
          )}

          {currentQuote && !showQuoteForm && !quoteSubmitted && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '32px', color: '#0A0A0A' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                <span style={{ fontSize: '13px', color: '#9AA5AA' }}>AUD inc. GST</span>
              </div>
              {currentQuote.breakdown?.length > 0 && (
                <div style={{ background: '#F4F8F7', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                  {currentQuote.breakdown.map((b: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(28,43,50,0.06)', fontSize: '13px' }}>
                      <span style={{ color: '#4A5E64' }}>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                      <span style={{ fontWeight: 500, color: '#0A0A0A' }}>${Number(b.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#E8F0EE', fontSize: '13px', fontWeight: 600 }}>
                    <span>Total</span><span>${Number(currentQuote.total_price).toLocaleString()}</span>
                  </div>
                </div>
              )}
              {currentQuote.estimated_start && <p style={{ fontSize: '13px', color: '#4A5E64', marginBottom: '4px' }}>Start: {new Date(currentQuote.estimated_start).toLocaleDateString('en-AU')}</p>}
              {currentQuote.estimated_days && <p style={{ fontSize: '13px', color: '#4A5E64' }}>Duration: {currentQuote.estimated_days} days</p>}
            </div>
          )}

          {showQuoteForm && (
            <div style={{ padding: '20px' }}>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A', margin: '0 0 2px' }}>Quote style: <span style={{ color: '#2E7D60' }}>{template.name}</span></p>
                    <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>{template.description}</p>
                  </div>
                  <button type="button" onClick={() => setShowTemplates(!showTemplates)}
                    style={{ fontSize: '12px', color: '#2E6A8F', background: 'rgba(46,106,143,0.08)', border: '1px solid rgba(46,106,143,0.2)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>
                    {showTemplates ? 'Close' : 'Change style →'}
                  </button>
                </div>

                {showTemplates && (
                  <div className='form-2col' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {TEMPLATES.map(t => (
                      <div key={t.id} onClick={() => switchTemplate(t.id)}
                        style={{ padding: '12px', background: activeTemplate === t.id ? 'rgba(46,106,143,0.08)' : '#C8D5D2', border: '1.5px solid ' + (activeTemplate === t.id ? '#2E6A8F' : 'rgba(28,43,50,0.1)'), borderRadius: '8px', cursor: 'pointer' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: activeTemplate === t.id ? '#2E6A8F' : '#0A0A0A', margin: '0 0 3px' }}>{t.name}</p>
                        <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 4px', lineHeight: '1.4' }}>{t.description}</p>
                        <p style={{ fontSize: '10px', color: '#9AA5AA', margin: 0 }}>Best for: {t.best_for}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(46,125,96,0.06)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#2E7D60', margin: 0, lineHeight: '1.6' }}>
                  A detailed breakdown helps clients understand your pricing and reduces disputes later. Your total calculates automatically from your line items.
                </p>
              </div>

              {template.categories.map(cat => {
                const items = quoteForm.lineItems.map((item, i) => ({ ...item, i })).filter(item => item.category === cat)
                return (
                  <div key={cat} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0A', letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: 0 }}>{cat}</p>
                      <button type="button" onClick={() => addLineItem(cat)}
                        style={{ fontSize: '11px', color: '#2E7D60', background: 'rgba(46,125,96,0.08)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
                        + Add
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <div style={{ padding: '10px', background: 'rgba(28,43,50,0.03)', borderRadius: '6px', border: '1px dashed rgba(28,43,50,0.1)', textAlign: 'center' as const }}>
                        <span style={{ fontSize: '12px', color: '#9AA5AA' }}>No {cat.toLowerCase()} items — click + Add</span>
                      </div>
                    ) : (
                      <>
                        <div className='quote-grid-row quote-header' style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '4px', marginBottom: '4px' }}>
                          {['Description', 'Qty', 'Unit', 'Unit $', 'Total', ''].map(h => (
                            <p key={h} style={{ fontSize: '10px', color: '#9AA5AA', margin: 0, padding: '0 2px' }}>{h}</p>
                          ))}
                        </div>
                        {items.map(item => (
                          <div key={item.i} className='quote-grid-row' style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '4px', marginBottom: '5px', alignItems: 'center' }}>
                            <input type="text" placeholder="Description" value={item.label} onChange={e => updateLineItem(item.i, 'label', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            <div style={{ display:'flex', flexDirection:'column' as const, gap:'2px' }}>
                              <span className="quote-field-label" style={{ fontSize:'9px', color:'#9AA5AA', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'none' }}>Qty</span>
                              <input type="number" placeholder="1" value={item.quantity} onChange={e => updateLineItem(item.i, 'quantity', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            </div>
                            <div style={{ display:'flex', flexDirection:'column' as const, gap:'2px' }}>
                              <span className="quote-field-label" style={{ fontSize:'9px', color:'#9AA5AA', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'none' }}>Unit</span>
                              <select value={item.unit} onChange={e => updateLineItem(item.i, 'unit', e.target.value)} style={{ ...inp, marginBottom: 0, padding: '9px 4px' }}>
                                {['hrs', 'days', 'wks', 'lot', 'm', 'm²', 'm³', 'each', 'kg', 'L'].map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column' as const, gap:'2px' }}>
                              <span className="quote-field-label" style={{ fontSize:'9px', color:'#9AA5AA', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'none' }}>Unit $</span>
                              <input type="number" placeholder="0.00" value={item.unit_price} onChange={e => updateLineItem(item.i, 'unit_price', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            </div>
                            <div style={{ display:'flex', flexDirection:'column' as const, gap:'2px' }}>
                              <span className="quote-field-label" style={{ fontSize:'9px', color:'#9AA5AA', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'none' }}>Total</span>
                              <input type="number" placeholder="0.00" value={item.amount} onChange={e => updateLineItem(item.i, 'amount', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            </div>
                            <button type="button" onClick={() => removeLineItem(item.i)} style={{ background: 'none', border: 'none', color: '#D4522A', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )
              })}

              <div style={{ background: 'rgba(28,43,50,0.04)', borderRadius: '8px', padding: '4px 0', marginBottom: '4px' }}>
                {quoteForm.lineItems.filter(item => !template.categories.includes(item.category)).length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(28,43,50,0.06)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: '0 0 8px' }}>Other items</p>
                    {quoteForm.lineItems.map((item, i) => !template.categories.includes(item.category) && (
                      <div key={i} className='quote-grid-row' style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '4px', marginBottom: '5px', alignItems: 'center' }}>
                        <input type="text" value={item.label} onChange={e => updateLineItem(i, 'label', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <input type="number" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <select value={item.unit} onChange={e => updateLineItem(i, 'unit', e.target.value)} style={{ ...inp, marginBottom: 0, padding: '9px 4px' }}>
                          {['hrs', 'days', 'lot', 'm', 'm²', 'each', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input type="number" value={item.unit_price} onChange={e => updateLineItem(i, 'unit_price', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <input type="number" value={item.amount} onChange={e => updateLineItem(i, 'amount', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <button type="button" onClick={() => removeLineItem(i)} style={{ background: 'none', border: 'none', color: '#D4522A', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: '#0A0A0A', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'rgba(216,228,225,0.6)' }}>Total (inc. GST)</span>
                <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: total > 0 ? 'rgba(216,228,225,0.9)' : 'rgba(216,228,225,0.3)' }}>
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className='form-2col' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0A0A0A', marginBottom: '5px' }}>Estimated start date</label>
                  <input type="date" value={quoteForm.estimated_start} onChange={e => setQuoteForm(f => ({ ...f, estimated_start: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0A0A0A', marginBottom: '5px' }}>Estimated duration (days)</label>
                  <input type="number" placeholder="14" value={quoteForm.estimated_days} onChange={e => setQuoteForm(f => ({ ...f, estimated_days: e.target.value }))} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A' }}>Terms and conditions</label>
                  <span style={{ fontSize: '11px', color: '#7A9098' }}>WA defaults · edit as needed</span>
                </div>
                <textarea value={quoteForm.conditions} onChange={e => setQuoteForm(f => ({ ...f, conditions: e.target.value }))} rows={8} style={{ ...inp, resize: 'vertical' as const, lineHeight: '1.6', fontSize: '12px' }} />
              </div>

              <div style={{ background: 'rgba(192,120,48,0.06)', border: '1px solid rgba(192,120,48,0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#C07830', marginBottom: '4px', letterSpacing: '0.5px' }}>BEFORE YOU SUBMIT</p>
                <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.6', margin: 0 }}>
                  Check your line items cover all materials, travel, contingency and margin. Underquoting leads to disputes later. A well-structured quote is more likely to be accepted.
                </p>
              </div>

              <button type="button" onClick={submitQuote} disabled={submittingQuote || total === 0}
                style={{ width: '100%', background: '#2E7D60', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: submittingQuote || total === 0 ? 0.6 : 1 }}>
                {submittingQuote ? 'Submitting...' : 'Submit quote — $' + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' →'}
              </button>
            </div>
          )}
        </div>


        {quotes.length > 1 && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#0A0A0A', letterSpacing: '0.5px', marginBottom: '2px' }}>QUOTE VERSION HISTORY</p>
              <p style={{ fontSize: '12px', color: '#7A9098' }}>Full revision trail — visible to both parties</p>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {quotes.map((q, i) => (
                <div key={q.id} style={{ marginBottom: i < quotes.length - 1 ? '16px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: i === 0 ? '#2E7D60' : 'rgba(28,43,50,0.1)', color: i === 0 ? 'white' : '#7A9098', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px' }}>
                        {i === 0 ? 'CURRENT · v' + q.version : 'v' + q.version}
                      </div>
                      <span style={{ fontSize: '12px', color: '#7A9098' }}>{new Date(q.created_at).toLocaleDateString('en-AU')} at {new Date(q.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '18px', color: i === 0 ? '#0A0A0A' : '#7A9098' }}>${Number(q.total_price).toLocaleString()}</span>
                  </div>
                  {q.breakdown?.length > 0 && (
                    <div style={{ background: i === 0 ? '#F4F8F7' : 'rgba(28,43,50,0.03)', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                      {q.breakdown.map((b: any, bi: number) => {
                        const prev = i < quotes.length - 1 ? quotes[i + 1].breakdown?.find((pb: any) => pb.label === b.label) : null
                        const changed = prev && prev.amount !== b.amount
                        const isNew = i < quotes.length - 1 && !quotes[i + 1].breakdown?.find((pb: any) => pb.label === b.label)
                        return (
                          <div key={bi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid rgba(28,43,50,0.05)', background: isNew ? 'rgba(46,125,96,0.04)' : changed ? 'rgba(192,120,48,0.04)' : 'transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isNew && <span style={{ fontSize: '9px', background: 'rgba(46,125,96,0.1)', color: '#2E7D60', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>NEW</span>}
                              {changed && <span style={{ fontSize: '9px', background: 'rgba(192,120,48,0.1)', color: '#C07830', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>CHANGED</span>}
                              <span style={{ fontSize: '12px', color: '#4A5E64' }}>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                            </div>
                            <div style={{ textAlign: 'right' as const }}>
                              <span style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A' }}>${Number(b.amount).toLocaleString()}</span>
                              {changed && prev && <p style={{ fontSize: '10px', color: '#C07830', margin: 0 }}>was ${Number(prev.amount).toLocaleString()}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {q.conditions && i > 0 && q.conditions !== quotes[i-1]?.conditions && (
                    <div style={{ background: 'rgba(192,120,48,0.04)', border: '1px solid rgba(192,120,48,0.15)', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 600, color: '#C07830', margin: '0 0 3px', letterSpacing: '0.5px' }}>TERMS UPDATED</p>
                      <p style={{ fontSize: '11px', color: '#4A5E64', margin: 0 }}>Conditions were revised in this version.</p>
                    </div>
                  )}
                  {i < quotes.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 0' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(28,43,50,0.08)' }} />
                      <span style={{ fontSize: '10px', color: '#9AA5AA' }}>previous version</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(28,43,50,0.08)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agreement stage — show draft prompt if no scope yet */}
        {(job?.status === 'agreement' || job?.status === 'compare') && !scope && (
          <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'14px', padding:'24px', marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#6B4FA8', letterSpacing:'0.5px', margin:'0 0 8px' }}>SCOPE AGREEMENT — ACTION REQUIRED</p>
            <p style={{ fontSize:'14px', fontWeight:500, color:'#0A0A0A', margin:'0 0 8px' }}>Your client has accepted your quote and is waiting for the scope agreement</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 16px' }}>
              Draft the scope agreement below. This defines what is included, what is excluded, the payment milestones and warranty terms. Your client will be notified to review and sign.
            </p>
            <button type="button" onClick={() => {
                window.location.href = '/agreement?from_job=' + (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : '')
              }} style={{ display:'inline-block', background:'#6B4FA8', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Draft scope agreement →
              </button>
          </div>
        )}

        {scope && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#0A0A0A', letterSpacing: '0.5px', marginBottom: '10px' }}>SCOPE AGREEMENT</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, padding: '10px', background: scope.tradie_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (scope.tradie_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius: '8px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px' }}>Tradie</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: scope.tradie_signed_at ? '#2E7D60' : '#0A0A0A', margin: 0 }}>{scope.tradie_signed_at ? '✓ Signed' : 'Not signed'}</p>
              </div>
              <div style={{ flex: 1, padding: '10px', background: scope.client_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (scope.client_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius: '8px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px' }}>Client</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: scope.client_signed_at ? '#2E7D60' : '#0A0A0A', margin: 0 }}>{scope.client_signed_at ? '✓ Signed' : 'Not signed'}</p>
              </div>
            </div>
            {!scope.tradie_signed_at ? (
              <a href={'/agreement?from_job=' + (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : '')}>
                <button type="button" style={{ width: '100%', background: '#6B4FA8', color: 'white', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                  Go to agreement page to sign →
                </button>
              </a>
            ) : scope.client_signed_at ? (
              <div style={{ background: 'rgba(46,125,96,0.06)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ fontSize: '12px', color: '#2E7D60', margin: 0 }}>✓ Fully signed — work can begin</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(192,120,48,0.06)', border: '1px solid rgba(192,120,48,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ fontSize: '12px', color: '#C07830', margin: 0 }}>⏳ Waiting for client to sign before work begins</p>
              </div>
            )}
          </div>
        )}

        {milestones.length > 0 && scope?.client_signed_at && scope?.tradie_signed_at && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: 'rgba(216,228,225,0.9)', letterSpacing: '0.5px', marginBottom: '4px' }}>DELIVERY</p>
              <p style={{ fontSize: '12px', color: 'rgba(216,228,225,0.5)', margin: 0 }}>Mark each milestone complete when done — client approves and payment releases automatically</p>
            </div>

            {(() => {
              const approved = milestones.filter(m => m.status === 'approved').length
              const total = milestones.length
              const pct = Math.round((approved / total) * 100)
              return (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#F4F8F7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#4A5E64' }}>{approved} of {total} milestones approved</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A' }}>{pct}% complete</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(28,43,50,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#2E7D60' : '#C07830', borderRadius: '100px', transition: 'width 0.3s' }} />
                  </div>
                  {currentQuote && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#7A9098' }}>Total contract value</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ padding: '16px 20px' }}>
              {milestones.map((m, i) => {
                const isActive = m.status === 'pending' && (i === 0 || milestones[i-1]?.status === 'approved')
                const isLocked = m.status === 'pending' && i > 0 && milestones[i-1]?.status !== 'approved'
                const payment = currentQuote ? Math.round(Number(currentQuote.total_price) * m.percent / 100) : 0
                return (
                  <div key={m.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(28,43,50,0.06)', opacity: isLocked ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: m.status === 'approved' ? '#2E7D60' : isActive ? '#C07830' : 'rgba(28,43,50,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', flexShrink: 0 }}>
                            {m.status === 'approved' ? '✓' : i + 1}
                          </div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A', margin: 0 }}>{m.label}</p>
                        </div>
                        <p style={{ fontSize: '12px', color: '#7A9098', marginBottom: '4px', paddingLeft: '28px' }}>{m.description}</p>
                        <p style={{ fontSize: '12px', color: '#4A5E64', paddingLeft: '28px' }}>
                          {m.percent}% · {payment > 0 ? '$' + payment.toLocaleString() + ' payment' : ''}
                          {m.status === 'approved' && m.approved_at ? ' · Approved ' + new Date(m.approved_at).toLocaleDateString('en-AU') : ''}
                          {m.status === 'submitted' && m.submitted_at ? ' · Submitted ' + new Date(m.submitted_at).toLocaleDateString('en-AU') : ''}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                        {m.status === 'approved' && (
                          <div>
                            <span style={{ fontSize: '12px', color: '#2E7D60', fontWeight: 500 }}>✓ Approved</span>
                            <p style={{ fontSize: '11px', color: '#7A9098', margin: '2px 0 0' }}>Payment released</p>
                          </div>
                        )}
                        {m.status === 'submitted' && (
                          <div>
                            <span style={{ fontSize: '11px', color: '#C07830', fontWeight: 500 }}>⏳ Awaiting client approval</span>
                            <p style={{ fontSize: '11px', color: '#7A9098', margin: '2px 0 0' }}>Payment pending</p>
                          </div>
                        )}
                        {isActive && (
                          <button type="button" onClick={() => submitMilestone(m)}
                            style={{ background: '#2E7D60', color: 'white', padding: '9px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                            Mark complete →
                          </button>
                        )}
                        {isLocked && (
                          <span style={{ fontSize: '11px', color: '#9AA5AA' }}>Complete previous milestone first</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PROGRESS / HANDOVER NOTES */}
            {!['warranty','complete'].includes(job?.status) && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(28,43,50,0.08)', background: '#F4F8F7' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A', marginBottom: '6px', letterSpacing: '0.3px' }}>Post a progress update</p>
                <p style={{ fontSize: '11px', color: '#7A9098', marginBottom: '10px' }}>Keep the client informed as work progresses — updates are added to the job thread.</p>
                <textarea value={progressNote} onChange={e => setProgressNote(e.target.value)}
                  placeholder="e.g. First fix wiring complete — all cable runs installed, ready for wall lining..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', color: '#0A0A0A', background: 'white', outline: 'none', resize: 'vertical' as const, minHeight: '72px', fontFamily: 'sans-serif', boxSizing: 'border-box' as const }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={sendProgressNote} disabled={!progressNote.trim() || sendingNote}
                    style={{ background: noteSent ? '#2E7D60' : '#0A0A0A', color: 'white', padding: '9px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: !progressNote.trim() ? 'not-allowed' : 'pointer', opacity: !progressNote.trim() ? 0.5 : 1 }}>
                    {noteSent ? '✓ Sent' : sendingNote ? 'Sending...' : 'Send update →'}
                  </button>
                </div>
              </div>
            )}
            {['warranty','complete'].includes(job?.status) && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(28,43,50,0.08)', background: '#F4F8F7' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A', marginBottom: '6px', letterSpacing: '0.3px' }}>Write a handover note</p>
                <p style={{ fontSize: '11px', color: '#7A9098', marginBottom: '10px' }}>Summarise the completed work for the client — this becomes part of the permanent job record and supports your warranty obligations.</p>
                <textarea value={progressNote} onChange={e => setProgressNote(e.target.value)}
                  placeholder="e.g. All works completed as per scope. Circuits tested and certified. Switchboard labelled. Please find compliance certificate in the document vault..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', color: '#0A0A0A', background: 'white', outline: 'none', resize: 'vertical' as const, minHeight: '96px', fontFamily: 'sans-serif', boxSizing: 'border-box' as const }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={sendProgressNote} disabled={!progressNote.trim() || sendingNote}
                    style={{ background: noteSent ? '#2E7D60' : '#0A0A0A', color: 'white', padding: '9px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: !progressNote.trim() ? 'not-allowed' : 'pointer', opacity: !progressNote.trim() ? 0.5 : 1 }}>
                    {noteSent ? '✓ Sent' : sendingNote ? 'Sending...' : 'Send handover note →'}
                  </button>
                </div>
              </div>
            )}

            {milestones.every(m => m.status === 'approved') && (
              <div style={{ padding: '20px', background: 'rgba(46,125,96,0.06)', borderTop: '1px solid rgba(46,125,96,0.15)' }}>
                <div style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                  <p style={{ fontSize: '16px', fontWeight: 500, color: '#2E7D60', marginBottom: '4px' }}>All milestones complete</p>
                  <p style={{ fontSize: '13px', color: '#4A5E64' }}>The client will now complete a final sign-off. Once signed off, your warranty period begins.</p>
                </div>
                <div style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' as const }}>What happens next</p>
                  {[
                    'The client reviews the completed work and signs off',
                    'Your warranty period begins from the sign-off date',
                    'Any warranty issues must be responded to within 5 business days',
                    'Your Steadyhand profile is updated with this completed job',
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#2E7D60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 600, flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                      <p style={{ fontSize: '12px', color: '#4A5E64', margin: 0, lineHeight: '1.5' }}>{step}</p>
                    </div>
                  ))}
                </div>
                <a href={"/messages?job=" + (job?.id || "")}>
                  <button type="button" style={{ width: '100%', background: '#0A0A0A', color: 'white', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                    Message the client →
                  </button>
                </a>
              </div>
            )}
          </div>
        )}

        {scope?.client_signed_at && scope?.tradie_signed_at && milestones.length === 0 && (
          <div style={{ background: 'rgba(192,120,48,0.06)', border: '1px solid rgba(192,120,48,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: '#C07830', fontWeight: 500, marginBottom: '4px' }}>⏳ Awaiting milestones</p>
            <p style={{ fontSize: '12px', color: '#4A5E64', margin: 0 }}>Milestones are set by the client on the agreement page. You will be notified when they are ready.</p>
          </div>
        )}

        {warrantyIssues.length > 0 && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#D4522A' }}>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: 'white', letterSpacing: '0.5px', marginBottom: '2px' }}>WARRANTY ISSUES</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>You must respond within 5 business days under Steadyhand warranty terms</p>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
              {warrantyIssues.map(issue => {
                const sevColor: Record<string,string> = { minor:'#7A9098', moderate:'#C07830', serious:'#D4522A', critical:'#6B4FA8' }
                const color = sevColor[issue.severity] || '#D4522A'
                const isOverdue = issue.response_due_at && new Date(issue.response_due_at) < new Date() && issue.status === 'open'
                return (
                  <div key={issue.id} style={{ background: '#F4F8F7', borderRadius: '10px', padding: '14px 16px', borderLeft: '3px solid ' + color }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: color + '18', border: '1px solid ' + color + '40', color, fontWeight: 500, textTransform: 'capitalize' as const }}>{issue.severity}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(28,43,50,0.06)', color: '#7A9098', textTransform: 'capitalize' as const }}>{issue.status}</span>
                      {isOverdue && <span style={{ fontSize: '11px', color: '#D4522A', fontWeight: 500 }}>⚠ Response overdue</span>}
                      <span style={{ fontSize: '11px', color: '#9AA5AA', marginLeft: 'auto' }}>Logged {new Date(issue.created_at).toLocaleDateString('en-AU')}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A', marginBottom: '4px' }}>{issue.title}</p>
                    <p style={{ fontSize: '13px', color: '#4A5E64', lineHeight: '1.55', marginBottom: '10px' }}>{issue.description}</p>
                    {issue.tradie_response ? (
                      <div style={{ background: 'rgba(46,125,96,0.06)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#2E7D60', marginBottom: '4px' }}>Your response · {new Date(issue.tradie_responded_at).toLocaleDateString('en-AU')}</p>
                        <p style={{ fontSize: '13px', color: '#4A5E64', margin: 0 }}>{issue.tradie_response}</p>
                        {issue.status === 'resolved' && <p style={{ fontSize: '11px', color: '#2E7D60', marginTop: '6px', fontWeight: 500 }}>✓ Client accepted resolution</p>}
                      </div>
                    ) : (
                      <div>
                        {respondingTo === issue.id ? (
                          <div>
                            <textarea
                              value={responseForm[issue.id] || ''}
                              onChange={e => setResponseForm(prev => ({ ...prev, [issue.id]: e.target.value }))}
                              rows={3} placeholder="Describe how you plan to address this issue and your proposed timeline..."
                              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', background: 'white', color: '#0A0A0A', outline: 'none', resize: 'vertical' as const, lineHeight: '1.5', boxSizing: 'border-box' as const, marginBottom: '8px', fontFamily: 'sans-serif' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="button" onClick={() => respondToIssue(issue.id)}
                                style={{ flex: 1, background: '#0A0A0A', color: 'white', padding: '9px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                                Submit response →
                              </button>
                              <button type="button" onClick={() => setRespondingTo(null)}
                                style={{ background: 'transparent', color: '#7A9098', padding: '9px 14px', borderRadius: '7px', fontSize: '12px', border: '1px solid rgba(28,43,50,0.15)', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setRespondingTo(issue.id)}
                            style={{ background: '#D4522A', color: 'white', padding: '9px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                            Respond to issue →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <a href={"/messages?job=" + (job?.id || "")} style={{ display: 'block', marginBottom: '20px', textDecoration: 'none' }}>
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '16px' }}>💬</span>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A', margin: 0 }}>Messages</p>
              <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>Chat with the client about this job →</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}