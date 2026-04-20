'use client'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { NavHeader } from '@/components/ui/NavHeader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StageRail } from '@/components/ui'
import { JobSelector } from '@/components/ui/JobSelector'

export default function WarrantyPage() {
  const [job, setJob] = useState<any>(null)
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', severity: 'moderate' })
  const [acceptingId, setAcceptingId] = useState<string|null>(null)
  const [issueError, setIssueError] = useState<string|null>(null)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const isT = prof?.role === 'tradie'
      const col = isT ? 'tradie_id' : 'client_id'
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq(col, session.user.id)
        .in('status', ['warranty', 'complete'])
        .order('updated_at', { ascending: false })
        
      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: iss } = await supabase.from('warranty_issues').select('*').eq('job_id', jobs[0].id).order('created_at', { ascending: false })
        setIssues(iss || [])
      }
      // Auto-complete if warranty period has expired
      const jobData = jobs[0]
      if (jobData?.warranty_ends_at && new Date(jobData.warranty_ends_at) < new Date() && jobData.status === 'warranty') {
        const supabase2 = createClient()
        await supabase2.from('jobs').update({ status: 'complete' }).eq('id', jobData.id)
        jobData.status = 'complete'
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
    const { data: issue, error: issueInsertErr } = await supabase.from('warranty_issues').insert({
      job_id: job.id,
      raised_by: session?.user.id,
      title: form.title,
      description: form.description,
      severity: form.severity,
      status: 'open',
      response_due_at: responseDue,
    }).select().single()
    if (issue) {
      setIssues(prev => [issue, ...prev])
      // Notify tradie via message thread
      await supabase.from('job_messages').insert({
        job_id: job.id,
        sender_id: session?.user.id,
        body: '⚠ Warranty issue logged: "' + form.title + '" — ' + form.severity + ' severity. Response required within 5 business days.',
      })
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'warranty_issue', issue_id: issue.id }),
      }).catch(() => {})
    }
    if (!issue) {
      setIssueError('Could not log issue — please check your connection and try again.')
      setSubmitting(false)
      return
    }
    setIssueError(null)
    setForm({ title: '', description: '', severity: 'moderate' })
    setShowForm(false)
    setSubmitting(false)
  }

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

  const isTradie = profile?.role === 'tradie'

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={isTradie} />
      <StageRail currentPath="/warranty" jobStatus={job?.status} />
    </div>
  )

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div></>

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No job under warranty.</p>
        <a href="/signoff"><button style={{ background:'#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to sign-off</button></a>
      </div>
    </div></>
  )

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ maxWidth:'780px', margin:'0 auto' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(26,107,90,0.08)', border:'1px solid rgba(26,107,90,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#1A6B5A', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>You're covered</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'6px' }}>WARRANTY PERIOD</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6' }}>
          Your warranty is active. Log any defects — the tradie must respond within 5 business days.
        </p>

        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'24px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
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

        {daysLeft > 0 && daysLeft <= 30 && (
          <div style={{ background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'18px' }}>⏰</span>
            <p style={{ fontSize:'13px', color:'#C07830', margin:0 }}>
              <strong>Warranty expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.</strong> Now is the time to do a final check and log any issues before your coverage ends.
            </p>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'17px', color:'#0A0A0A', letterSpacing:'0.5px' }}>LOGGED ISSUES ({issues.length})</div>
          <button type="button" onClick={() => setShowForm(true)}
            style={{ background:'#D4522A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'none', cursor:'pointer' }}>
            + Log new issue
          </button>
        </div>

        {showForm && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'22px', marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'16px' }}>LOG A WARRANTY ISSUE</p>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#0A0A0A', marginBottom:'5px' }}>Issue title</label>
              <input type="text" placeholder="Brief description of the defect" value={form.title} onChange={set('title')}
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none' }} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#0A0A0A', marginBottom:'5px' }}>Detailed description</label>
              <textarea placeholder="Describe the problem, when it started, and how it affects you." value={form.description} onChange={set('description')}
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'vertical', minHeight:'80px', fontFamily:'sans-serif' }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'#0A0A0A', marginBottom:'5px' }}>Severity</label>
              <select value={form.severity} onChange={set('severity')}
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none' }}>
                <option value="minor">Minor — cosmetic or low impact</option>
                <option value="moderate">Moderate — affecting use but not safety</option>
                <option value="serious">Serious — affecting use or structural integrity</option>
                <option value="critical">Critical — safety issue or major failure</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background:'transparent', color:'#0A0A0A', padding:'11px 20px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>
                Cancel
              </button>
              {issueError && (
                <p style={{ fontSize:'12px', color:'#D4522A', margin:'0 0 6px' }}>⚠ {issueError}</p>
              )}
              <button type="button" onClick={submitIssue} disabled={submitting || !form.title || !form.description}
                style={{ flex:1, background:'#D4522A', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'none', cursor:'pointer', opacity: submitting || !form.title || !form.description ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit warranty issue →'}
              </button>
            </div>
          </div>
        )}

        {issues.length === 0 && !showForm && (
          <div style={{ textAlign:'center', padding:'48px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
            <div style={{ fontSize:'36px', marginBottom:'12px' }}>🛡</div>
            <p style={{ fontSize:'15px', color:'#2E7D60', marginBottom:'6px', fontWeight:600 }}>Warranty active — no issues logged</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6', maxWidth:'380px', margin:'0 auto 16px' }}>
              Your warranty period is running. If you notice any defects or incomplete work, log it here — the tradie is obligated to respond within 5 business days.
            </p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'4px', textAlign:'left' as const, maxWidth:'340px', margin:'0 auto' }}>
              {[
                'Check that all work matches the agreed scope',
                'Test any installed fixtures, fittings or systems',
                'Note any unfinished edges, gaps, or surface defects',
                'Review compliance certificates are in your Document Vault',
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                  <span style={{ color:'#2E7D60', fontSize:'12px', flexShrink:0, marginTop:'1px' }}>✓</span>
                  <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {issues.map(issue => (
            <div key={issue.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid ' + (statusColor[issue.status] || '#7A9098'), borderRadius:'11px', padding:'18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
                <span style={{ background: (statusColor[issue.status] || '#7A9098') + '18', border:'1px solid ' + (statusColor[issue.status] || '#7A9098') + '40', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', fontWeight:'500', color: statusColor[issue.status] || '#7A9098', textTransform:'capitalize' }}>{issue.status}</span>
                <span style={{ background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'100px', padding:'3px 10px', fontSize:'12px', color:'#4A5E64', textTransform:'capitalize' }}>{issue.severity}</span>
                <span style={{ fontSize:'12px', color:'#7A9098', marginLeft:'auto' }}>Logged {new Date(issue.created_at).toLocaleDateString('en-AU')}</span>
              </div>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#0A0A0A', letterSpacing:'0.3px', marginBottom:'6px' }}>{issue.title}</h3>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', marginBottom:'8px' }}>{issue.description}</p>
              {/* response due indicator rendered below */}
              {issue.response_due_at && issue.status === 'open' && !issue.tradie_response && (() => {
                const due = new Date(issue.response_due_at)
                const overdue = due < new Date()
                return (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'6px', background: overdue ? 'rgba(212,82,42,0.08)' : 'rgba(28,43,50,0.04)', border:'1px solid ' + (overdue ? 'rgba(212,82,42,0.25)' : 'rgba(28,43,50,0.1)'), marginBottom:'4px' }}>
                    <span style={{ fontSize:'11px', color: overdue ? '#D4522A' : '#7A9098', fontWeight: overdue ? 600 : 400 }}>
                      {overdue ? '⚠ Overdue — ' : '⏱ Response due '}{due.toLocaleDateString('en-AU')}
                    </span>
                  <a href="/messages" style={{ fontSize:'11px', color:'#D4522A', fontWeight:500, marginLeft:'8px', textDecoration:'none' }}>
                      Message tradie →
                    </a>
                  </div>
                )
              })()}
              {issue.tradie_response && (
                <div style={{ marginTop:'12px', background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'8px', padding:'12px 14px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#2E6A8F', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'6px' }}>
                    Tradie response · {new Date(issue.tradie_responded_at).toLocaleDateString('en-AU')}
                  </p>
                  <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', margin:0 }}>{issue.tradie_response}</p>
                  {issue.resolution_notes && (
                    <p style={{ fontSize:'12px', color:'#4A5E64', marginTop:'8px', fontStyle:'italic' }}>Resolution plan: {issue.resolution_notes}</p>
                  )}
                  {issue.status === 'open' && (
                    <button type="button" onClick={async () => {
                      const supabase = createClient()
                      await supabase.from('warranty_issues').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', issue.id)
                      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: 'resolved' } : i))
                    }} style={{ marginTop:'10px', fontSize:'12px', color:'#2E7D60', background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                      Mark as resolved ✓
                    </button>
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
          <div className='warranty-action-grid' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {[
              { label:'Period', value:'90 days from sign-off' },
              { label:'Response SLA', value:'5 business days' },
              { label:'Escalation', value:'Contact Steadyhand if no response after SLA' },
              { label:'Remediation', value:'14 days or Steadyhand mediates' },
              { label:'Mediation', value:'Steadyhand facilitates' },
            ].map(t => (
              <div key={t.label} style={{ fontSize:'13px' }}>
                <span style={{ color:'#7A9098' }}>{t.label}: </span>
                <span style={{ color:'#0A0A0A', fontWeight:'500' }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div></>
      <StageGuideModal
        storageKey="seen_warranty_guide"
        stageNumber={8}
        stageColor="#2E7D60"
        stageLabel="Protected"
        headline="You are protected — here is how to use it"
        intro="Your warranty period is active. If something goes wrong with the completed work, log it here. Steadyhand tracks the response and enforces the SLA."
        checklist={[
          { text: 'Log issues as soon as you notice them — do not wait until the warranty expires', emphasis: true },
          { text: 'The tradie has 5 business days to respond — overdue responses are flagged automatically', emphasis: false },
          { text: 'Check your warranty end date — issues must be logged before it expires', emphasis: false },
          { text: 'All issues and responses are permanently recorded in your Document Vault', emphasis: false },
        ]}
        ctaLabel="View my warranty →"
      />
    </>
  )
}