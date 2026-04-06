'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { HintPanel } from '@/components/ui/HintPanel'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CHECKS = [
  { id:'scope', label:'All scope items completed as described', sub:'Everything in the agreement has been done' },
  { id:'tested', label:'All fixtures, taps and fittings tested', sub:'No leaks, no faults, everything works correctly' },
  { id:'defects', label:'No visible defects in workmanship', sub:'No cracks, gaps, or unfinished surfaces' },
  { id:'clean', label:'Site left clean and tidy', sub:'All rubbish removed, surfaces wiped down' },
  { id:'cert', label:'Any required certificates provided', sub:'Compliance certificates, warranty documents' },
]

export default function SignoffPage() {
  const [job, setJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, id)')
        .eq('client_id', session.user.id)
        .in('status', ['signoff', 'delivery', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        .limit(1)
      if (jobs && jobs.length > 0) setJob(jobs[0])
      setLoading(false)
    })
  }, [])

  const allChecked = CHECKS.every(c => checks[c.id])

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

    setDone(true)
    setSubmitting(false)
  }

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={false}   />
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
        {[{n:1,l:'Request',p:'/request',c:'#2E7D60'},{n:2,l:'Match',p:'/shortlist',c:'#2E6A8F'},{n:3,l:'Assess',p:'/assess',c:'#9B6B9B'},{n:4,l:'Quote',p:'/quotes',c:'#C07830'},{n:5,l:'Confirm',p:'/agreement',c:'#6B4FA8'},{n:6,l:'Build',p:'/delivery',c:'#C07830'},{n:7,l:'Complete',p:'/signoff',c:'#D4522A'},{n:8,l:'Protect',p:'/warranty',c:'#1A6B5A'}].map(s => {
            const STAGE_ORDER = ['matching','shortlisted','assess','quotes','agreement','delivery','signoff','warranty','complete']
            const jobIdx = job ? STAGE_ORDER.indexOf(job.status) : -1
            const pathOrder = ['/request','/shortlist','/assess','/quotes','/agreement','/delivery','/signoff','/warranty','/warranty']
            const isComplete = pathOrder.indexOf(s.p) !== -1 && pathOrder.indexOf(s.p) < pathOrder.indexOf('/signoff') && pathOrder.indexOf(s.p) <= jobIdx
            const isCurrent = s.p === '/signoff'
            return (
          <a key={s.n} href={s.p} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {isCurrent && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (isComplete ? '#2E7D60' : isCurrent ? s.c : 'rgba(28,43,50,0.2)'), background: isComplete ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: isComplete ? 'white' : isCurrent ? s.c : '#7A9098' }}>
              {isComplete ? '✓' : s.n}
            </div>
            <div style={{ fontSize:'12px', color: isCurrent ? '#1C2B32' : isComplete ? '#2E7D60' : '#7A9098', fontWeight: s.p === '/signoff' ? 600 : 400 }}>{s.l}</div>
          </a>
            )
        })}
      </div>
    </div>
  )

  const isPastSignoff = job && ['warranty', 'complete'].includes(job.status)

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div></>

  if (done) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ textAlign:'center', maxWidth:'480px' }}>
        <div style={{ fontSize:'56px', marginBottom:'16px' }}>✅</div>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>JOB SIGNED OFF</h2>
        <p style={{ fontSize:'15px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'28px' }}>Your 90-day warranty period has started. Any defects can be logged in the warranty stage.</p>
        <a href="/warranty">
          <button style={{ background:'#1A6B5A', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer', marginRight:'12px' }}>
            Go to warranty →
          </button>
        </a>
        <a href="/dashboard">
          <button style={{ background:'transparent', color:'#1C2B32', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>
            Dashboard
          </button>
        </a>
      </div>
    </div></>
  )

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No job ready for sign-off.</p>
        <a href="/delivery"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to delivery</button></a>
      </div>
    </div></>
  )

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ maxWidth:'600px', margin:'0 auto' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#D4522A', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Stage 5</span>
        </div>
        {isPastSignoff && (
          <div style={{ background:'rgba(26,107,90,0.06)', border:'1px solid rgba(26,107,90,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
            <p style={{ fontSize:'13px', fontWeight:500, color:'#1A6B5A', marginBottom:'6px' }}>You are reviewing Stage 5 — Sign-off</p>
            <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px', lineHeight:'1.6' }}>
              This job has been signed off and is now under warranty. Below is a record of the sign-off for your reference.
            </p>
            <a href="/warranty">
              <button type="button" style={{ background:'#1A6B5A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to warranty stage →
              </button>
            </a>
          </div>
        )}
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>FINAL SIGN-OFF</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6' }}>
          Walk through the completed job against your scope. Take your time — this starts the warranty clock.
        </p>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'22px', marginBottom:'20px' }}>
          <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'16px', fontWeight:'500' }}>Completion checklist</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {CHECKS.map(c => (
              <div key={c.id}
                onClick={() => setChecks(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 16px', background: checks[c.id] ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border: '1px solid ' + (checks[c.id] ? 'rgba(46,125,96,0.25)' : 'rgba(28,43,50,0.1)'), borderRadius:'10px', cursor:'pointer', transition:'all 0.18s' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'5px', border:'1.5px solid ' + (checks[c.id] ? '#2E7D60' : 'rgba(28,43,50,0.2)'), background: checks[c.id] ? '#2E7D60' : '#E8F0EE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px', fontSize:'12px', color:'white' }}>
                  {checks[c.id] ? '✓' : ''}
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>{c.label}</div>
                  <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'22px', marginBottom:'20px' }}>
          <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'16px', fontWeight:'500' }}>Rate {job.tradie?.business_name}</p>
          <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} type="button" onClick={() => setRating(s)}
                style={{ fontSize:'32px', cursor:'pointer', color: s <= rating ? '#C07830' : 'rgba(28,43,50,0.2)', background:'none', border:'none', padding:'0', lineHeight:1 }}>
                ★
              </button>
            ))}
          </div>
          <div style={{ marginBottom:'4px', fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>Your review</div>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="What was the tradie like to work with? Was the scope followed? Would you recommend them?"
            style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical', minHeight:'80px', fontFamily:'sans-serif' }}
          />
        </div>

        <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
          <p style={{ fontSize:'13px', color:'#D4522A', lineHeight:'1.6' }}>
            Once you sign off, the 90-day warranty period begins. You can still log defects after sign-off — but do a thorough walkthrough first.
          </p>
        </div>

        <button type="button" onClick={submitSignoff} disabled={!allChecked || rating === 0 || submitting}
          style={{ width:'100%', background: allChecked && rating > 0 ? '#D4522A' : 'rgba(28,43,50,0.2)', color:'white', padding:'15px', borderRadius:'8px', fontSize:'15px', fontWeight:'500', border:'none', cursor: allChecked && rating > 0 ? 'pointer' : 'not-allowed', transition:'background 0.2s' }}>
          {submitting ? 'Signing off...' : !allChecked ? 'Complete all checks above to sign off (' + Object.values(checks).filter(Boolean).length + '/' + CHECKS.length + ')' : rating === 0 ? 'Add a rating to sign off' : 'Sign off and start warranty →'}
        </button>

      </div>
    </div></>
  )
}