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
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [quoteSubmitted, setQuoteSubmitted] = useState(false)
  const [warrantyIssues, setWarrantyIssues] = useState<any[]>([])
  const [respondingTo, setRespondingTo] = useState<string|null>(null)
  const [responseForm, setResponseForm] = useState<Record<string,string>>({})
  const [activeTemplate, setActiveTemplate] = useState<string>('detailed')
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
      if (!jobId) { setLoading(false); return }
      const { data: jobData } = await supabase.from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email, suburb)')
        .eq('id', jobId).single()
      setJob(jobData)
      const { data: scopeData } = await supabase.from('scope_agreements').select('*').eq('job_id', jobId).single()
      setScope(scopeData)
      const { data: qs } = await supabase.from('quotes').select('*').eq('job_id', jobId).order('created_at', { ascending: false })
      setQuotes(qs || [])
      const { data: ms } = await supabase.from('milestones').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
      setMilestones(ms || [])
      setLoading(false)
    })
  }, [])

  const submitQuote = async () => {
    const total = calcTotal()
    if (!job || total === 0) return
    setSubmittingQuote(true)
    const supabase = createClient()
    const latestVersion = quotes.length > 0 ? quotes[0].version + 1 : 1
    const breakdown = quoteForm.lineItems
      .filter(item => item.label && item.amount)
      .map(item => ({ label: item.label, amount: parseFloat(item.amount), category: item.category }))
    const { data: quote } = await supabase.from('quotes').insert({
      job_id: job.id,
      tradie_id: user.id,
      version: latestVersion,
      total_price: total,
      breakdown: breakdown.length > 0 ? breakdown : null,
      estimated_start: quoteForm.estimated_start || null,
      estimated_days: quoteForm.estimated_days ? Number(quoteForm.estimated_days) : null,
      conditions: quoteForm.conditions || null,
    }).select().single()
    if (quote) {
      setQuotes(prev => [quote, ...prev])
      const supabase2 = createClient()
      await supabase2.from('job_messages').insert({
        job_id: job.id,
        sender_id: user.id,
        body: 'Quote v' + latestVersion + ' submitted: $' + total.toLocaleString() + (quoteForm.estimated_days ? ' · Est. ' + quoteForm.estimated_days + ' days' : '') + (quoteForm.estimated_start ? ' · Starting ' + new Date(quoteForm.estimated_start).toLocaleDateString('en-AU') : ''),
      })
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quote_submitted', job_id: job.id }),
      }).catch(() => {})
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
          body: '⚡ The tradie responded to this warranty issue within 24 hours — above the Steadyhand standard. This has been recorded in their trust score.',
        })
      }
    }
    setWarrantyIssues(prev => prev.map((i: any) => i.id === issueId ? { ...i, tradie_response: response, tradie_responded_at: new Date().toISOString(), status: 'in_progress' } : i))
    setRespondingTo(null)
    setResponseForm(prev => ({ ...prev, [issueId]: '' }))
  }

  const submitMilestone = async (milestone: any) => {
    const supabase = createClient()
    await supabase.from('milestones').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', milestone.id)
    setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, status: 'submitted' } : m))
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'milestone_submitted', job_id: job.id }),
    }).catch(() => {})
  }

  const inp = { width: '100%', padding: '9px 11px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '7px', fontSize: '13px', background: '#F4F8F7', color: '#1C2B32', outline: 'none', boxSizing: 'border-box' as const }
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
          {n:1,l:'Assess',p:'assess',statuses:['assess','shortlisted','matching'],c:'#9B6B9B'},
          {n:2,l:'Quote',p:'quote',statuses:['quotes','shortlisted'],c:'#C07830'},
          {n:3,l:'Confirm',p:'confirm',statuses:['agreement'],c:'#6B4FA8'},
          {n:4,l:'Build',p:'build',statuses:['delivery'],c:'#C07830'},
          {n:5,l:'Complete',p:'complete',statuses:['signoff'],c:'#D4522A'},
          {n:6,l:'Protect',p:'protect',statuses:['warranty','complete'],c:'#1A6B5A'},
        ]
        const STAGE_ORDER = ['shortlisted','assess','quotes','agreement','delivery','signoff','warranty','complete']
        const jobIdx = STAGE_ORDER.indexOf(job.status)
        const currentStageN = jobIdx <= 1 ? 1 : jobIdx === 2 ? 2 : jobIdx === 3 ? 3 : jobIdx === 4 ? 4 : jobIdx === 5 ? 5 : 6
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
                  <div style={{ fontSize:'12px', color: isCurrent ? '#1C2B32' : isComplete ? '#2E7D60' : '#7A9098', fontWeight: isCurrent ? 600 : 400 }}>{s.l}</div>
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
        <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '24px', color: '#1C2B32', letterSpacing: '1.5px', marginBottom: '4px' }}>{job.title}</h1>
        <p style={{ fontSize: '14px', color: '#7A9098', marginBottom: '24px' }}>{job.trade_category} · {job.suburb} · {job.client?.full_name}</p>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' as const, color: '#7A9098', marginBottom: '8px', fontWeight: 500 }}>Job description</p>
          <p style={{ fontSize: '14px', color: '#1C2B32', lineHeight: '1.65', marginBottom: '12px' }}>{job.description}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {job.budget_range && <span style={{ fontSize: '12px', color: '#4A5E64', background: '#C8D5D2', padding: '3px 10px', borderRadius: '6px' }}>Budget: {job.budget_range}</span>}
            {job.property_type && <span style={{ fontSize: '12px', color: '#4A5E64', background: '#C8D5D2', padding: '3px 10px', borderRadius: '6px' }}>{job.property_type}</span>}
            <span style={{ fontSize: '12px', color: '#4A5E64', background: '#C8D5D2', padding: '3px 10px', borderRadius: '6px' }}>{job.suburb}</span>
          </div>
        </div>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '10px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', marginBottom: '2px' }}>QUOTE</p>
              <p style={{ fontSize: '12px', color: '#7A9098' }}>{currentQuote ? 'Version ' + currentQuote.version + ' · ' + new Date(currentQuote.created_at).toLocaleDateString('en-AU') : 'No quote submitted yet'}</p>
            </div>
            <button type="button" onClick={() => setShowQuoteForm(!showQuoteForm)}
              style={{ background: showQuoteForm ? 'rgba(28,43,50,0.08)' : '#2E7D60', color: showQuoteForm ? '#1C2B32' : 'white', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              {showQuoteForm ? 'Cancel' : currentQuote ? 'Revise quote' : 'Build quote →'}
            </button>
          </div>

          {quoteSubmitted && (
            <div style={{ padding:'20px' }}>
              <div style={{ textAlign:'center' as const, padding:'24px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'12px', marginBottom:'16px' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>✅</div>
                <p style={{ fontSize:'16px', fontWeight:500, color:'#2E7D60', marginBottom:'6px' }}>Quote submitted successfully</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6' }}>The client will review your quote and respond by email. This usually takes 1-2 business days.</p>
              </div>
              <div style={{ background:'#F4F8F7', borderRadius:'10px', padding:'16px', marginBottom:'16px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'10px' }}>What happens next</p>
                {[
                  { step:'1', text:'The client reviews your quote and may request changes or accept it.' },
                  { step:'2', text:'If accepted, you will both sign a scope agreement before work begins.' },
                  { step:'3', text:'Once signed, milestones are set and you can begin work.' },
                  { step:'4', text:'Payment is released at each milestone when the client approves.' },
                ].map(s => (
                  <div key={s.step} style={{ display:'flex', gap:'10px', marginBottom:'8px', alignItems:'flex-start' }}>
                    <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', fontWeight:600, flexShrink:0, marginTop:'1px' }}>{s.step}</div>
                    <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.5', margin:0 }}>{s.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <a href="/tradie/dashboard" style={{ flex:1 }}>
                  <button type="button" style={{ width:'100%', background:'#1C2B32', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
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

          {currentQuote && !showQuoteForm && !quoteSubmitted && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '32px', color: '#1C2B32' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                <span style={{ fontSize: '13px', color: '#9AA5AA' }}>AUD inc. GST</span>
              </div>
              {currentQuote.breakdown?.length > 0 && (
                <div style={{ background: '#F4F8F7', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                  {currentQuote.breakdown.map((b: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(28,43,50,0.06)', fontSize: '13px' }}>
                      <span style={{ color: '#4A5E64' }}>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                      <span style={{ fontWeight: 500, color: '#1C2B32' }}>${Number(b.amount).toLocaleString()}</span>
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
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1C2B32', margin: '0 0 2px' }}>Quote style: <span style={{ color: '#2E7D60' }}>{template.name}</span></p>
                    <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>{template.description}</p>
                  </div>
                  <button type="button" onClick={() => setShowTemplates(!showTemplates)}
                    style={{ fontSize: '12px', color: '#2E6A8F', background: 'rgba(46,106,143,0.08)', border: '1px solid rgba(46,106,143,0.2)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>
                    {showTemplates ? 'Close' : 'Change style →'}
                  </button>
                </div>

                {showTemplates && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {TEMPLATES.map(t => (
                      <div key={t.id} onClick={() => switchTemplate(t.id)}
                        style={{ padding: '12px', background: activeTemplate === t.id ? 'rgba(46,106,143,0.08)' : '#C8D5D2', border: '1.5px solid ' + (activeTemplate === t.id ? '#2E6A8F' : 'rgba(28,43,50,0.1)'), borderRadius: '8px', cursor: 'pointer' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: activeTemplate === t.id ? '#2E6A8F' : '#1C2B32', margin: '0 0 3px' }}>{t.name}</p>
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
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#1C2B32', letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: 0 }}>{cat}</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '4px', marginBottom: '4px' }}>
                          {['Description', 'Qty', 'Unit', 'Unit $', 'Total', ''].map(h => (
                            <p key={h} style={{ fontSize: '10px', color: '#9AA5AA', margin: 0, padding: '0 2px' }}>{h}</p>
                          ))}
                        </div>
                        {items.map(item => (
                          <div key={item.i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '4px', marginBottom: '5px', alignItems: 'center' }}>
                            <input type="text" placeholder="Description" value={item.label} onChange={e => updateLineItem(item.i, 'label', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            <input type="number" placeholder="1" value={item.quantity} onChange={e => updateLineItem(item.i, 'quantity', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            <select value={item.unit} onChange={e => updateLineItem(item.i, 'unit', e.target.value)} style={{ ...inp, marginBottom: 0, padding: '9px 4px' }}>
                              {['hrs', 'days', 'wks', 'lot', 'm', 'm²', 'm³', 'each', 'kg', 'L'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <input type="number" placeholder="0.00" value={item.unit_price} onChange={e => updateLineItem(item.i, 'unit_price', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                            <input type="number" placeholder="0.00" value={item.amount} onChange={e => updateLineItem(item.i, 'amount', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
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
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '4px', marginBottom: '5px', alignItems: 'center' }}>
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

              <div style={{ background: '#1C2B32', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'rgba(216,228,225,0.6)' }}>Total (inc. GST)</span>
                <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: total > 0 ? 'rgba(216,228,225,0.9)' : 'rgba(216,228,225,0.3)' }}>
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1C2B32', marginBottom: '5px' }}>Estimated start date</label>
                  <input type="date" value={quoteForm.estimated_start} onChange={e => setQuoteForm(f => ({ ...f, estimated_start: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#1C2B32', marginBottom: '5px' }}>Estimated duration (days)</label>
                  <input type="number" placeholder="14" value={quoteForm.estimated_days} onChange={e => setQuoteForm(f => ({ ...f, estimated_days: e.target.value }))} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32' }}>Terms and conditions</label>
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
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', marginBottom: '2px' }}>QUOTE VERSION HISTORY</p>
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
                    <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '18px', color: i === 0 ? '#1C2B32' : '#7A9098' }}>${Number(q.total_price).toLocaleString()}</span>
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
                              <span style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32' }}>${Number(b.amount).toLocaleString()}</span>
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

        {scope && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', marginBottom: '10px' }}>SCOPE AGREEMENT</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, padding: '10px', background: scope.tradie_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (scope.tradie_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius: '8px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px' }}>Tradie</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: scope.tradie_signed_at ? '#2E7D60' : '#1C2B32', margin: 0 }}>{scope.tradie_signed_at ? '✓ Signed' : 'Not signed'}</p>
              </div>
              <div style={{ flex: 1, padding: '10px', background: scope.client_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (scope.client_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius: '8px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px' }}>Client</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: scope.client_signed_at ? '#2E7D60' : '#1C2B32', margin: 0 }}>{scope.client_signed_at ? '✓ Signed' : 'Not signed'}</p>
              </div>
            </div>
            {!scope.tradie_signed_at ? (
              <a href="/agreement">
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#1C2B32' }}>
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
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32' }}>{pct}% complete</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(28,43,50,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#2E7D60' : '#C07830', borderRadius: '100px', transition: 'width 0.3s' }} />
                  </div>
                  {currentQuote && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#7A9098' }}>Total contract value</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
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
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C2B32', margin: 0 }}>{m.label}</p>
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
                  <button type="button" style={{ width: '100%', background: '#1C2B32', color: 'white', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
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
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C2B32', marginBottom: '4px' }}>{issue.title}</p>
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
                              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', background: 'white', color: '#1C2B32', outline: 'none', resize: 'vertical' as const, lineHeight: '1.5', boxSizing: 'border-box' as const, marginBottom: '8px', fontFamily: 'sans-serif' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="button" onClick={() => respondToIssue(issue.id)}
                                style={{ flex: 1, background: '#1C2B32', color: 'white', padding: '9px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
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
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1C2B32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '16px' }}>💬</span>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32', margin: 0 }}>Messages</p>
              <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>Chat with the client about this job →</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}