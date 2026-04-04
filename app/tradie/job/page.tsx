'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['Labour', 'Materials', 'Plant & Equipment', 'Subcontractors', 'Preliminaries', 'Contingency']

const DEFAULT_CONDITIONS = `Payment terms: As per milestone schedule agreed in scope.
Variations: Any changes to scope must be agreed in writing before work proceeds.
Access: Client to ensure clear site access on agreed start date.
Materials: All materials remain property of contractor until paid in full.
Weather delays: Timeline subject to reasonable weather conditions.
Defects liability: 90 days from practical completion, as per scope agreement.
Dispute resolution: Steadyhand mediation in first instance.
GST: All prices inclusive of GST unless otherwise stated.`

export default function TradieJobPage() {
  const [user, setUser] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    estimated_start: '',
    estimated_days: '',
    conditions: DEFAULT_CONDITIONS,
    lineItems: [
      { category: 'Labour', label: '', quantity: '1', unit: 'hrs', unit_price: '', amount: '' },
      { category: 'Materials', label: '', quantity: '1', unit: 'lot', unit_price: '', amount: '' },
    ],
  })

  const currentQuote = quotes[0] || null

  const calcTotal = () => {
    return quoteForm.lineItems.reduce((sum, item) => {
      const amt = parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.unit_price)) || 0
      return sum + amt
    }, 0)
  }

  const updateLineItem = (i: number, field: string, value: string) => {
    setQuoteForm(f => {
      const updated = [...f.lineItems]
      updated[i] = { ...updated[i], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(field === 'quantity' ? value : updated[i].quantity) || 0
        const price = parseFloat(field === 'unit_price' ? value : updated[i].unit_price) || 0
        updated[i].amount = qty && price ? (qty * price).toFixed(2) : updated[i].amount
      }
      return { ...f, lineItems: updated }
    })
  }

  const addLineItem = (category: string) => {
    setQuoteForm(f => ({
      ...f,
      lineItems: [...f.lineItems, { category, label: '', quantity: '1', unit: 'lot', unit_price: '', amount: '' }]
    }))
  }

  const removeLineItem = (i: number) => {
    setQuoteForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }))
  }

  useEffect(() => {
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
      await supabase.from('job_messages').insert({
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64', fontFamily: 'sans-serif' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64', fontFamily: 'sans-serif' }}>Job not found.</p>
    </div>
  )

  const total = calcTotal()

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', textDecoration: 'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Back to dashboard</a>
      </nav>

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
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', marginBottom: '2px' }}>QUOTE</p>
              <p style={{ fontSize: '12px', color: '#7A9098' }}>{currentQuote ? 'Version ' + currentQuote.version + ' submitted · ' + new Date(currentQuote.created_at).toLocaleDateString('en-AU') : 'No quote submitted yet'}</p>
            </div>
            <button type="button" onClick={() => setShowQuoteForm(!showQuoteForm)}
              style={{ background: showQuoteForm ? 'rgba(28,43,50,0.08)' : '#2E7D60', color: showQuoteForm ? '#1C2B32' : 'white', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              {showQuoteForm ? 'Cancel' : currentQuote ? 'Revise quote' : 'Build quote →'}
            </button>
          </div>

          {currentQuote && !showQuoteForm && (
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
                    <span>Total</span>
                    <span>${Number(currentQuote.total_price).toLocaleString()}</span>
                  </div>
                </div>
              )}
              {currentQuote.estimated_start && <p style={{ fontSize: '13px', color: '#4A5E64', marginBottom: '4px' }}>Start: {new Date(currentQuote.estimated_start).toLocaleDateString('en-AU')}</p>}
              {currentQuote.estimated_days && <p style={{ fontSize: '13px', color: '#4A5E64', marginBottom: '4px' }}>Duration: {currentQuote.estimated_days} days</p>}
            </div>
          )}

          {showQuoteForm && (
            <div style={{ padding: '20px' }}>
              <div style={{ background: 'rgba(46,125,96,0.06)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#2E7D60', margin: 0, lineHeight: '1.6' }}>
                  Build your quote line by line — a detailed breakdown helps clients understand your pricing and reduces disputes later. Your total will calculate automatically.
                </p>
              </div>

              {CATEGORIES.map(cat => {
                const items = quoteForm.lineItems.map((item, i) => ({ ...item, i })).filter(item => item.category === cat)
                return (
                  <div key={cat} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#1C2B32', letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: 0 }}>{cat}</p>
                      <button type="button" onClick={() => addLineItem(cat)}
                        style={{ fontSize: '11px', color: '#2E7D60', background: 'rgba(46,125,96,0.08)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
                        + Add
                      </button>
                    </div>
                    {items.length === 0 && (
                      <div style={{ padding: '10px', background: 'rgba(28,43,50,0.03)', borderRadius: '6px', border: '1px dashed rgba(28,43,50,0.1)', textAlign: 'center' as const }}>
                        <span style={{ fontSize: '12px', color: '#9AA5AA' }}>No {cat.toLowerCase()} items — click + Add to include</span>
                      </div>
                    )}
                    {items.map(item => (
                      <div key={item.i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 80px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                        <input type="text" placeholder="Description" value={item.label} onChange={e => updateLineItem(item.i, 'label', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateLineItem(item.i, 'quantity', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <select value={item.unit} onChange={e => updateLineItem(item.i, 'unit', e.target.value)} style={{ ...inp, marginBottom: 0, padding: '9px 4px' }}>
                          {['hrs', 'days', 'lot', 'm', 'm²', 'each', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input type="number" placeholder="Unit $" value={item.unit_price} onChange={e => updateLineItem(item.i, 'unit_price', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <input type="number" placeholder="Total" value={item.amount} onChange={e => updateLineItem(item.i, 'amount', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                        <button type="button" onClick={() => removeLineItem(item.i)} style={{ background: 'none', border: 'none', color: '#D4522A', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )
              })}

              <div style={{ background: '#1C2B32', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(216,228,225,0.7)' }}>Total (inc. GST)</span>
                <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: 'rgba(216,228,225,0.9)' }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                  <span style={{ fontSize: '11px', color: '#7A9098' }}>WA defaults pre-filled · edit as needed</span>
                </div>
                <textarea value={quoteForm.conditions} onChange={e => setQuoteForm(f => ({ ...f, conditions: e.target.value }))} rows={8} style={{ ...inp, resize: 'vertical' as const, lineHeight: '1.6', fontSize: '12px' }} />
              </div>

              <div style={{ background: 'rgba(192,120,48,0.06)', border: '1px solid rgba(192,120,48,0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#C07830', marginBottom: '4px', letterSpacing: '0.5px' }}>BEFORE YOU SUBMIT</p>
                <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.6', margin: 0 }}>
                  Check your line items cover all materials, travel, contingency and margin. Underquoting now leads to disputes later. A detailed, well-structured quote signals professionalism and is more likely to be accepted.
                </p>
              </div>

              <button type="button" onClick={submitQuote} disabled={submittingQuote || total === 0}
                style={{ width: '100%', background: '#2E7D60', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: submittingQuote || total === 0 ? 0.6 : 1 }}>
                {submittingQuote ? 'Submitting...' : 'Submit quote — $' + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' →'}
              </button>
            </div>
          )}
        </div>

        {milestones.length > 0 && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', marginBottom: '2px' }}>MILESTONES</p>
              <p style={{ fontSize: '12px', color: '#7A9098' }}>Submit each milestone when complete — client approves and payment releases</p>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {milestones.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(28,43,50,0.06)' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C2B32', marginBottom: '2px' }}>{m.label}</p>
                    <p style={{ fontSize: '12px', color: '#7A9098' }}>{m.percent}% · ${Math.round(Number(currentQuote?.total_price || 0) * m.percent / 100).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    {m.status === 'approved' && <span style={{ fontSize: '12px', color: '#2E7D60', fontWeight: 500 }}>✓ Approved</span>}
                    {m.status === 'submitted' && <span style={{ fontSize: '12px', color: '#C07830' }}>⏳ Awaiting approval</span>}
                    {m.status === 'pending' && (
                      <button type="button" onClick={() => submitMilestone(m)}
                        style={{ background: '#1C2B32', color: 'white', padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                        Mark complete →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scope && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', marginBottom: '10px' }}>SCOPE AGREEMENT</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, padding: '10px', background: scope.tradie_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (scope.tradie_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius: '8px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px' }}>Tradie</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: scope.tradie_signed_at ? '#2E7D60' : '#1C2B32', margin: 0 }}>{scope.tradie_signed_at ? '✓ Signed' : 'Not signed'}</p>
              </div>
              <div style={{ flex: 1, padding: '10px', background: scope.client_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (scope.client_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius: '8px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px' }}>Client</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: scope.client_signed_at ? '#2E7D60' : '#1C2B32', margin: 0 }}>{scope.client_signed_at ? '✓ Signed' : 'Not signed'}</p>
              </div>
            </div>
            {!scope.tradie_signed_at && (
              <a href="/agreement">
                <button type="button" style={{ width: '100%', marginTop: '12px', background: '#6B4FA8', color: 'white', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                  Go to agreement page to sign →
                </button>
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  )
}