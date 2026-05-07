'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { StageRail } from '@/components/ui'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TEMPLATES = [
  {
    id: 'fixed',
    label: 'Fixed price',
    icon: '🔒',
    description: 'A single lump-sum price for the full scope. Best when the job is well-defined.',
    lines: [
      { description: 'Labour', amount: '' },
      { description: 'Materials', amount: '' },
      { description: 'Waste disposal', amount: '' },
    ],
  },
  {
    id: 'itemised',
    label: 'Itemised breakdown',
    icon: '📋',
    description: 'Line-by-line detail across trades, materials and costs. Best for larger jobs.',
    lines: [
      { description: 'Labour — site preparation', amount: '' },
      { description: 'Labour — installation', amount: '' },
      { description: 'Materials supply', amount: '' },
      { description: 'Equipment hire', amount: '' },
      { description: 'Waste removal', amount: '' },
    ],
  },
  {
    id: 'provisional',
    label: 'Provisional sum',
    icon: '⚠️',
    description: 'Fixed price with provisional items for unknowns. Best when scope has uncertainty.',
    lines: [
      { description: 'Labour (fixed)', amount: '' },
      { description: 'Materials (fixed)', amount: '' },
      { description: 'Provisional — contingency allowance', amount: '' },
    ],
  },
  {
    id: 'labour',
    label: 'Labour only',
    icon: '🔧',
    description: 'Priced on labour only — client supplies materials. Common for small trade jobs.',
    lines: [
      { description: 'Labour — standard rate', amount: '' },
      { description: 'Labour — specialist/after-hours', amount: '' },
      { description: 'Call-out fee', amount: '' },
    ],
  },
]

interface LineItem { description: string; amount: string }

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box' as const,
  background: 'white', border: '1px solid rgba(28,43,50,0.15)',
  borderRadius: '8px', padding: '10px 12px',
  fontSize: '13px', color: '#0A0A0A', outline: 'none',
  fontFamily: 'sans-serif',
}

export default function QuotePage() {
  const [profile, setProfile]               = useState<any>(null)
  const [job, setJob]                       = useState<any>(null)
  const [assessment, setAssessment]         = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [submitting, setSubmitting]         = useState(false)
  const [submitted, setSubmitted]           = useState(false)
  const [submitError, setSubmitError]       = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [lines, setLines]                   = useState<LineItem[]>([])
  const [conditions, setConditions]         = useState('')
  const [estimatedStart, setEstimatedStart] = useState('')
  const [estimatedDays, setEstimatedDays]   = useState('')
  const [gstIncluded, setGstIncluded]       = useState(true)
  const [validity, setValidity]             = useState('30')

  const totalRaw = lines.reduce((sum, l) => sum + (parseFloat(l.amount.replace(/,/g, '')) || 0), 0)
  const fmt = (n: number) => n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, role, tradie:tradie_profiles!tradie_profiles_id_fkey(id, business_name)')
        .eq('id', session.user.id).single()

      if (!prof || prof.role !== 'tradie') { window.location.href = '/dashboard'; return }
      setProfile(prof)

      const urlJobId = new URLSearchParams(window.location.search).get('job_id')
      let jobData: any = null

      if (urlJobId) {
        const { data: j } = await supabase
          .from('jobs')
          .select('*, client:profiles!jobs_client_id_fkey(full_name, suburb), tradie:tradie_profiles(business_name)')
          .eq('id', urlJobId).single()
        jobData = j
      }

      if (!jobData) {
        const { data: qrData } = await supabase
          .from('quote_requests')
          .select('job:jobs(*, client:profiles!jobs_client_id_fkey(full_name, suburb), tradie:tradie_profiles(business_name))')
          .eq('tradie_id', session.user.id)
          .not('status', 'eq', 'declined')
          .order('created_at', { ascending: false })
          .limit(1).single()
        jobData = (qrData as any)?.job
      }

      if (jobData) {
        setJob(jobData)
        const { data: a } = await supabase
          .from('site_assessments').select('*').eq('job_id', jobData.id).single()
        if (a) setAssessment(a)
      }
      setLoading(false)
    })
  }, [])

  const selectTemplate = (tid: string) => {
    const t = TEMPLATES.find(t => t.id === tid)
    if (!t) return
    setSelectedTemplate(tid)
    setLines(t.lines.map(l => ({ ...l })))
  }

  const updateLine = (i: number, field: 'description' | 'amount', val: string) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  const addLine = () => setLines(prev => [...prev, { description: '', amount: '' }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!job || totalRaw <= 0) { setSubmitError('Add at least one line item with an amount before submitting.'); return }
    setSubmitError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSubmitting(false); return }

    const breakdown = lines
      .filter(l => l.description || l.amount)
      .map(l => ({ description: l.description, amount: parseFloat(l.amount.replace(/,/g, '')) || 0 }))

    const { error: insertError } = await supabase.from('quotes').insert({
      job_id: job.id,
      tradie_id: profile.tradie?.id,
      total_price: totalRaw,
      breakdown,
      conditions: conditions || null,
      estimated_start: estimatedStart || null,
      estimated_days: estimatedDays ? parseInt(estimatedDays) : null,
      status: 'pending',
      version: 1,
    })

    if (insertError) {
      setSubmitError('Could not submit estimate: ' + insertError.message)
      setSubmitting(false)
      return
    }

    if (['consult', 'assess', 'shortlisted', 'compare'].includes(job.status)) {
      await supabase.from('jobs').update({ status: 'quote' }).eq('id', job.id)
    }

    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: session.user.id,
      body: (profile.tradie?.business_name || 'Your tradie') + ' has submitted an estimate of $' + fmt(totalRaw) + (gstIncluded ? ' inc. GST' : ' excl. GST') + '. You can review it and proceed to scope agreement and quote when ready.',
    })

    setSubmitted(true)
    setSubmitting(false)
  }

  const card: React.CSSProperties = { background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }
  const darkHdr: React.CSSProperties = { padding: '14px 20px', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
  const lbl: React.CSSProperties = { fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '12px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#4A5E64', fontFamily: 'sans-serif' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2' }}>
      <NavHeader profile={profile} isTradie={true} />
      <StageRail currentPath="/quote" jobStatus="quote" role="tradie" />
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px' }}>
        <div style={card}>
          <div style={darkHdr}><p style={lbl}>SUBMIT QUOTE</p></div>
          <div style={{ padding: '32px 24px', textAlign: 'center' as const }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0A', marginBottom: '8px' }}>No active job found</p>
            <p style={{ fontSize: '13px', color: '#7A9098', marginBottom: '24px' }}>Go to your dashboard to find an active job to quote on.</p>
            <a href="/tradie/dashboard" style={{ display: 'inline-block', background: '#0A0A0A', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>← Back to dashboard</a>
          </div>
        </div>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2' }}>
      <NavHeader profile={profile} isTradie={true} />
      <StageRail currentPath="/quote" jobStatus="quote" role="tradie" />
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px' }}>
        <div style={card}>
          <div style={darkHdr}><p style={lbl}>QUOTE SUBMITTED</p></div>
          <div style={{ padding: '40px 28px', textAlign: 'center' as const }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(46,125,96,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>✓</div>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#2E7D60', marginBottom: '8px' }}>Estimate submitted</p>
            <p style={{ fontSize: '13px', color: '#4A5E64', lineHeight: '1.7', marginBottom: '6px' }}>
              Your quote of <strong>${fmt(totalRaw)}</strong> {gstIncluded ? '(inc. GST)' : '(excl. GST)'} has been sent to <strong>{job.client?.full_name || 'the client'}</strong>.
            </p>
            <p style={{ fontSize: '13px', color: '#7A9098', lineHeight: '1.6', marginBottom: '28px' }}>
              They will receive a notification and can review your quote. Once they proceed to scope agreement, you will both move to the agreement stage to finalise the scope.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <a href={'/consult?job_id=' + job.id} style={{ display: 'inline-block', background: 'rgba(28,43,50,0.08)', color: '#0A0A0A', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>← Consult notes</a>
              <a href={'/messages?job=' + job.id} style={{ display: 'inline-block', background: 'rgba(46,106,143,0.12)', color: '#2E6A8F', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>Message thread</a>
              <a href={'/agreement?job_id=' + job.id} style={{ display: 'inline-block', background: '#0A0A0A', color: 'white', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>View scope agreement →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2' }}>
      <NavHeader profile={profile} isTradie={true} />
      <StageRail currentPath="/quote" jobStatus="quote" role="tradie" />

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '11px', color: '#7A9098', letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>ESTIMATE</p>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '26px', color: '#0A0A0A', margin: '0 0 4px', letterSpacing: '0.5px' }}>
            {job.title || (job.description || '').slice(0, 50) || 'Submit your estimate'}
          </h1>
          <p style={{ fontSize: '13px', color: '#7A9098', margin: 0 }}>
            {[job.trade_category, job.suburb || job.client?.suburb, 'for ' + (job.client?.full_name || 'client')].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Consult notes context */}
        {(assessment?.tradie_observations || assessment?.tradie_scope_notes || assessment?.tradie_quote_assumptions) && (
          <div style={{ background: 'rgba(155,107,155,0.06)', border: '1px solid rgba(155,107,155,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#9B6B9B', margin: '0 0 10px', letterSpacing: '0.3px' }}>YOUR CONSULT NOTES — for reference</p>
            {assessment.tradie_observations && <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.6', margin: '0 0 6px' }}><strong>Site observations:</strong> {assessment.tradie_observations}</p>}
            {assessment.tradie_scope_notes && <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.6', margin: '0 0 6px' }}><strong>Scope notes:</strong> {assessment.tradie_scope_notes}</p>}
            {assessment.tradie_quote_assumptions && <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.6', margin: 0 }}><strong>Quote assumptions noted:</strong> {assessment.tradie_quote_assumptions}</p>}
          </div>
        )}

        {/* Template picker */}
        {!selectedTemplate && (
          <div style={card}>
            <div style={darkHdr}>
              <p style={lbl}>CHOOSE A QUOTE FORMAT</p>
              <p style={{ fontSize: '11px', color: 'rgba(216,228,225,0.5)', margin: 0 }}>Pick the format that best fits this job</p>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: '12px' }}>
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => selectTemplate(t.id)}
                  style={{ background: 'white', border: '1.5px solid rgba(28,43,50,0.12)', borderRadius: '10px', padding: '16px 14px', textAlign: 'left' as const, cursor: 'pointer' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#7B5EA7')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(28,43,50,0.12)')}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>{t.icon}</div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A', margin: '0 0 4px' }}>{t.label}</p>
                  <p style={{ fontSize: '11px', color: '#7A9098', lineHeight: '1.5', margin: 0 }}>{t.description}</p>
                </button>
              ))}
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button type="button" onClick={() => { setSelectedTemplate('blank'); setLines([{ description: '', amount: '' }]) }}
                style={{ background: 'transparent', border: '1px dashed rgba(28,43,50,0.2)', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', color: '#7A9098', cursor: 'pointer', width: '100%' }}>
                Start from scratch (blank)
              </button>
            </div>
          </div>
        )}

        {/* Quote builder */}
        {selectedTemplate && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
              {selectedTemplate !== 'blank' && (
                <span style={{ background: 'rgba(123,94,167,0.1)', color: '#7B5EA7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                  {TEMPLATES.find(t => t.id === selectedTemplate)?.icon} {TEMPLATES.find(t => t.id === selectedTemplate)?.label}
                </span>
              )}
              <button type="button" onClick={() => { setSelectedTemplate(null); setLines([]) }}
                style={{ background: 'transparent', border: 'none', fontSize: '12px', color: '#7A9098', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}>
                Change format
              </button>
            </div>

            {/* Line items */}
            <div style={card}>
              <div style={darkHdr}>
                <p style={lbl}>QUOTE LINE ITEMS</p>
                <p style={{ fontSize: '11px', color: 'rgba(216,228,225,0.5)', margin: 0 }}>All amounts in AUD</p>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: '8px', marginBottom: '8px', padding: '0 2px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', margin: 0, letterSpacing: '0.3px' }}>DESCRIPTION</p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', margin: 0, letterSpacing: '0.3px', textAlign: 'right' as const }}>AMOUNT ($)</p>
                  <span />
                </div>
                {lines.map((line, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input type="text" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="e.g. Labour — installation" style={inp} />
                    <input type="text" inputMode="decimal" value={line.amount} onChange={e => updateLine(i, 'amount', e.target.value)} placeholder="0.00" style={{ ...inp, textAlign: 'right' as const }} />
                    <button type="button" onClick={() => removeLine(i)} style={{ background: 'transparent', border: 'none', color: '#D4522A', cursor: 'pointer', fontSize: '18px', padding: '2px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={addLine}
                  style={{ background: 'transparent', border: '1px dashed rgba(28,43,50,0.2)', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', color: '#4A5E64', cursor: 'pointer', width: '100%', marginTop: '4px' }}>
                  + Add line item
                </button>
                <div style={{ borderTop: '2px solid #0A0A0A', marginTop: '16px', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>TOTAL</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7A9098', cursor: 'pointer' }}>
                      <input type="checkbox" checked={gstIncluded} onChange={e => setGstIncluded(e.target.checked)} style={{ accentColor: '#7B5EA7', width: '14px', height: '14px' }} />
                      Inc. GST
                    </label>
                  </div>
                  <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '26px', color: '#0A0A0A', margin: 0 }}>${fmt(totalRaw)}</p>
                </div>
                {gstIncluded && totalRaw > 0 && (
                  <p style={{ fontSize: '11px', color: '#7A9098', textAlign: 'right' as const, margin: '4px 0 0' }}>
                    Includes GST of ${fmt(totalRaw / 11)}
                  </p>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div style={card}>
              <div style={darkHdr}>
                <p style={lbl}>CONDITIONS & ASSUMPTIONS</p>
                <p style={{ fontSize: '11px', color: 'rgba(216,228,225,0.5)', margin: 0 }}>Recommended</p>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.6', marginBottom: '10px' }}>
                  Note anything this quote assumes or excludes — access conditions, who supplies materials, what is not included, or any variations that would change the price.
                </p>
                <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={4}
                  placeholder="e.g. Client to supply tiles. Access required Mon–Fri 7am–5pm. Assumes no asbestos present. Excludes council permit fees. Price valid for 30 days."
                  style={{ ...inp, resize: 'vertical' as const }} />
              </div>
            </div>

            {/* Timing */}
            <div style={card}>
              <div style={darkHdr}>
                <p style={lbl}>TIMING</p>
                <p style={{ fontSize: '11px', color: 'rgba(216,228,225,0.5)', margin: 0 }}>Optional</p>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A', marginBottom: '6px' }}>Estimated start date</p>
                  <input type="date" value={estimatedStart} onChange={e => setEstimatedStart(e.target.value)} style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A', marginBottom: '6px' }}>Duration (working days)</p>
                  <input type="number" value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)} placeholder="e.g. 5" min="1" style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A', marginBottom: '6px' }}>Quote valid for (days)</p>
                  <input type="number" value={validity} onChange={e => setValidity(e.target.value)} placeholder="30" min="1" style={inp} />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: 'rgba(123,94,167,0.06)', border: '1px solid rgba(123,94,167,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#7B5EA7', margin: '0 0 10px', letterSpacing: '0.3px' }}>WHAT THE CLIENT WILL SEE</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' as const }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#4A5E64', margin: '0 0 4px' }}>From <strong>{profile?.tradie?.business_name || 'your business'}</strong></p>
                  <p style={{ fontSize: '12px', color: '#7A9098', margin: 0 }}>
                    {lines.filter(l => l.description).length} line item{lines.filter(l => l.description).length !== 1 ? 's' : ''}
                    {conditions ? ' · with conditions' : ''}
                    {estimatedStart ? ' · starts ' + new Date(estimatedStart).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#0A0A0A', margin: 0 }}>${fmt(totalRaw)}</p>
                  <p style={{ fontSize: '11px', color: '#7A9098', margin: '2px 0 0' }}>{gstIncluded ? 'inc. GST' : 'excl. GST'}</p>
                </div>
              </div>
            </div>

            {submitError && (
              <div style={{ background: 'rgba(212,82,42,0.08)', border: '1px solid rgba(212,82,42,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#D4522A', margin: 0 }}>{submitError}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' as const }}>
              <button type="button" onClick={handleSubmit} disabled={submitting || totalRaw <= 0}
                style={{ background: totalRaw > 0 ? '#7B5EA7' : 'rgba(28,43,50,0.2)', color: 'white', padding: '14px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: totalRaw > 0 ? 'pointer' : 'not-allowed', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit quote to ' + ((job.client?.full_name || '').split(' ')[0] || 'client') + ' →'}
              </button>
              <a href={'/consult?job_id=' + job.id} style={{ fontSize: '13px', color: '#7A9098', textDecoration: 'none' }}>← Back to consult</a>
            </div>
            {totalRaw <= 0 && <p style={{ fontSize: '12px', color: '#C07830', marginTop: '10px' }}>Add at least one line item amount before submitting.</p>}
          </>
        )}
      </div>
    </div>
  )
}
