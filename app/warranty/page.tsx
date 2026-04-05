'use client'
import { HintPanel } from '@/components/ui/HintPanel'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WarrantyPage() {
  const [job, setJob] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', severity: 'moderate' })
  const [acceptingId, setAcceptingId] = useState<string|null>(null)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('client_id', session.user.id)
        .eq('status', 'warranty')
        .order('updated_at', { ascending: false })
        .limit(1)
      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: iss } = await supabase.from('warranty_issues').select('*').eq('job_id', jobs[0].id).order('created_at', { ascending: false })
        setIssues(iss || [])
      }
      setLoading(false)
    })
  }, [])

  const submitIssue = async () => {
    if (!job || !form.title || !form.description) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const responseDue = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const { data: issue } = await supabase.from('warranty_issues').insert({
      job_id: job.id,
      raised_by: session?.user.id,
      title: form.title,
      description: form.description,
      severity: form.severity,
      status: 'open',
      response_due_at: responseDue,
    }).select().single()
    if (issue) setIssues(prev => [issue, ...prev])
    setForm({ title: '', description: '', severity: 'moderate' })
    setShowForm(false)
    setSubmitting(false)
  if (issue) {
      setIssues(prev => [issue, ...prev])
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'warranty_issue', issue_id: issue.id }),
      })
    }}

  const acceptResolution = async (issueId: string) => {
    setAcceptingId(issueId)
    const supabase = createClient()
    await supabase.from('warranty_issues').update({
      status: 'resolved',
      client_accepted_at: new Date().toISOString(),
    }).eq('id', issueId)
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'resolved', client_accepted_at: new Date().toISOString() } : i))
    await fetch('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'score_stage', stage: 'protect', job_id: job?.id }),
    }).catch(() => {})
    setAcceptingId(null)
  }

  const warrantyEnd = job?.warranty_ends_at ? new Date(job.warranty_ends_at) : null
  const daysLeft = warrantyEnd ? Math.max(0, Math.ceil((warrantyEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0

  const statusColor: Record<string, string> = {
    open: '#D4522A', pending: '#C07830', resolved: '#2E7D60', escalated: '#6B4FA8'
  }

  const nav = (
    <div>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Back to dashboard</a>
      </nav>
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
        {[{n:1,l:'Request',p:'/request',c:'#2E7D60'},{n:2,l:'Match',p:'/shortlist',c:'#2E6A8F'},{n:3,l:'Assess',p:'/assess',c:'#9B6B9B'},{n:4,l:'Quote',p:'/quotes',c:'#C07830'},{n:5,l:'Confirm',p:'/agreement',c:'#6B4FA8'},{n:6,l:'Build',p:'/delivery',c:'#C07830'},{n:7,l:'Complete',p:'/signoff',c:'#D4522A'},{n:8,l:'Protect',p:'/warranty',c:'#1A6B5A'}].map(s => (
          <a key={s.n} href={s.p} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {s.p === '/warranty' && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (s.n < 6 ? '#2E7D60' : s.p === '/warranty' ? s.c : 'rgba(28,43,50,0.2)'), background: s.n < 6 ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: s.n < 6 ? 'white' : s.p === '/warranty' ? s.c : '#7A9098' }}>
              {s.n < 6 ? '✓' : s.n}
            </div>
            <div style={{ fontSize:'10px', color: s.p === '/warranty' ? '#1C2B32' : s.n < 6 ? '#2E7D60' : '#7A9098', fontWeight: s.p === '/warranty' ? 600 : 400 }}>{s.l}</div>
          </a>
        ))}
      </div>
    </div>
  )

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div></>

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No job under warranty.</p>
        <a href="/signoff"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to sign-off</button></a>
      </div>
    </div></>
  )

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ maxWidth:'780px', margin:'0 auto' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(26,107,90,0.08)', border:'1px solid rgba(26,107,90,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#1A6B5A', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Stage 6</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>WARRANTY PERIOD</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6' }}>
          Your warranty is active. Log any defects — the tradie must respond within 5 business days.
        </p>

        <div style={{ background:'#1C2B32', borderRadius:'14px', padding:'24px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 80%, rgba(26,107,90,0.35), transparent 50%)' }} />
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
            <div>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>{job.title}</h3>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)' }}>{job.tradie?.business_name} · Signed off {job.signoff_at ? new Date(job.signoff_at).toLocaleDateString('en-AU') : 'recently'}</p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'12px 20px', textAlign:'center', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#D8AD6E', letterSpacing:'1px' }}>{daysLeft}</div>
              <div style={{ fontSize:'11px', color:'rgba(216,228,225,0.5)', marginTop:'2px' }}>days remaining</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'17px', color:'#1C2B32', letterSpacing:'0.5px' }}>LOGGED ISSUES ({issues.length})</div>
          <button type="button" onClick={() => setShowForm(true)}
            style={{ background:'#D4522A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'none', cursor:'pointer' }}>
            + Log new issue
          </button>
        </div>

        {showForm && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'22px', marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'16px' }}>LOG A WARRANTY ISSUE</p>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'5px' }}>Issue title</label>
              <input type="text" placeholder="Brief description of the defect" value={form.title} onChange={set('title')}
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'5px' }}>Detailed description</label>
              <textarea placeholder="Describe the problem, when it started, and how it affects you." value={form.description} onChange={set('description')}
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical', minHeight:'80px', fontFamily:'sans-serif' }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#1C2B32', marginBottom:'5px' }}>Severity</label>
              <select value={form.severity} onChange={set('severity')}
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }}>
                <option value="minor">Minor — cosmetic or low impact</option>
                <option value="moderate">Moderate — affecting use but not safety</option>
                <option value="serious">Serious — affecting use or structural integrity</option>
                <option value="critical">Critical — safety issue or major failure</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background:'transparent', color:'#1C2B32', padding:'11px 20px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={submitIssue} disabled={submitting || !form.title || !form.description}
                style={{ flex:1, background:'#D4522A', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'none', cursor:'pointer', opacity: submitting || !form.title || !form.description ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit warranty issue →'}
              </button>
            </div>
          </div>
        )}

        {issues.length === 0 && !showForm && (
          <div style={{ textAlign:'center', padding:'48px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>🛡</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:'500' }}>No issues logged</p>
            <p style={{ fontSize:'13px', color:'#7A9098' }}>If you notice any defects, log them here and the tradie will be notified.</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {issues.map(issue => (
            <div key={issue.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid ' + (statusColor[issue.status] || '#7A9098'), borderRadius:'11px', padding:'18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
                <span style={{ background: (statusColor[issue.status] || '#7A9098') + '18', border:'1px solid ' + (statusColor[issue.status] || '#7A9098') + '40', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', fontWeight:'500', color: statusColor[issue.status] || '#7A9098', textTransform:'capitalize' }}>{issue.status}</span>
                <span style={{ background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#7A9098', textTransform:'capitalize' }}>{issue.severity}</span>
                <span style={{ fontSize:'12px', color:'#7A9098', marginLeft:'auto' }}>Logged {new Date(issue.created_at).toLocaleDateString('en-AU')}</span>
              </div>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px', marginBottom:'6px' }}>{issue.title}</h3>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', marginBottom:'8px' }}>{issue.description}</p>
              {issue.response_due_at && issue.status === 'open' && !issue.tradie_response && (
                <p style={{ fontSize:'12px', color: new Date(issue.response_due_at) < new Date() ? '#D4522A' : '#7A9098' }}>
                  Response due: {new Date(issue.response_due_at).toLocaleDateString('en-AU')}
                  {new Date(issue.response_due_at) < new Date() ? ' — overdue' : ''}
                </p>
              )}
              {issue.tradie_response && (
                <div style={{ marginTop:'12px', background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'8px', padding:'12px 14px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#2E6A8F', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'6px' }}>
                    Tradie response · {new Date(issue.tradie_responded_at).toLocaleDateString('en-AU')}
                  </p>
                  <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', margin:0 }}>{issue.tradie_response}</p>
                  {issue.resolution_notes && (
                    <p style={{ fontSize:'12px', color:'#4A5E64', marginTop:'8px', fontStyle:'italic' }}>Resolution plan: {issue.resolution_notes}</p>
                  )}
                  {issue.status !== 'resolved' && (
                    <button type="button" onClick={() => acceptResolution(issue.id)} disabled={acceptingId === issue.id}
                      style={{ marginTop:'10px', background:'#2E7D60', color:'white', padding:'8px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', opacity: acceptingId === issue.id ? 0.7 : 1 }}>
                      {acceptingId === issue.id ? 'Accepting...' : '✓ Accept resolution'}
                    </button>
                  )}
                </div>
              )}
              {issue.status === 'resolved' && issue.client_accepted_at && (
                <div style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500 }}>✓ Resolution accepted {new Date(issue.client_accepted_at).toLocaleDateString('en-AU')}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop:'24px', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px' }}>
          <p style={{ fontSize:'11px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.8px', color:'#7A9098', marginBottom:'8px' }}>Warranty terms</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {[
              { label:'Period', value:'90 days from sign-off' },
              { label:'Response SLA', value:'5 business days' },
              { label:'Remediation', value:'14 days or Steadyhand mediates' },
              { label:'Mediation', value:'Steadyhand facilitates' },
            ].map(t => (
              <div key={t.label} style={{ fontSize:'13px' }}>
                <span style={{ color:'#7A9098' }}>{t.label}: </span>
                <span style={{ color:'#1C2B32', fontWeight:'500' }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div></>
  )
}