'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DECLINE_REASONS = [
  'Too expensive',
  'Timeline doesn\'t work',
  'Went with another tradie',
  'Scope didn\'t match what I needed',
  'Tradie not available',
  'Other',
]

const STAGES = [
  { n:1, l:'Request', p:'/request' },
  { n:2, l:'Shortlist', p:'/shortlist' },
  { n:3, l:'Quotes', p:'/quotes' },
  { n:4, l:'Agreement', p:'/agreement' },
  { n:5, l:'Delivery', p:'/delivery' },
  { n:6, l:'Sign-off', p:'/signoff' },
  { n:7, l:'Warranty', p:'/warranty' },
]

export default function QuotesPage() {
  const [job, setJob] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [expandedQuote, setExpandedQuote] = useState<string|null>(null)
  const [decliningId, setDecliningId] = useState<string|null>(null)
  const [declineForm, setDeclineForm] = useState<Record<string, { reason: string; note: string }>>({})
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name)')
        .eq('client_id', session.user.id)
        .in('status', ['shortlisted', 'quotes', 'agreement', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])

        const { data: qs } = await supabase
          .from('quotes')
          .select('*, tradie:tradie_profiles(*, profile:profiles(full_name, email))')
          .eq('job_id', jobs[0].id)
          .order('created_at', { ascending: false })
        setQuotes(qs || [])

        const { data: qrs } = await supabase
          .from('quote_requests')
          .select('*, tradie:tradie_profiles(business_name, rating_avg, jobs_completed, licence_verified, insurance_verified)')
          .eq('job_id', jobs[0].id)
        setQuoteRequests(qrs || [])
      }
      setLoading(false)
    })
  }, [])

  const acceptQuote = async (quote: any) => {
    if (!job) return
    setAccepting(true)
    const supabase = createClient()
    await supabase.from('jobs').update({ tradie_id: quote.tradie_id, status: 'agreement' }).eq('id', job.id)
    await supabase.from('quote_requests').update({ status: 'accepted' }).eq('job_id', job.id).eq('tradie_id', quote.tradie_id)
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: user.id,
      body: 'Quote from ' + (quote.tradie?.business_name || 'tradie') + ' accepted — $' + Number(quote.total_price).toLocaleString() + '. Proceeding to scope agreement.',
    })
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tradie_selected', job_id: job.id }),
    }).catch(() => {})
    setAccepting(false)
    window.location.href = '/agreement'
  }

  const declineQuote = async (qr: any) => {
    const form = declineForm[qr.id]
    if (!form?.reason) return
    setDeclining(true)
    const supabase = createClient()
    const revisionDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    await supabase.from('quote_requests').update({
      status: 'declined',
      decline_reason: form.reason,
      decline_note: form.note || null,
      declined_at: new Date().toISOString(),
      revision_deadline: revisionDeadline,
    }).eq('id', qr.id)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quote_declined',
        job_id: job.id,
        tradie_id: qr.tradie_id,
        decline_reason: form.reason,
        decline_note: form.note,
        revision_deadline: revisionDeadline,
      }),
    }).catch(() => {})
    setQuoteRequests(prev => prev.map(q => q.id === qr.id ? { ...q, status: 'declined', decline_reason: form.reason } : q))
    setDecliningId(null)
    setDeclining(false)
  }

  const isPastStage = job && ['agreement', 'delivery', 'signoff', 'warranty', 'complete'].includes(job.status)
  const currentStage = 3

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', textDecoration: 'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>Back to dashboard</a>
      </nav>

      {/* STAGE RAIL */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(28,43,50,0.08)', padding: '0 24px', overflowX: 'auto' as const }}>
        <div style={{ display: 'flex', maxWidth: '900px', margin: '0 auto', gap: '4px' }}>
          {STAGES.map(s => {
            const done = s.n < currentStage
            const active = s.n === currentStage
            return (
              <a key={s.n} href={s.p} style={{ textDecoration: 'none', flex: 1, minWidth: '60px' }}>
                <div style={{ padding: '12px 4px', textAlign: 'center' as const, position: 'relative', borderBottom: active ? '2px solid #D4522A' : done ? '2px solid #2E7D60' : '2px solid transparent' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, background: done ? '#2E7D60' : active ? '#D4522A' : '#C8D5D2', color: done || active ? 'white' : '#7A9098', border: '1.5px solid ' + (done ? '#2E7D60' : active ? '#D4522A' : 'rgba(28,43,50,0.2)') }}>
                    {done ? '✓' : s.n}
                  </div>
                  <div style={{ fontSize: '10px', color: active ? '#1C2B32' : done ? '#2E7D60' : '#7A9098', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' as const }}>{s.l}</div>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(212,82,42,0.08)', border: '1px solid rgba(212,82,42,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#D4522A', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Stage 3</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#1C2B32', letterSpacing: '1.5px', marginBottom: '6px' }}>COMPARE QUOTES</h1>
        <p style={{ fontSize: '15px', color: '#4A5E64', fontWeight: 300, marginBottom: '28px', lineHeight: '1.6' }}>
          Review and compare quotes from your shortlisted tradies. Select the one that best fits your job — you can decline others with feedback so they can improve their approach.
        </p>

        {isPastStage && (
          <div style={{ background: 'rgba(212,82,42,0.06)', border: '1px solid rgba(212,82,42,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#D4522A', marginBottom: '6px' }}>You are reviewing Stage 3 — Quotes</p>
            <p style={{ fontSize: '12px', color: '#4A5E64', marginBottom: '12px' }}>This job has moved to the <strong>{job?.status}</strong> stage. The quote comparison below is read-only.</p>
            <a href={`/${job?.status === 'agreement' ? 'agreement' : job?.status === 'delivery' ? 'delivery' : job?.status === 'signoff' ? 'signoff' : 'warranty'}`}>
              <button type="button" style={{ background: '#D4522A', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Go to current stage →
              </button>
            </a>
          </div>
        )}

        {!job ? (
          <div style={{ textAlign: 'center' as const, padding: '48px', background: '#E8F0EE', borderRadius: '14px' }}>
            <p style={{ fontSize: '15px', color: '#4A5E64', marginBottom: '16px' }}>No job in the quotes stage.</p>
            <a href="/shortlist"><button type="button" style={{ background: '#1C2B32', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>Go to shortlist →</button></a>
          </div>
        ) : quotes.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '48px', background: '#E8F0EE', borderRadius: '14px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>⏳</div>
            <p style={{ fontSize: '15px', color: '#4A5E64', fontWeight: 500, marginBottom: '6px' }}>Waiting for quotes</p>
            <p style={{ fontSize: '13px', color: '#7A9098', marginBottom: '20px' }}>You've sent quote requests to {quoteRequests.length} tradie{quoteRequests.length !== 1 ? 's' : ''}. Quotes will appear here as they are submitted.</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              {quoteRequests.map(qr => (
                <div key={qr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#C8D5D2', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32' }}>{qr.tradie?.business_name}</span>
                  <span style={{ fontSize: '11px', color: '#C07830', background: 'rgba(192,120,48,0.1)', border: '1px solid rgba(192,120,48,0.3)', borderRadius: '100px', padding: '2px 8px' }}>Awaiting quote</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

            {/* SUMMARY COMPARISON ROW */}
            {quotes.length > 1 && (
              <div style={{ background: '#1C2B32', borderRadius: '14px', padding: '20px', marginBottom: '8px' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.6)', letterSpacing: '0.5px', marginBottom: '14px' }}>QUICK COMPARISON</p>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(quotes.length, 3)}, 1fr)`, gap: '12px' }}>
                  {quotes.slice(0, 3).map((q, i) => {
                    const isLowest = q.total_price === Math.min(...quotes.map((qq: any) => Number(qq.total_price)))
                    const qr = quoteRequests.find(r => r.tradie_id === q.tradie_id)
                    return (
                      <div key={q.id} style={{ background: isLowest ? 'rgba(46,125,96,0.15)' : 'rgba(216,228,225,0.06)', border: '1px solid ' + (isLowest ? 'rgba(46,125,96,0.3)' : 'rgba(216,228,225,0.1)'), borderRadius: '10px', padding: '14px' }}>
                        {isLowest && <p style={{ fontSize: '10px', color: '#2E7D60', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '6px' }}>LOWEST</p>}
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(216,228,225,0.9)', marginBottom: '4px' }}>{q.tradie?.business_name}</p>
                        <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: 'rgba(216,228,225,0.9)', marginBottom: '4px' }}>${Number(q.total_price).toLocaleString()}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(216,228,225,0.4)' }}>
                          {q.estimated_days ? q.estimated_days + ' days' : ''}
                          {q.estimated_days && qr?.tradie?.rating_avg ? ' · ' : ''}
                          {qr?.tradie?.rating_avg ? '⭐ ' + Number(qr.tradie.rating_avg).toFixed(1) : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FULL QUOTE CARDS */}
            {quotes.map(q => {
              const qr = quoteRequests.find(r => r.tradie_id === q.tradie_id)
              const isDeclined = qr?.status === 'declined'
              const isAccepted = qr?.status === 'accepted'
              const isExpanded = expandedQuote === q.id
              const isDeclining = decliningId === q.id
              const form = declineForm[qr?.id] || { reason: '', note: '' }

              return (
                <div key={q.id} style={{ background: '#E8F0EE', border: '1.5px solid ' + (isAccepted ? '#2E7D60' : isDeclined ? 'rgba(28,43,50,0.1)' : 'rgba(28,43,50,0.1)'), borderRadius: '14px', overflow: 'hidden', opacity: isDeclined ? 0.6 : 1 }}>

                  {/* QUOTE HEADER */}
                  <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
                        <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '16px', color: '#1C2B32', letterSpacing: '0.3px', margin: 0 }}>{q.tradie?.business_name}</p>
                        {isAccepted && <span style={{ fontSize: '11px', color: '#2E7D60', background: 'rgba(46,125,96,0.1)', border: '1px solid rgba(46,125,96,0.3)', borderRadius: '100px', padding: '2px 8px', fontWeight: 600 }}>✓ Selected</span>}
                        {isDeclined && <span style={{ fontSize: '11px', color: '#7A9098', background: 'rgba(28,43,50,0.06)', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '100px', padding: '2px 8px' }}>Declined</span>}
                        {qr?.tradie?.licence_verified && <span style={{ fontSize: '11px', color: '#2E7D60' }}>✓ Licence</span>}
                        {qr?.tradie?.insurance_verified && <span style={{ fontSize: '11px', color: '#2E7D60' }}>✓ Insurance</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
                        <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#1C2B32' }}>${Number(q.total_price).toLocaleString()}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: '2px' }}>
                          {q.estimated_start && <span style={{ fontSize: '12px', color: '#4A5E64' }}>Start: {new Date(q.estimated_start).toLocaleDateString('en-AU')}</span>}
                          {q.estimated_days && <span style={{ fontSize: '12px', color: '#4A5E64' }}>Duration: {q.estimated_days} days</span>}
                          {qr?.tradie?.rating_avg > 0 && <span style={{ fontSize: '12px', color: '#4A5E64' }}>⭐ {Number(qr.tradie.rating_avg).toFixed(1)} · {qr.tradie.jobs_completed} jobs</span>}
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setExpandedQuote(isExpanded ? null : q.id)}
                      style={{ fontSize: '12px', color: '#2E6A8F', background: 'rgba(46,106,143,0.08)', border: '1px solid rgba(46,106,143,0.2)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
                      {isExpanded ? 'Hide details' : 'View breakdown →'}
                    </button>
                  </div>

                  {/* EXPANDED BREAKDOWN */}
                  {isExpanded && q.breakdown?.length > 0 && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <div style={{ background: '#F4F8F7', borderRadius: '10px', overflow: 'hidden' }}>
                        {q.breakdown.map((b: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(28,43,50,0.05)' }}>
                            <span style={{ fontSize: '13px', color: '#4A5E64' }}>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32' }}>${Number(b.amount).toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#E8F0EE' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C2B32' }}>Total</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C2B32' }}>${Number(q.total_price).toLocaleString()}</span>
                        </div>
                      </div>
                      {q.conditions && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(28,43,50,0.04)', borderRadius: '8px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Terms & conditions</p>
                          <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.5', margin: 0 }}>{q.conditions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DECLINE FEEDBACK */}
                  {isDeclined && qr?.decline_reason && (
                    <div style={{ padding: '12px 20px', background: 'rgba(28,43,50,0.04)', borderTop: '1px solid rgba(28,43,50,0.08)' }}>
                      <p style={{ fontSize: '12px', color: '#7A9098', margin: 0 }}>Declined — {qr.decline_reason}{qr.decline_note ? ': ' + qr.decline_note : ''}</p>
                      {qr.revision_deadline && new Date(qr.revision_deadline) > new Date() && (
                        <p style={{ fontSize: '11px', color: '#C07830', marginTop: '4px' }}>Tradie can submit a revised quote until {new Date(qr.revision_deadline).toLocaleString('en-AU')}</p>
                      )}
                    </div>
                  )}

                  {/* DECLINE FORM */}
                  {isDeclining && !isPastStage && (
                    <div style={{ padding: '16px 20px', background: 'rgba(212,82,42,0.04)', borderTop: '1px solid rgba(212,82,42,0.15)' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32', marginBottom: '10px' }}>Why are you declining this quote?</p>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '12px' }}>
                        {DECLINE_REASONS.map(r => (
                          <button key={r} type="button" onClick={() => setDeclineForm(prev => ({ ...prev, [qr.id]: { ...prev[qr.id], reason: r } }))}
                            style={{ padding: '9px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'left' as const, border: '1.5px solid ' + (form.reason === r ? '#D4522A' : 'rgba(28,43,50,0.15)'), background: form.reason === r ? 'rgba(212,82,42,0.06)' : '#F4F8F7', color: form.reason === r ? '#D4522A' : '#4A5E64', cursor: 'pointer' }}>
                            {r}
                          </button>
                        ))}
                      </div>
                      <textarea value={form.note} onChange={e => setDeclineForm(prev => ({ ...prev, [qr.id]: { ...prev[qr.id], note: e.target.value } }))}
                        placeholder="Optional — any additional feedback for the tradie..."
                        rows={2} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', background: '#F4F8F7', color: '#1C2B32', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const, fontFamily: 'sans-serif', marginBottom: '10px' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => declineQuote(qr)} disabled={!form.reason || declining}
                          style={{ flex: 1, background: '#D4522A', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: !form.reason || declining ? 0.5 : 1 }}>
                          {declining ? 'Declining...' : 'Confirm decline →'}
                        </button>
                        <button type="button" onClick={() => setDecliningId(null)}
                          style={{ background: 'transparent', color: '#7A9098', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(28,43,50,0.15)', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  {!isDeclined && !isAccepted && !isPastStage && (
                    <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(28,43,50,0.08)', display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => acceptQuote(q)} disabled={accepting}
                        style={{ flex: 2, background: '#1C2B32', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: accepting ? 0.7 : 1 }}>
                        {accepting ? 'Accepting...' : 'Select this quote →'}
                      </button>
                      <button type="button" onClick={() => setDecliningId(isDeclining ? null : q.id)}
                        style={{ flex: 1, background: 'transparent', color: '#D4522A', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1.5px solid rgba(212,82,42,0.3)', cursor: 'pointer' }}>
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
