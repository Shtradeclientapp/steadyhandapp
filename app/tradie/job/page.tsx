'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradieJobPage() {
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    total_price: '',
    estimated_start: '',
    estimated_days: '',
    conditions: '',
    breakdown: [{ label: '', amount: '' }],
  })
  const setQ = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setQuoteForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const jobId = params.get('id')
    if (!jobId) { window.location.href = '/tradie/dashboard'; return }
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: jobData } = await supabase.from('jobs').select('*, client:profiles!jobs_client_id_fkey(full_name, email, suburb, id)').eq('id', jobId).single()
      if (!jobData || jobData.tradie_id !== session.user.id) { window.location.href = '/tradie/dashboard'; return }
      setJob(jobData)
      const { data: s } = await supabase.from('scope_agreements').select('*').eq('job_id', jobId).single()
      if (s) setScope(s)
      const { data: ms } = await supabase.from('milestones').select('*').eq('job_id', jobId).order('order_index', { ascending: true })
      setMilestones(ms || [])
      const { data: iss } = await supabase.from('warranty_issues').select('*').eq('job_id', jobId).order('created_at', { ascending: false })
      setIssues(iss || [])
      const { data: qs } = await supabase.from('quotes').select('*').eq('job_id', jobId).order('created_at', { ascending: false })
      setQuotes(qs || [])
      setLoading(false)
    })
  }, [])

  const submitQuote = async () => {
    if (!job || !quoteForm.total_price) return
    setSubmittingQuote(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const latestVersion = quotes.length > 0 ? quotes[0].version + 1 : 1
    const breakdown = quoteForm.breakdown.filter(b => b.label && b.amount)
    const { data: quote } = await supabase.from('quotes').insert({
      job_id: job.id,
      tradie_id: job.tradie_id,
      version: latestVersion,
      total_price: Number(quoteForm.total_price),
      breakdown: breakdown.length > 0 ? breakdown : null,
      estimated_start: quoteForm.estimated_start || null,
      estimated_days: quoteForm.estimated_days ? Number(quoteForm.estimated_days) : null,
      conditions: quoteForm.conditions || null,
      status: 'submitted',
    }).select().single()

    if (quote) {
      setQuotes(prev => [quote, ...prev])
      await supabase.from('job_messages').insert({
        job_id: job.id,
        sender_id: session?.user.id,
        body: 'Quote v' + latestVersion + ' submitted: $' + Number(quoteForm.total_price).toLocaleString() + (quoteForm.estimated_days ? ' · Est. ' + quoteForm.estimated_days + ' days' : '') + (quoteForm.estimated_start ? ' · Starting ' + new Date(quoteForm.estimated_start).toLocaleDateString('en-AU') : ''),
      })
      await supabase.from('scope_agreements').update({
        total_price: Number(quoteForm.total_price),
        client_signed_at: null,
        tradie_signed_at: null,
      }).eq('job_id', job.id)
      setScope((s: any) => s ? { ...s, total_price: Number(quoteForm.total_price), client_signed_at: null, tradie_signed_at: null } : s)
    }

    setShowQuoteForm(false)
    setQuoteForm({ total_price: '', estimated_start: '', estimated_days: '', conditions: '', breakdown: [{ label: '', amount: '' }] })
    setSubmittingQuote(false)

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'quote_submitted', job_id: job.id }),
    }).catch(() => {})
  }

  const signScope = async () => {
    if (!scope) return
    setSigning(true)
    const supabase = createClient()
    await supabase.from('scope_agreements').update({ tradie_signed_at: new Date().toISOString() }).eq('id', scope.id)
    await supabase.from('jobs').update({ status: 'delivery' }).eq('id', job.id)
    setScope({ ...scope, tradie_signed_at: new Date().toISOString() })
    setJob({ ...job, status: 'delivery' })
    setSigning(false)
    setTimeout(() => { window.location.href = '/tradie/dashboard' }, 1500)
  }

  const submitMilestone = async (id: string) => {
    const supabase = createClient()
    await supabase.from('milestones').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', id)
    setMilestones(ms => ms.map(m => m.id === id ? { ...m, status: 'submitted' } : m))
    await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'milestone_submitted', milestone_id: id }) }).catch(() => {})
  }

  const resolveIssue = async (id: string) => {
    const supabase = createClient()
    await supabase.from('warranty_issues').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    setIssues(iss => iss.map(i => i.id === id ? { ...i, status: 'resolved' } : i))
  }

  const addBreakdownRow = () => setQuoteForm(f => ({ ...f, breakdown: [...f.breakdown, { label: '', amount: '' }] }))
  const updateBreakdown = (i: number, k: 'label'|'amount', v: string) => setQuoteForm(f => {
    const updated = [...f.breakdown]
    updated[i] = { ...updated[i], [k]: v }
    return { ...f, breakdown: updated }
  })

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div>
  if (!job) return null

  const statusColor: Record<string,string> = { open:'#D4522A', pending:'#C07830', resolved:'#2E7D60', escalated:'#6B4FA8' }
  const currentQuote = quotes[0]
  const inp = { width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif' }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Back to dashboard</a>
      </nav>

      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'20px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'10px' }}>
              <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' as const }}>{job.status}</span>
            </div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'6px' }}>{job.title}</h2>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)', marginBottom:'10px' }}>{job.trade_category} · {job.suburb} · {job.property_type}</p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', lineHeight:'1.6' }}>{job.description}</p>
          </div>
        </div>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px', marginBottom:'20px' }}>
          <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'12px', fontWeight:500 }}>Client details</p>
          {[
            { label:'Name', value: job.client?.full_name },
            { label:'Email', value: job.client?.email },
            { label:'Suburb', value: job.client?.suburb },
            { label:'Budget', value: job.budget_range || 'Not specified' },
            { label:'Warranty', value: job.warranty_period + ' days' },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', gap:'12px', padding:'7px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
              <span style={{ fontSize:'13px', color:'#7A9098', minWidth:'80px', flexShrink:0 }}>{item.label}</span>
              <span style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' as const, gap:'10px' }}>
            <div>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500, marginBottom:'2px' }}>Your quote</p>
              {currentQuote && <p style={{ fontSize:'12px', color:'#7A9098' }}>Version {currentQuote.version} · Submitted {new Date(currentQuote.created_at).toLocaleDateString('en-AU')}</p>}
            </div>
            <button type="button" onClick={() => setShowQuoteForm(!showQuoteForm)}
              style={{ background: currentQuote ? 'transparent' : '#2E7D60', color: currentQuote ? '#2E7D60' : 'white', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border: currentQuote ? '1px solid rgba(46,125,96,0.3)' : 'none', cursor:'pointer' }}>
              {currentQuote ? '↻ Revise quote' : '+ Submit quote'}
            </button>
          </div>

          {currentQuote && !showQuoteForm && (
            <div style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'12px' }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#1C2B32' }}>${Number(currentQuote.total_price).toLocaleString()}</span>
                <span style={{ fontSize:'13px', color:'#7A9098' }}>total</span>
              </div>
              {currentQuote.estimated_start && <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'4px' }}>Start: {new Date(currentQuote.estimated_start).toLocaleDateString('en-AU')}</p>}
              {currentQuote.estimated_days && <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'4px' }}>Duration: {currentQuote.estimated_days} days</p>}
              {currentQuote.conditions && <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'4px' }}>Conditions: {currentQuote.conditions}</p>}
              {currentQuote.breakdown && currentQuote.breakdown.length > 0 && (
                <div style={{ marginTop:'12px', borderTop:'1px solid rgba(28,43,50,0.08)', paddingTop:'12px' }}>
                  <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'8px', fontWeight:500 }}>Breakdown</p>
                  {currentQuote.breakdown.map((b: any, i: number) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#1C2B32', padding:'4px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <span>{b.label}</span>
                      <span style={{ fontWeight:500 }}>${Number(b.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showQuoteForm && (
            <div style={{ padding:'18px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'16px' }}>
                {currentQuote ? 'REVISE QUOTE (v' + (currentQuote.version + 1) + ')' : 'SUBMIT QUOTE'}
              </p>
              <div style={{ marginBottom:'14px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Total price ($) *</label>
                <input type="number" placeholder="4200" value={quoteForm.total_price} onChange={setQ('total_price')} style={inp} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Estimated start date</label>
                  <input type="date" value={quoteForm.estimated_start} onChange={setQ('estimated_start')} style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Duration (days)</label>
                  <input type="number" placeholder="14" value={quoteForm.estimated_days} onChange={setQ('estimated_days')} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:'14px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Price breakdown (optional)</label>
                {quoteForm.breakdown.map((b, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px', marginBottom:'6px' }}>
                    <input type="text" placeholder="Labour" value={b.label} onChange={e => updateBreakdown(i, 'label', e.target.value)} style={{ ...inp, marginBottom:0 }} />
                    <input type="number" placeholder="1200" value={b.amount} onChange={e => updateBreakdown(i, 'amount', e.target.value)} style={{ ...inp, marginBottom:0, width:'100px' }} />
                  </div>
                ))}
                <button type="button" onClick={addBreakdownRow} style={{ fontSize:'12px', color:'#2E7D60', background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>+ Add line item</button>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Special conditions</label>
                <textarea placeholder="e.g. Price subject to site inspection, materials to be confirmed..." value={quoteForm.conditions} onChange={setQ('conditions')} rows={3} style={{ ...inp, resize:'vertical' as const }} />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" onClick={() => setShowQuoteForm(false)} style={{ background:'transparent', color:'#1C2B32', padding:'11px 20px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>Cancel</button>
                <button type="button" onClick={submitQuote} disabled={submittingQuote || !quoteForm.total_price}
                  style={{ flex:1, background:'#2E7D60', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: submittingQuote || !quoteForm.total_price ? 0.6 : 1 }}>
                  {submittingQuote ? 'Submitting...' : currentQuote ? 'Submit revised quote →' : 'Submit quote →'}
                </button>
              </div>
            </div>
          )}

          {quotes.length > 1 && (
            <div style={{ padding:'14px 18px', borderTop:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.02)' }}>
              <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'8px', fontWeight:500 }}>Quote history</p>
              {quotes.slice(1).map(q => (
                <div key={q.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#7A9098', padding:'4px 0' }}>
                  <span>v{q.version} · ${Number(q.total_price).toLocaleString()}</span>
                  <span>{new Date(q.created_at).toLocaleDateString('en-AU')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {scope && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>Scope agreement</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <span style={{ fontSize:'11px', color: scope.client_signed_at ? '#2E7D60' : '#7A9098' }}>Client {scope.client_signed_at ? '✓' : '⏳'}</span>
                <span style={{ fontSize:'11px', color: scope.tradie_signed_at ? '#2E7D60' : '#7A9098' }}>You {scope.tradie_signed_at ? '✓' : '⏳'}</span>
              </div>
            </div>
            {scope.inclusions?.length > 0 && (
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'8px', fontWeight:500 }}>Inclusions</p>
                {scope.inclusions.map((item: string, i: number) => (
                  <div key={i} style={{ display:'flex', gap:'8px', padding:'4px 0', fontSize:'13px', color:'#1C2B32' }}><span style={{ color:'#2E7D60', flexShrink:0 }}>✓</span>{item}</div>
                ))}
              </div>
            )}
            {scope.exclusions?.length > 0 && (
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'8px', fontWeight:500 }}>Exclusions</p>
                {scope.exclusions.map((item: string, i: number) => (
                  <div key={i} style={{ display:'flex', gap:'8px', padding:'4px 0', fontSize:'13px', color:'#1C2B32' }}><span style={{ color:'#D4522A', flexShrink:0 }}>×</span>{item}</div>
                ))}
              </div>
            )}
            {!scope.tradie_signed_at && scope.client_signed_at && currentQuote && (
              <div style={{ padding:'16px 18px' }}>
                <button type="button" onClick={signScope} disabled={signing}
                  style={{ width:'100%', background:'#2E7D60', color:'white', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: signing ? 0.7 : 1 }}>
                  {signing ? 'Signing...' : 'Sign scope and start delivery →'}
                </button>
              </div>
            )}
            {!scope.tradie_signed_at && scope.client_signed_at && !currentQuote && (
              <div style={{ padding:'14px 18px', background:'rgba(192,120,48,0.06)' }}>
                <p style={{ fontSize:'13px', color:'#C07830' }}>Submit a quote before signing the scope.</p>
              </div>
            )}
            {!scope.client_signed_at && (
              <div style={{ padding:'14px 18px', background:'rgba(192,120,48,0.06)' }}>
                <p style={{ fontSize:'13px', color:'#C07830' }}>Waiting for client to review and sign.</p>
              </div>
            )}
          </div>
        )}

        {milestones.length > 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>Milestones</p>
            </div>
            {milestones.map((m, i) => {
              const isActive = m.status === 'pending' && (i === 0 || milestones[i-1]?.status === 'approved')
              return (
                <div key={m.id} style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'2px' }}>{m.label}</div>
                      <div style={{ fontSize:'12px', color:'#7A9098' }}>{m.description} · {m.percent}%</div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      {m.status === 'approved' && <span style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500 }}>✓ Approved</span>}
                      {m.status === 'submitted' && <span style={{ fontSize:'12px', color:'#C07830' }}>⏳ Awaiting approval</span>}
                      {isActive && <button type="button" onClick={() => submitMilestone(m.id)} style={{ background:'#C07830', color:'white', padding:'8px 16px', borderRadius:'6px', fontSize:'12px', border:'none', cursor:'pointer' }}>Mark complete →</button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {issues.length > 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>Warranty issues ({issues.length})</p>
            </div>
            {issues.map(issue => (
              <div key={issue.id} style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)', borderLeft:'3px solid ' + (statusColor[issue.status] || '#7A9098') }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'4px' }}>{issue.title}</div>
                    <div style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', marginBottom:'6px' }}>{issue.description}</div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <span style={{ fontSize:'11px', color: statusColor[issue.status] || '#7A9098', textTransform:'capitalize' as const }}>{issue.status}</span>
                      <span style={{ fontSize:'11px', color:'#7A9098' }}>· {issue.severity}</span>
                    </div>
                  </div>
                  {issue.status === 'open' && <button type="button" onClick={() => resolveIssue(issue.id)} style={{ background:'#2E7D60', color:'white', padding:'8px 14px', borderRadius:'6px', fontSize:'12px', border:'none', cursor:'pointer', flexShrink:0 }}>Mark resolved</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
