'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DECLINE_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'timeline', label: "Timeline doesn't work" },
  { value: 'went_with_other', label: 'Went with another tradie' },
  { value: 'scope_mismatch', label: "Scope didn't match my needs" },
  { value: 'no_response', label: 'Tradie did not respond' },
  { value: 'other', label: 'Other' },
]

export default function QuotesPage() {
  const [job, setJob] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuote, setExpandedQuote] = useState<string|null>(null)
  const [decliningId, setDecliningId] = useState<string|null>(null)
  const [declineForm, setDeclineForm] = useState<Record<string, { reason: string, note: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name)')
        .eq('client_id', session.user.id)
        .in('status', ['shortlisted', 'agreement', 'quotes', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: qrs } = await supabase
          .from('quote_requests')
          .select('*, tradie:tradie_profiles(*, profile:profiles(full_name, email))')
          .eq('job_id', jobs[0].id)
        setQuoteRequests(qrs || [])

        const tradieIds = (qrs || []).map((qr: any) => qr.tradie_id)
        if (tradieIds.length > 0) {
          const { data: qs } = await supabase
            .from('quotes')
            .select('*')
            .eq('job_id', jobs[0].id)
            .in('tradie_id', tradieIds)
            .order('created_at', { ascending: false })
          setQuotes(qs || [])
        }
      }
      setLoading(false)
    })
  }, [])

  const getLatestQuote = (tradieId: string) => {
    return quotes.filter(q => q.tradie_id === tradieId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }

  const acceptQuote = async (qr: any) => {
    const quote = getLatestQuote(qr.tradie_id)
    if (!quote || !job) return
    setAccepting(true)
    const supabase = createClient()
    await supabase.from('jobs').update({ tradie_id: qr.tradie_id, status: 'agreement' }).eq('id', job.id)
    await supabase.from('quote_requests').update({ status: 'accepted' }).eq('job_id', job.id).eq('tradie_id', qr.tradie_id)
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: 'Quote from ' + qr.tradie?.business_name + ' accepted — $' + Number(quote.total_price).toLocaleString() + '. Proceeding to scope agreement.',
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
    const form = declineForm[qr.tradie_id] || { reason: '', note: '' }
    if (!form.reason) return
    setSubmitting(true)
    const supabase = createClient()
    const revisionDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    await supabase.from('quote_requests').update({
      status: 'declined',
      decline_reason: form.reason,
      decline_note: form.note,
      declined_at: new Date().toISOString(),
      revision_deadline: revisionDeadline,
    }).eq('job_id', job.id).eq('tradie_id', qr.tradie_id)
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
    setQuoteRequests(prev => prev.map(q => q.tradie_id === qr.tradie_id ? { ...q, status: 'declined', decline_reason: form.reason, decline_note: form.note } : q))
    setDecliningId(null)
    setSubmitting(false)
  }

  const STAGE_ORDER = ['matching', 'shortlisted', 'assess', 'quotes', 'agreement', 'delivery', 'signoff', 'warranty', 'complete']
  const isPastQuotes = job ? STAGE_ORDER.indexOf(job.status) > STAGE_ORDER.indexOf('quotes') : false

  const receivedQuotes = quoteRequests.filter(qr => getLatestQuote(qr.tradie_id))
  const awaitingQuotes = quoteRequests.filter(qr => !getLatestQuote(qr.tradie_id) && qr.status === 'requested')
  const acceptedQR = quoteRequests.find(qr => qr.status === 'accepted')

  const sevColor: Record<string,string> = { minor:'#7A9098', moderate:'#C07830', serious:'#D4522A', critical:'#6B4FA8' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' as const }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No quotes to review yet.</p>
        <a href="/shortlist" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'14px' }}>← Back to shortlist</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false}   />

      {/* STAGE RAIL */}
      <div style={{ borderBottom:'1px solid rgba(28,43,50,0.1)', background:'rgba(200,213,210,0.95)', padding:'0 24px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', display:'flex', overflowX:'auto' as const }}>
          {[
            {n:1,l:'Request',p:'/request',c:'#2E7D60'},
            {n:2,l:'Match',p:'/shortlist',c:'#2E6A8F'},
            {n:3,l:'Assess',p:'/assess',c:'#9B6B9B'},
            {n:4,l:'Quote',p:'/quotes',c:'#C07830'},
            {n:5,l:'Confirm',p:'/agreement',c:'#6B4FA8'},
            {n:6,l:'Build',p:'/delivery',c:'#C07830'},
            {n:7,l:'Complete',p:'/signoff',c:'#D4522A'},
            {n:8,l:'Protect',p:'/warranty',c:'#1A6B5A'},
          ].map(s => {
            const stageStatus = STAGE_ORDER[s.n - 1]
            const jobIdx = STAGE_ORDER.indexOf(job?.status || 'matching')
            const isComplete = jobIdx > s.n - 1
            const isCurrent = s.p === '/quotes'
            return (
              <a key={s.n} href={s.p} style={{ textDecoration:'none', display:'flex', flexDirection:'column' as const, alignItems:'center', padding:'10px 16px', position:'relative', flexShrink:0, minWidth:'80px' }}>
                {isCurrent && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
                <div style={{ width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, border:'1.5px solid ' + (isComplete ? s.c : isCurrent ? s.c : 'rgba(28,43,50,0.2)'), background: isComplete ? s.c : '#C8D5D2', color: isComplete ? 'white' : isCurrent ? s.c : '#7A9098', marginBottom:'4px' }}>
                  {isComplete ? '✓' : s.n}
                </div>
                <div style={{ fontSize:'12px', color: isCurrent ? '#1C2B32' : isComplete ? s.c : '#7A9098', fontWeight: isCurrent ? 600 : 400 }}>{s.l}</div>
              </a>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>

        {/* PAST STAGE BANNER */}
        {isPastQuotes && (
          <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
            <p style={{ fontSize:'13px', fontWeight:500, color:'#C07830', marginBottom:'6px' }}>You are reviewing Stage 3 — Quotes</p>
            <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px', lineHeight:'1.6' }}>
              This job has moved to the <strong>{job.status}</strong> stage. {acceptedQR && 'You selected ' + acceptedQR.tradie?.business_name + '.'}
            </p>
            <a href={job.status === 'agreement' ? '/agreement' : job.status === 'delivery' ? '/delivery' : job.status === 'signoff' ? '/signoff' : '/warranty'}>
              <button type="button" style={{ background:'#C07830', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to current stage →
              </button>
            </a>
          </div>
        )}

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#C07830', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Stage 3</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>COMPARE QUOTES</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'8px' }}>{job.title}</p>
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'32px' }}>{job.trade_category} · {job.suburb} · {receivedQuotes.length} quote{receivedQuotes.length !== 1 ? 's' : ''} received</p>

        {/* AWAITING QUOTES */}
        {awaitingQuotes.length > 0 && (
          <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
            <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>
              ⏳ Still awaiting quotes from {awaitingQuotes.length} tradie{awaitingQuotes.length !== 1 ? 's' : ''}: {awaitingQuotes.map((qr: any) => qr.tradie?.business_name).join(', ')}
            </p>
          </div>
        )}

        {/* QUOTE CARDS */}
        {receivedQuotes.length === 0 && !isPastQuotes && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'48px', textAlign:'center' as const }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>📋</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No quotes received yet</p>
            <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'20px' }}>Tradies have been notified. Check back soon or send a reminder via messages.</p>
            <a href="/messages" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'13px' }}>Send a message →</a>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
          {receivedQuotes.map(qr => {
            const quote = getLatestQuote(qr.tradie_id)
            if (!quote) return null
            const isExpanded = expandedQuote === qr.tradie_id
            const isDeclining = decliningId === qr.tradie_id
            const isAccepted = qr.status === 'accepted'
            const isDeclined = qr.status === 'declined'
            const allQuotePrices = receivedQuotes.map(r => Number(getLatestQuote(r.tradie_id)?.total_price || 0)).filter(p => p > 0)
            const isLowest = allQuotePrices.length > 1 && Number(quote.total_price) === Math.min(...allQuotePrices)
            const isHighest = allQuotePrices.length > 1 && Number(quote.total_price) === Math.max(...allQuotePrices)

            return (
              <div key={qr.tradie_id} style={{ background:'#E8F0EE', border: isAccepted ? '2px solid #2E7D60' : isDeclined ? '1px solid rgba(28,43,50,0.1)' : '1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', opacity: isDeclined ? 0.6 : 1 }}>

                {/* CARD HEADER */}
                <div style={{ padding:'20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap' as const }}>
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.3px', margin:0 }}>{qr.tradie?.business_name}</p>
                      {isLowest && <span style={{ fontSize:'10px', background:'rgba(46,125,96,0.1)', color:'#2E7D60', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'100px', padding:'2px 8px', fontWeight:600 }}>LOWEST</span>}
                      {isHighest && <span style={{ fontSize:'10px', background:'rgba(192,120,48,0.1)', color:'#C07830', border:'1px solid rgba(192,120,48,0.3)', borderRadius:'100px', padding:'2px 8px', fontWeight:600 }}>HIGHEST</span>}
                      {isAccepted && <span style={{ fontSize:'10px', background:'rgba(46,125,96,0.1)', color:'#2E7D60', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'100px', padding:'2px 8px', fontWeight:600 }}>✓ SELECTED</span>}
                      {isDeclined && <span style={{ fontSize:'10px', background:'rgba(28,43,50,0.06)', color:'#7A9098', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'100px', padding:'2px 8px', fontWeight:600 }}>DECLINED</span>}
                    </div>
                    <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' as const }}>
                      {qr.tradie?.rating_avg > 0 && <span style={{ fontSize:'12px', color:'#7A9098' }}>⭐ {Number(qr.tradie.rating_avg).toFixed(1)}</span>}
                      {qr.tradie?.jobs_completed > 0 && <span style={{ fontSize:'12px', color:'#7A9098' }}>{qr.tradie.jobs_completed} jobs</span>}
                      {qr.tradie?.licence_verified && <span style={{ fontSize:'12px', color:'#2E7D60' }}>✓ Licence verified</span>}
                      {quote.estimated_start && <span style={{ fontSize:'12px', color:'#7A9098' }}>Start: {new Date(quote.estimated_start).toLocaleDateString('en-AU')}</span>}
                      {quote.estimated_days && <span style={{ fontSize:'12px', color:'#7A9098' }}>Duration: {quote.estimated_days} days</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                    <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', margin:'0 0 4px', letterSpacing:'0.5px' }}>${Number(quote.total_price).toLocaleString()}</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>AUD inc. GST</p>
                  </div>
                </div>

                {/* QUICK SUMMARY */}
                {quote.breakdown && quote.breakdown.length > 0 && (
                  <div style={{ padding:'0 20px 16px' }}>
                    <div style={{ background:'#F4F8F7', borderRadius:'8px', overflow:'hidden' }}>
                      {(isExpanded ? quote.breakdown : quote.breakdown.slice(0, 3)).map((b: any, i: number) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderBottom:'1px solid rgba(28,43,50,0.05)' }}>
                          <span style={{ fontSize:'12px', color:'#4A5E64' }}>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                          <span style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32' }}>${Number(b.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      {!isExpanded && quote.breakdown.length > 3 && (
                        <div style={{ padding:'8px 12px', textAlign:'center' as const }}>
                          <button type="button" onClick={() => setExpandedQuote(qr.tradie_id)} style={{ fontSize:'12px', color:'#2E6A8F', background:'none', border:'none', cursor:'pointer' }}>
                            Show all {quote.breakdown.length} line items →
                          </button>
                        </div>
                      )}
                      {isExpanded && (
                        <div style={{ padding:'8px 12px', display:'flex', justifyContent:'space-between', background:'rgba(28,43,50,0.03)' }}>
                          <span style={{ fontSize:'12px', fontWeight:600, color:'#1C2B32' }}>Total</span>
                          <span style={{ fontSize:'12px', fontWeight:600, color:'#1C2B32' }}>${Number(quote.total_price).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {isExpanded && (
                      <button type="button" onClick={() => setExpandedQuote(null)} style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', marginTop:'6px' }}>
                        ↑ Show less
                      </button>
                    )}
                  </div>
                )}

                {/* CONDITIONS */}
                {quote.conditions && isExpanded && (
                  <div style={{ padding:'0 20px 16px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'6px' }}>Terms and conditions</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6' }}>{quote.conditions}</p>
                  </div>
                )}

                {/* DECLINE FEEDBACK */}
                {isDeclined && qr.decline_reason && (
                  <div style={{ padding:'0 20px 16px' }}>
                    <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'8px', padding:'10px 12px' }}>
                      <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', marginBottom:'4px' }}>Decline reason</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>{DECLINE_REASONS.find(r => r.value === qr.decline_reason)?.label}{qr.decline_note ? ' — ' + qr.decline_note : ''}</p>
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                {!isPastQuotes && !isAccepted && !isDeclined && (
                  <div style={{ padding:'0 20px 20px' }}>
                    {isDeclining ? (
                      <div style={{ background:'rgba(212,82,42,0.04)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'10px', padding:'16px' }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'12px' }}>Why are you declining this quote?</p>
                        <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'12px' }}>
                          {DECLINE_REASONS.map(r => (
                            <button key={r.value} type="button"
                              onClick={() => setDeclineForm(prev => ({ ...prev, [qr.tradie_id]: { ...prev[qr.tradie_id], reason: r.value, note: prev[qr.tradie_id]?.note || '' } }))}
                              style={{ padding:'10px 14px', borderRadius:'8px', fontSize:'13px', textAlign:'left' as const, border:'1.5px solid ' + (declineForm[qr.tradie_id]?.reason === r.value ? '#D4522A' : 'rgba(28,43,50,0.15)'), background: declineForm[qr.tradie_id]?.reason === r.value ? 'rgba(212,82,42,0.06)' : '#F4F8F7', color: declineForm[qr.tradie_id]?.reason === r.value ? '#D4522A' : '#4A5E64', cursor:'pointer' }}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={declineForm[qr.tradie_id]?.note || ''}
                          onChange={e => setDeclineForm(prev => ({ ...prev, [qr.tradie_id]: { ...prev[qr.tradie_id], reason: prev[qr.tradie_id]?.reason || '', note: e.target.value } }))}
                          placeholder="Any additional feedback for the tradie? (optional — but helps them improve)"
                          rows={3}
                          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'white', color:'#1C2B32', outline:'none', resize:'vertical' as const, lineHeight:'1.5', boxSizing:'border-box' as const, marginBottom:'10px', fontFamily:'sans-serif' }}
                        />
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button type="button" onClick={() => declineQuote(qr)} disabled={!declineForm[qr.tradie_id]?.reason || submitting}
                            style={{ flex:1, background:'#D4522A', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !declineForm[qr.tradie_id]?.reason || submitting ? 0.5 : 1 }}>
                            {submitting ? 'Sending...' : 'Confirm decline →'}
                          </button>
                          <button type="button" onClick={() => setDecliningId(null)}
                            style={{ background:'transparent', color:'#7A9098', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const }}>
                        <button type="button" onClick={() => acceptQuote(qr)} disabled={accepting}
                          style={{ flex:2, background:'#1C2B32', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: accepting ? 0.7 : 1 }}>
                          {accepting ? 'Accepting...' : 'Select this quote and review scope →'}
                        </button>
                        <button type="button" onClick={() => setDecliningId(qr.tradie_id)}
                          style={{ flex:1, background:'transparent', color:'#D4522A', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(212,82,42,0.3)', cursor:'pointer' }}>
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isAccepted && !isPastQuotes && (
                  <div style={{ padding:'0 20px 20px' }}>
                    <a href="/agreement">
                      <button type="button" style={{ width:'100%', background:'#2E7D60', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                        Continue to scope agreement →
                      </button>
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* MESSAGES LINK */}
        <a href="/messages" style={{ display:'block', marginTop:'24px', textDecoration:'none' }}>
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'16px' }}>💬</span>
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Questions about a quote?</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Message any tradie directly →</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}
