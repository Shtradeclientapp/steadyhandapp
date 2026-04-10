'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StageRail } from '@/components/ui'
import { JobSelector } from '@/components/ui/JobSelector'

const BASE_CHECKS = [
  { id:'defects', label:'No visible defects in workmanship', sub:'No cracks, gaps, unfinished surfaces or loose fittings' },
  { id:'clean', label:'Site left clean and tidy', sub:'All rubbish removed, surfaces wiped down, tools cleared' },
  { id:'cert', label:'Any required certificates provided', sub:'Compliance certificates, warranty documents, permits' },
]

export default function SignoffPage() {
  const [job, setJob] = useState<any>(null)
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [dynamicChecks, setDynamicChecks] = useState<{id:string,label:string,sub:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [rating, setRating] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('signoff_rating')
      return saved ? parseInt(saved) : 0
    }
    return 0
  })
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [showPartial, setShowPartial] = useState(false)
  const [outstandingNote, setOutstandingNote] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, id, dialogue_score_avg)')
        .eq('client_id', session.user.id)
        .in('status', ['signoff', 'delivery', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        
      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: ms } = await supabase
          .from('milestones')
          .select('*')
          .eq('job_id', jobs[0].id)
          .order('position', { ascending: true })
        setMilestones(ms || [])

        const milestoneChecks = (ms || []).map((m: any) => ({
          id: 'milestone_' + m.id,
          label: m.label + ' — completed and approved',
          sub: m.description || 'Milestone signed off by client',
        }))
        const scopeCheck = jobs[0].description ? [{
          id: 'scope',
          label: 'All scope items completed as described',
          sub: jobs[0].description.slice(0, 100) + (jobs[0].description.length > 100 ? '...' : ''),
        }] : []
        setDynamicChecks([...scopeCheck, ...milestoneChecks])
      }
      setLoading(false)
    })
  }, [])

  const allChecks = [...dynamicChecks, ...BASE_CHECKS]
  const allChecked = allChecks.every(c => checks[c.id])

  const submitSignoff = async () => {
    if (!job || !allChecked || rating === 0) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('jobs').update({
      status: 'warranty',
      signoff_at: new Date().toISOString(),
      warranty_ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', job.id)
    if (review && session) {
      await supabase.from('reviews').insert({
        job_id: job.id,
        reviewer_id: session.user.id,
        reviewee_id: job.tradie?.id,
        rating,
        body: review,
        is_public: true,
      })
    }
    await fetch('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'score_stage', stage: 'complete', job_id: job.id }),
    }).catch(() => {})

    // Auto-deposit warranty certificate to vault
    try {
      const supabase2 = createClient()
      await supabase2.from('vault_documents').insert({
        user_id: session.user.id,
        job_id: job.id,
        job_title: job.title,
        title: job.title + ' — warranty certificate',
        document_type: 'warranty',
        tradie_name: job.tradie?.business_name || null,
        issued_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '90-day warranty — signed off ' + new Date().toLocaleDateString('en-AU'),
      })
    } catch { /* non-critical */ }

    // Notify tradie of sign-off
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'job_signed_off', job_id: job.id }),
    }).catch(() => {})
    if (typeof window !== 'undefined') sessionStorage.removeItem('signoff_rating')
    setDone(true)
    setSubmitting(false)
  }

  const isPastSignoff = job && ['warranty', 'complete'].includes(job.status)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' as const }}>
        <p style={{ color:'#4A5E64', fontFamily:'sans-serif', marginBottom:'16px' }}>No job ready for sign-off.</p>
        <a href="/dashboard" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'14px' }}>← Back to dashboard</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false} />
      <StageRail currentPath="/signoff" jobStatus={job?.status} />
      {allJobs.length > 1 && (
        <div style={{ maxWidth:'680px', margin:'0 auto', padding:'16px 24px 0' }}>
          <JobSelector jobs={allJobs} selectedJobId={job?.id} onSelect={id => setJob(allJobs.find(j => j.id === id))} />
        </div>
      )}

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px' }}>

        {/* Stage badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#D4522A', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Sign off</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>SIGN OFF</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'4px' }}>{job.title}</p>
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'32px' }}>{job.trade_category} · {job.suburb} · {job.tradie?.business_name}</p>

        {/* Past signoff banner */}
        {isPastSignoff && (
          <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
            <p style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>This job has been signed off</p>
            <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px' }}>Your 90-day warranty period is now active.</p>
            <a href="/warranty">
              <button type="button" style={{ background:'#2E7D60', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to warranty →
              </button>
            </a>
          </div>
        )}

        {/* Success state */}
        {done && (
          <div style={{ marginBottom:'20px' }}>
            {/* Hero celebration */}
            <div style={{ background:'#1C2B32', borderRadius:'14px', padding:'36px 28px', textAlign:'center' as const, marginBottom:'16px', position:'relative' as const, overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'radial-gradient(ellipse at 50% 0%, rgba(46,125,96,0.3), transparent 70%)', pointerEvents:'none' }} />
              <div style={{ fontSize:'56px', marginBottom:'16px' }}>🏡</div>
              <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.95)', letterSpacing:'1.5px', marginBottom:'8px' }}>JOB COMPLETE</h2>
              <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.6)', marginBottom:'4px' }}>{job?.title}</p>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', marginBottom:'24px' }}>Completed {new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}</p>
              <div style={{ display:'flex', justifyContent:'center', gap:'24px', flexWrap:'wrap' as const }}>
                {[
                  { label:'Tradie', value: job?.tradie?.business_name || '—' },
                  { label:'Warranty', value: (job?.warranty_period_days || 90) + ' days' },
                  { label:'Signed off', value: '✓ Both parties' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign:'center' as const }}>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'4px' }}>{s.label}</p>
                    <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.8)', fontWeight:500 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What happens next */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px', marginBottom:'12px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'12px' }}>What happens now</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {[
                  { icon:'🛡', text:'Your warranty period has started. Log any issues within ' + (job?.warranty_period_days || 90) + ' days and the tradie is obligated to respond within 5 business days.' },
                  { icon:'📄', text:'Your warranty certificate has been deposited to your Document Vault. You can access it any time from Home Hub.' },
                  { icon:'⭐', text: rating > 0 ? 'Your ' + rating + '-star rating has been recorded against ' + (job?.tradie?.business_name || 'the tradie') + ' Dialogue Rating.' : 'Consider leaving a rating — it helps future clients find good tradies.' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    <span style={{ fontSize:'16px', flexShrink:0 }}>{item.icon}</span>
                    <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', margin:0 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const }}>
              <a href="/warranty" style={{ flex:2, textDecoration:'none' }}>
                <button type="button" style={{ width:'100%', background:'#2E7D60', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  View warranty period →
                </button>
              </a>
              <a href="/vault" style={{ flex:1, textDecoration:'none' }}>
                <button type="button" style={{ width:'100%', background:'transparent', color:'#1C2B32', padding:'13px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>
                  Document vault
                </button>
              </a>
            </div>
          </div>
        )}

        {!done && !isPastSignoff && (
          <>
            {/* Checklist */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.03)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', margin:'0 0 4px' }}>SIGN-OFF CHECKLIST</p>
                <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                  {dynamicChecks.length > 0
                    ? 'Generated from your job scope and milestones — tick each item to confirm completion'
                    : 'Confirm each item before signing off'}
                </p>
              </div>

              {/* Dynamic checks from scope + milestones */}
              {allChecks.map((c, i) => {
                const isMilestone = c.id.startsWith('milestone_')
                const isScope = c.id === 'scope'
                const accentColor = isMilestone ? '#2E6A8F' : isScope ? '#6B4FA8' : '#2E7D60'
                return (
                  <div key={c.id} onClick={() => setChecks(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                    style={{ display:'flex', alignItems:'flex-start', gap:'14px', padding:'14px 20px', borderBottom: i < allChecks.length - 1 ? '1px solid rgba(28,43,50,0.06)' : 'none', cursor:'pointer', background: checks[c.id] ? 'rgba(46,125,96,0.03)' : 'transparent' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'6px', border:'2px solid ' + (checks[c.id] ? '#2E7D60' : 'rgba(28,43,50,0.2)'), background: checks[c.id] ? '#2E7D60' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px', fontSize:'13px', color:'white', transition:'all 0.15s' }}>
                      {checks[c.id] ? '✓' : ''}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                        {isMilestone && <span style={{ fontSize:'10px', background:'rgba(46,106,143,0.1)', border:'1px solid rgba(46,106,143,0.2)', color:'#2E6A8F', borderRadius:'4px', padding:'1px 6px', fontWeight:500 }}>MILESTONE</span>}
                        {isScope && <span style={{ fontSize:'10px', background:'rgba(107,79,168,0.1)', border:'1px solid rgba(107,79,168,0.2)', color:'#6B4FA8', borderRadius:'4px', padding:'1px 6px', fontWeight:500 }}>SCOPE</span>}
                        <p style={{ fontSize:'13px', fontWeight:500, color: checks[c.id] ? '#2E7D60' : '#1C2B32', margin:0, textDecoration: checks[c.id] ? 'line-through' : 'none' }}>{c.label}</p>
                      </div>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0, lineHeight:'1.5' }}>{c.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Progress indicator */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'6px' }}>
                <span style={{ color:'#4A5E64' }}>Checklist progress</span>
                <span style={{ color:'#1C2B32', fontWeight:500 }}>{Object.values(checks).filter(Boolean).length} of {allChecks.length} items</span>
              </div>
              <div style={{ height:'4px', background:'rgba(28,43,50,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', width: (Object.values(checks).filter(Boolean).length / Math.max(allChecks.length, 1) * 100) + '%', background:'#2E7D60', borderRadius:'2px', transition:'width 0.3s' }} />
              </div>
            </div>

            {/* Rating */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'20px', marginBottom:'20px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'12px' }}>RATE YOUR TRADIE</p>
              <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => { setRating(s); if (typeof window !== 'undefined') sessionStorage.setItem('signoff_rating', String(s)) }}
                    style={{ fontSize:'28px', background:'none', border:'none', cursor:'pointer', opacity: s <= rating ? 1 : 0.25, transition:'opacity 0.15s' }}>
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="How did the job go? Your review helps other clients and builds the tradie's Dialogue Rating. (optional)"
                rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical' as const, lineHeight:'1.5', boxSizing:'border-box' as const, fontFamily:'sans-serif' }}
              />
            </div>

            {/* Submit */}
            <div style={{ background: allChecked && rating > 0 ? 'rgba(46,125,96,0.06)' : 'rgba(28,43,50,0.04)', border:'1px solid ' + (allChecked && rating > 0 ? 'rgba(46,125,96,0.2)' : 'rgba(28,43,50,0.1)'), borderRadius:'12px', padding:'16px 20px', marginBottom:'16px' }}>
              {rating === 0 && <p style={{ fontSize:'12px', color:'#C07830', margin:'0 0 8px' }}>⚠ Please rate your tradie before signing off</p>}
              {allChecked && rating > 0 && <p style={{ fontSize:'12px', color:'#2E7D60', margin:'0 0 8px' }}>✓ Ready to sign off — your {job?.warranty_period_days || 90}-day warranty starts from this moment</p>}
              <button type="button" onClick={submitSignoff} disabled={!allChecked || rating === 0 || submitting}
                style={{ width:'100%', background: allChecked && rating > 0 ? '#1C2B32' : 'rgba(28,43,50,0.15)', color: allChecked && rating > 0 ? 'white' : '#7A9098', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor: allChecked && rating > 0 ? 'pointer' : 'not-allowed', transition:'all 0.2s', marginBottom: !allChecked ? '10px' : '0' }}>
                {submitting ? 'Signing off...' : 'Sign off and start warranty →'}
              </button>

              {/* Partial sign-off option */}
              {!allChecked && rating > 0 && (
                <div style={{ marginTop:'2px' }}>
                  {!showPartial ? (
                    <button type="button" onClick={() => setShowPartial(true)}
                      style={{ width:'100%', background:'transparent', color:'#C07830', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(192,120,48,0.3)', cursor:'pointer' }}>
                      Some items outstanding — sign off with exceptions
                    </button>
                  ) : (
                    <div style={{ background:'rgba(192,120,48,0.05)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'8px', padding:'14px', marginTop:'4px' }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#C07830', marginBottom:'8px' }}>Describe the outstanding items</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'10px', lineHeight:'1.5' }}>A message will be sent to {job?.tradie?.business_name || 'the tradie'} noting the outstanding items. Your warranty still starts from today.</p>
                      <textarea
                        value={outstandingNote}
                        onChange={e => setOutstandingNote(e.target.value)}
                        placeholder="e.g. The bathroom tap still drips slightly and the paint touch-up on the south wall is incomplete."
                        rows={3}
                        style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(192,120,48,0.25)', borderRadius:'8px', fontSize:'13px', background:'white', color:'#1C2B32', outline:'none', resize:'vertical' as const, lineHeight:'1.5', boxSizing:'border-box' as const, marginBottom:'10px', fontFamily:'sans-serif' }}
                      />
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button type="button" onClick={async () => {
                          if (!outstandingNote.trim()) return
                          const supabase = createClient()
                          const { data: { session } } = await supabase.auth.getSession()
                          await supabase.from('job_messages').insert({
                            job_id: job.id,
                            sender_id: session?.user.id,
                            body: 'Sign-off with outstanding items: ' + outstandingNote.trim(),
                          })
                          submitSignoff()
                        }} disabled={!outstandingNote.trim() || submitting}
                          style={{ flex:1, background:'#C07830', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !outstandingNote.trim() || submitting ? 0.5 : 1 }}>
                          {submitting ? 'Signing off...' : 'Sign off with outstanding items →'}
                        </button>
                        <button type="button" onClick={() => setShowPartial(false)}
                          style={{ background:'transparent', color:'#7A9098', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize:'12px', color:'#7A9098', textAlign:'center' as const, lineHeight:'1.6' }}>
              By signing off you confirm the work is complete to your satisfaction. Your 90-day warranty period begins immediately.
            </p>
          </>
        )}

        {/* Messages link */}
        <a href="/messages" style={{ display:'block', marginTop:'24px', textDecoration:'none' }}>
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'16px' }}>💬</span>
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Questions before signing off?</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Message your tradie directly →</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}
