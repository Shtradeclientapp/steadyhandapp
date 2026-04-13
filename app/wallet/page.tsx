'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WalletPage() {
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [annotations, setAnnotations] = useState<Record<string,string>>({})
  const [editingNote, setEditingNote] = useState<string|null>(null)
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState<'jobs'|'calculator'>('jobs')
  const [calcBudget, setCalcBudget] = useState('')
  const [calcMilestones, setCalcMilestones] = useState('3')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const isTradie = prof?.role === 'tradie'
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name), tradie:tradie_profiles(business_name)')
        .eq(isTradie ? 'tradie_id' : 'client_id', session.user.id)
        .not('status', 'eq', 'draft')
        .order('created_at', { ascending: false })
      setJobs(jobData || [])
      const jobIds = (jobData || []).map((j: any) => j.id)
      if (jobIds.length > 0) {
        const { data: quoteData } = await supabase.from('quotes').select('*').in('job_id', jobIds).order('created_at', { ascending: false })
        setQuotes(quoteData || [])
        const { data: msData } = await supabase.from('milestones').select('*').in('job_id', jobIds).order('order_index', { ascending: true })
        setMilestones(msData || [])
        const { data: annotData } = await supabase.from('wallet_annotations').select('*').eq('user_id', session.user.id)
        const annMap: Record<string,string> = {}
        annotData?.forEach((a: any) => { annMap[a.ref_id] = a.note })
        setAnnotations(annMap)
      }
      if (jobData && jobData.length > 0) setActiveJob(jobData[0].id)
      setLoading(false)
    })
  }, [])

  const saveNote = async (refId: string) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('wallet_annotations').upsert({ user_id: session?.user.id, ref_id: refId, note: noteText }, { onConflict: 'user_id,ref_id' })
    setAnnotations(prev => ({ ...prev, [refId]: noteText }))
    setEditingNote(null)
    setNoteText('')
  }

  const isTradie = profile?.role === 'tradie'
  const dashPath = isTradie ? '/tradie/dashboard' : '/dashboard'
  const getJobQuotes = (jobId: string) => quotes.filter(q => q.job_id === jobId)
  const getJobMilestones = (jobId: string) => milestones.filter(m => m.job_id === jobId)
  const getLatestQuote = (jobId: string) => getJobQuotes(jobId)[0]
  const totalValue = jobs.reduce((sum, j) => { const q = getLatestQuote(j.id); return sum + (q ? Number(q.total_price) : 0) }, 0)
  const totalApproved = milestones.filter(m => m.status === 'approved' && m.amount > 0).reduce((sum, m) => sum + Number(m.amount), 0)
  const totalPending = milestones.filter(m => m.status === 'submitted' && m.amount > 0).reduce((sum, m) => sum + Number(m.amount), 0)

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading wallet...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href={dashPath} style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px' }}>WALLET</div>
        <a href={dashPath} style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Dashboard</a>
      </nav>

      <div style={{ background:'#1C2B32', padding:'32px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 60%, rgba(46,125,96,0.2), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>{isTradie ? 'Tradie wallet' : 'Client wallet'}</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'20px' }}>FINANCIAL OVERVIEW</h1>
          <div className="dashboard-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { label: isTradie ? 'Total quoted' : 'Total committed', value: '$' + totalValue.toLocaleString(), sub: jobs.length + ' jobs' },
              { label: isTradie ? 'Payments approved' : 'Milestones released', value: '$' + totalApproved.toLocaleString(), sub: 'across all jobs' },
              { label: isTradie ? 'Awaiting approval' : 'Pending release', value: '$' + totalPending.toLocaleString(), sub: 'submitted milestones' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'18px' }}>
                <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>{s.label}</p>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'26px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px' }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', marginTop:'3px' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>
        {jobs.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>💰</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:500 }}>No financial activity yet</p>
            <p style={{ fontSize:'13px', color:'#7A9098', marginTop:'4px' }}>Your quote and payment history will appear here.</p>
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {jobs.map(job => {
            const jobQuotes = getJobQuotes(job.id)
            const jobMilestones = getJobMilestones(job.id)
            const latestQuote = jobQuotes[0]
            const isOpen = activeJob === job.id
            const approved = jobMilestones.filter(m => m.status === 'approved' && m.amount > 0).reduce((s, m) => s + Number(m.amount), 0)
            const pending = jobMilestones.filter(m => m.status === 'submitted' && m.amount > 0).reduce((s, m) => s + Number(m.amount), 0)
            return (
              <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
                <div onClick={() => setActiveJob(isOpen ? null : job.id)} style={{ padding:'18px 20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px', marginBottom:'3px' }}>{job.title}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098' }}>{job.trade_category} · {job.suburb} · {isTradie ? job.client?.full_name : job.tradie?.business_name || 'No tradie'}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'16px', flexShrink:0 }}>
                    {latestQuote && <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#1C2B32' }}>${Number(latestQuote.total_price).toLocaleString()}</div>
                      <div style={{ fontSize:'11px', color:'#7A9098' }}>quoted</div>
                    </div>}
                    <span style={{ fontSize:'16px', color:'#7A9098' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop:'1px solid rgba(28,43,50,0.08)' }}>
                    <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                      {[
                        { label:'Quoted', value: latestQuote ? '$' + Number(latestQuote.total_price).toLocaleString() : 'No quote' },
                        { label:'Approved', value: '$' + approved.toLocaleString() },
                        { label:'Pending', value: '$' + pending.toLocaleString() },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:'center', background:'#C8D5D2', borderRadius:'8px', padding:'12px' }}>
                          <div style={{ fontSize:'11px', color:'#7A9098', marginBottom:'4px' }}>{s.label}</div>
                          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#1C2B32' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {jobMilestones.length > 0 && (
                      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                        <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', fontWeight:500, marginBottom:'12px' }}>Milestones</p>
                        {jobMilestones.map(m => (
                          <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)', flexWrap:'wrap' as const }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{m.label}</div>
                              <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>{m.percent}%{m.amount > 0 ? ' · $' + Number(m.amount).toLocaleString() : ''}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                              <span style={{ fontSize:'11px', fontWeight:500, color: m.status === 'approved' ? '#2E7D60' : m.status === 'submitted' ? '#C07830' : '#7A9098', textTransform:'capitalize' as const }}>{m.status}</span>
                              {editingNote === m.id ? (
                                <div style={{ display:'flex', gap:'6px' }}>
                                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add note..." style={{ padding:'4px 8px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', fontSize:'12px', outline:'none', width:'140px' }} />
                                  <button onClick={() => saveNote(m.id)} style={{ background:'#2E7D60', color:'white', border:'none', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', cursor:'pointer' }}>Save</button>
                                  <button onClick={() => setEditingNote(null)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', cursor:'pointer' }}>×</button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingNote(m.id); setNoteText(annotations[m.id] || '') }} style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'6px', padding:'3px 8px', cursor:'pointer' }}>
                                  {annotations[m.id] ? '📝 ' + annotations[m.id].slice(0, 20) + (annotations[m.id].length > 20 ? '...' : '') : '+ Note'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {jobQuotes.length > 0 && (
                      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                        <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', fontWeight:500, marginBottom:'12px' }}>Quote history</p>
                        {jobQuotes.map(q => (
                          <div key={q.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(28,43,50,0.06)', flexWrap:'wrap' as const, gap:'8px' }}>
                            <div>
                              <span style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>v{q.version} · ${Number(q.total_price).toLocaleString()}</span>
                              {q.estimated_days && <span style={{ fontSize:'12px', color:'#7A9098', marginLeft:'8px' }}>{q.estimated_days} days</span>}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <span style={{ fontSize:'11px', color:'#7A9098' }}>{new Date(q.created_at).toLocaleDateString('en-AU')}</span>
                              {editingNote === 'q_' + q.id ? (
                                <div style={{ display:'flex', gap:'6px' }}>
                                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add note..." style={{ padding:'4px 8px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', fontSize:'12px', outline:'none', width:'140px' }} />
                                  <button onClick={() => saveNote('q_' + q.id)} style={{ background:'#2E7D60', color:'white', border:'none', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', cursor:'pointer' }}>Save</button>
                                  <button onClick={() => setEditingNote(null)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', cursor:'pointer' }}>×</button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingNote('q_' + q.id); setNoteText(annotations['q_' + q.id] || '') }} style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'6px', padding:'3px 8px', cursor:'pointer' }}>
                                  {annotations['q_' + q.id] ? '📝 ' + annotations['q_' + q.id].slice(0, 20) + '...' : '+ Note'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ padding:'14px 20px' }}>
                      {editingNote === 'job_' + job.id ? (
                        <div style={{ display:'flex', gap:'8px' }}>
                          <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note to this job..." style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', outline:'none', background:'#F4F8F7' }} />
                          <button onClick={() => saveNote('job_' + job.id)} style={{ background:'#2E7D60', color:'white', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', cursor:'pointer' }}>Save</button>
                          <button onClick={() => setEditingNote(null)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', cursor:'pointer' }}>×</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingNote('job_' + job.id); setNoteText(annotations['job_' + job.id] || '') }} style={{ fontSize:'13px', color:'#4A5E64', background:'transparent', border:'1px dashed rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 16px', cursor:'pointer', width:'100%', textAlign:'left' as const }}>
                          {annotations['job_' + job.id] ? '📝 ' + annotations['job_' + job.id] : '+ Add job note (e.g. Invoice #001 sent 1 April)'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
      )}
    </div>
  )
}
