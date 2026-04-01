'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradieJobPage() {
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

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
      setLoading(false)
    })
  }, [])

  const signScope = async () => {
    if (!scope) return
    setSigning(true)
    const supabase = createClient()
    await supabase.from('scope_agreements').update({ tradie_signed_at: new Date().toISOString() }).eq('id', scope.id)
    await supabase.from('jobs').update({ status: 'delivery' }).eq('id', job.id)
    setScope({ ...scope, tradie_signed_at: new Date().toISOString() })
    setJob({ ...job, status: 'delivery' })
    setSigning(false)
  }

  const submitMilestone = async (id: string) => {
    const supabase = createClient()
    await supabase.from('milestones').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', id)
    setMilestones(ms => ms.map(m => m.id === id ? { ...m, status: 'submitted' } : m))
  }

  const resolveIssue = async (id: string) => {
    const supabase = createClient()
    await supabase.from('warranty_issues').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    setIssues(iss => iss.map(i => i.id === id ? { ...i, status: 'resolved' } : i))
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div>
  if (!job) return null

  const statusColor: Record<string,string> = { open:'#D4522A', pending:'#C07830', resolved:'#2E7D60', escalated:'#6B4FA8' }

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
            {!scope.tradie_signed_at && scope.client_signed_at && (
              <div style={{ padding:'16px 18px' }}>
                <button type="button" onClick={signScope} disabled={signing} style={{ width:'100%', background:'#2E7D60', color:'white', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: signing ? 0.7 : 1 }}>
                  {signing ? 'Signing...' : 'Sign scope and start delivery →'}
                </button>
              </div>
            )}
            {!scope.client_signed_at && (
              <div style={{ padding:'14px 18px', background:'rgba(192,120,48,0.06)' }}>
                <p style={{ fontSize:'13px', color:'#C07830' }}>Waiting for client to sign before work can begin.</p>
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
