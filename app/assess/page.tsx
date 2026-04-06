'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGE_RAIL = [
  {n:1,l:'Request',p:'/request',c:'#2E7D60'},
  {n:2,l:'Match',p:'/shortlist',c:'#2E6A8F'},
  {n:3,l:'Assess',p:'/assess',c:'#9B6B9B'},
  {n:4,l:'Quote',p:'/quotes',c:'#C07830'},
  {n:5,l:'Confirm',p:'/agreement',c:'#6B4FA8'},
  {n:6,l:'Build',p:'/delivery',c:'#C07830'},
  {n:7,l:'Complete',p:'/signoff',c:'#D4522A'},
  {n:8,l:'Protect',p:'/warranty',c:'#1A6B5A'},
]

const CLIENT_PROMPTS = [
  { key: 'client_what_discussed', label: 'What work was discussed?', placeholder: 'Describe what the tradie came to look at and what you talked through together...' },
  { key: 'client_site_conditions', label: 'What site conditions or access issues were noted?', placeholder: 'e.g. Limited roof access, asbestos suspected, existing damage noted...' },
  { key: 'client_tradie_advice', label: "What was the tradie's initial advice or reaction?", placeholder: 'e.g. They recommended replacing rather than repairing, suggested a different approach...' },
  { key: 'client_unresolved', label: 'What was left unresolved or unclear?', placeholder: 'e.g. They needed to check pricing on materials, unsure about council approval requirements...' },
  { key: 'client_expectations', label: 'What do you expect the quote to cover?', placeholder: 'e.g. Full replacement of all tiles including waterproofing, disposal of old materials, supply of grout...' },
]

const TRADIE_PROMPTS = [
  { key: 'tradie_observations', label: 'What did you observe on site?', placeholder: 'Describe the condition of the site, existing work, materials, access...' },
  { key: 'tradie_scope_considerations', label: 'What are the key scope considerations?', placeholder: 'e.g. Waterproofing will need to be redone, existing substrate needs preparation...' },
  { key: 'tradie_complications', label: 'Any complications or variations from the initial brief?', placeholder: 'e.g. The scope is larger than described, additional work required before starting...' },
  { key: 'tradie_quote_assumptions', label: 'What assumptions is your quote based on?', placeholder: 'e.g. Client supplies tiles, access available Monday-Friday, no asbestos present...' },
]

export default function AssessPage() {
  const [job, setJob] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isTradie, setIsTradie] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [form, setForm] = useState<any>({})
  const [activeTab, setActiveTab] = useState<'mine'|'theirs'>('mine')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const tradie = prof?.role === 'tradie'
      setIsTradie(tradie)

      const col = tradie ? 'tradie_id' : 'client_id'
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, id), client:profiles!jobs_client_id_fkey(full_name)')
        .eq(col, session.user.id)
        .in('status', ['assess', 'quotes', 'agreement', 'shortlisted', 'delivery', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: assess } = await supabase
          .from('site_assessments')
          .select('*')
          .eq('job_id', jobs[0].id)
          .single()

        if (assess) {
          setAssessment(assess)
          setForm(assess)
        } else {
          const { data: newAssess } = await supabase
            .from('site_assessments')
            .insert({ job_id: jobs[0].id, consult_date: new Date().toISOString() })
            .select()
            .single()
          if (newAssess) { setAssessment(newAssess); setForm(newAssess) }
        }
      }
      setLoading(false)
    })
  }, [])

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!assessment) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('site_assessments').update({
      consult_date: form.consult_date,
      consult_attendees: form.consult_attendees,
      ...(isTradie ? {
        tradie_observations: form.tradie_observations,
        tradie_scope_considerations: form.tradie_scope_considerations,
        tradie_complications: form.tradie_complications,
        tradie_quote_assumptions: form.tradie_quote_assumptions,
      } : {
        client_what_discussed: form.client_what_discussed,
        client_site_conditions: form.client_site_conditions,
        client_tradie_advice: form.client_tradie_advice,
        client_unresolved: form.client_unresolved,
        client_expectations: form.client_expectations,
      }),
      updated_at: new Date().toISOString(),
    }).eq('id', assessment.id)
    setSaving(false)
  }

  const share = async () => {
    if (!assessment || !job) return
    setSharing(true)
    const supabase = createClient()
    const field = isTradie ? 'tradie_shared_at' : 'client_shared_at'
    await supabase.from('site_assessments').update({
      [field]: new Date().toISOString(),
    }).eq('id', assessment.id)

    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: (isTradie ? profile.tradie?.business_name : profile.full_name) + ' has shared their site assessment notes. Please review and acknowledge before quoting begins.',
    })

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assessment_shared', job_id: job.id, shared_by: isTradie ? 'tradie' : 'client' }),
    }).catch(() => {})

    setAssessment((a: any) => ({ ...a, [field]: new Date().toISOString() }))
    setSharing(false)
  }

  const acknowledge = async () => {
    if (!assessment || !job) return
    setAcknowledging(true)
    const supabase = createClient()
    const field = isTradie ? 'tradie_acknowledged_at' : 'client_acknowledged_at'
    await supabase.from('site_assessments').update({
      [field]: new Date().toISOString(),
    }).eq('id', assessment.id)

    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: profile.id,
      body: (isTradie ? profile.tradie?.business_name : profile.full_name) + ' has acknowledged the site assessment notes. The assessment stage is complete.',
    })

    setAssessment((a: any) => ({ ...a, [field]: new Date().toISOString() }))
    setAcknowledging(false)

    // If both acknowledged, move to quotes
    const updated = { ...assessment, [field]: new Date().toISOString() }
    if (updated.client_acknowledged_at && updated.tradie_acknowledged_at) {
      const supabase2 = createClient()
      await supabase2.from('jobs').update({ status: 'quotes' }).eq('id', job.id)
      setTimeout(() => { window.location.href = isTradie ? '/tradie/dashboard' : '/quotes' }, 1200)
    }
  }

  const myShared = isTradie ? assessment?.tradie_shared_at : assessment?.client_shared_at
  const theirShared = isTradie ? assessment?.client_shared_at : assessment?.tradie_shared_at
  const myAcknowledged = isTradie ? assessment?.tradie_acknowledged_at : assessment?.client_acknowledged_at
  const theirAcknowledged = isTradie ? assessment?.client_acknowledged_at : assessment?.tradie_acknowledged_at
  const myPrompts = isTradie ? TRADIE_PROMPTS : CLIENT_PROMPTS
  const theirLabel = isTradie ? job?.client?.full_name : job?.tradie?.business_name

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif', lineHeight:'1.6' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64' }}>Loading...</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' as const }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No assessment in progress.</p>
        <a href="/shortlist" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'14px' }}>← Back to matches</a>
      </div>
    </div>
  )

  const STAGE_ORDER = ['matching', 'shortlisted', 'assess', 'quotes', 'agreement', 'delivery', 'signoff', 'warranty', 'complete']
  const jobIdx = STAGE_ORDER.indexOf(job.status)

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false}   />

      {/* STAGE RAIL */}
      <div style={{ borderBottom:'1px solid rgba(28,43,50,0.1)', background:'rgba(200,213,210,0.95)', padding:'0 24px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', display:'flex', overflowX:'auto' as const }}>
          {STAGE_RAIL.map(s => {
            const isComplete = jobIdx > s.n - 1
            const isCurrent = s.p === '/assess'
            return (
              <a key={s.n} href={s.p} style={{ textDecoration:'none', display:'flex', flexDirection:'column' as const, alignItems:'center', padding:'10px 16px', position:'relative', flexShrink:0, minWidth:'70px' }}>
                {isCurrent && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
                <div style={{ width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, border:'1.5px solid ' + (isComplete ? s.c : isCurrent ? s.c : 'rgba(28,43,50,0.2)'), background: isComplete ? s.c : '#C8D5D2', color: isComplete ? 'white' : isCurrent ? s.c : '#7A9098', marginBottom:'4px' }}>
                  {isComplete ? '✓' : s.n}
                </div>
                <div style={{ fontSize:'10px', color: isCurrent ? '#1C2B32' : isComplete ? s.c : '#7A9098', fontWeight: isCurrent ? 600 : 400 }}>{s.l}</div>
              </a>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth:'780px', margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#9B6B9B', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Stage 3</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>SITE ASSESSMENT</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'4px' }}>{job.title}</p>
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'8px' }}>{job.trade_category} · {job.suburb}</p>
        <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'32px' }}>
          Record your notes from the site consultation. Share them with {theirLabel} and acknowledge theirs before quoting begins. Both records become part of the job file.
        </p>

        {/* CONSULT DETAILS */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>CONSULTATION DETAILS</p>
          </div>
          <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'6px' }}>Date of site visit</p>
              <input type="date" value={form.consult_date ? new Date(form.consult_date).toISOString().split('T')[0] : ''} onChange={e => setF('consult_date', e.target.value)} style={inp} />
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'6px' }}>Who attended</p>
              <input type="text" value={form.consult_attendees || ''} onChange={e => setF('consult_attendees', e.target.value)} style={inp} placeholder="e.g. Homeowner + lead electrician" />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)', marginBottom:'20px' }}>
          <button type="button" onClick={() => setActiveTab('mine')}
            style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === 'mine' ? '2px solid #9B6B9B' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === 'mine' ? 600 : 400, color: activeTab === 'mine' ? '#1C2B32' : '#7A9098' }}>
            My notes {myShared ? '✓ Shared' : ''}
          </button>
          <button type="button" onClick={() => setActiveTab('theirs')}
            style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === 'theirs' ? '2px solid #9B6B9B' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === 'theirs' ? 600 : 400, color: activeTab === 'theirs' ? '#1C2B32' : '#7A9098' }}>
            {theirLabel}&apos;s notes {theirShared ? '✓ Shared' : '— not yet shared'}
          </button>
        </div>

        {activeTab === 'mine' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>YOUR ASSESSMENT NOTES</p>
              </div>
              <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>
                {myPrompts.map(prompt => (
                  <div key={prompt.key}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'6px' }}>{prompt.label}</p>
                    <textarea value={form[prompt.key] || ''} onChange={e => setF(prompt.key, e.target.value)}
                      rows={3} placeholder={prompt.placeholder}
                      style={{ ...inp, resize:'vertical' as const }}
                      disabled={!!myShared}
                    />
                  </div>
                ))}
              </div>
            </div>

            {!myShared ? (
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" onClick={save} disabled={saving}
                  style={{ flex:1, background:'transparent', color:'#1C2B32', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save draft'}
                </button>
                <button type="button" onClick={async () => { await save(); await share(); }}
                  disabled={sharing}
                  style={{ flex:2, background:'#9B6B9B', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: sharing ? 0.7 : 1 }}>
                  {sharing ? 'Sharing...' : 'Save and share with ' + theirLabel + ' →'}
                </button>
              </div>
            ) : (
              <div style={{ background:'rgba(155,107,155,0.06)', border:'1px solid rgba(155,107,155,0.2)', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#9B6B9B', marginBottom:'4px' }}>✓ Notes shared with {theirLabel}</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>Shared {new Date(myShared).toLocaleDateString('en-AU')} at {new Date(myShared).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}. Your notes are now locked.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'theirs' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            {!theirShared ? (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'48px', textAlign:'center' as const }}>
                <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.4 }}>📋</div>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>{theirLabel} hasn&apos;t shared their notes yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'20px' }}>You&apos;ll be notified by email when they share their assessment.</p>
                <a href="/messages" style={{ color:'#2E6A8F', textDecoration:'none', fontSize:'13px' }}>Send a reminder via messages →</a>
              </div>
            ) : (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>{theirLabel?.toUpperCase()}&apos;S NOTES</p>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:0 }}>Shared {new Date(theirShared).toLocaleDateString('en-AU')}</p>
                </div>
                <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>
                  {(isTradie ? CLIENT_PROMPTS : TRADIE_PROMPTS).map(prompt => {
                    const value = form[prompt.key]
                    if (!value) return null
                    return (
                      <div key={prompt.key} style={{ padding:'14px 16px', background:'#F4F8F7', borderRadius:'10px' }}>
                        <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'8px' }}>{prompt.label}</p>
                        <p style={{ fontSize:'13px', color:'#1C2B32', lineHeight:'1.6', margin:0 }}>{value}</p>
                      </div>
                    )
                  })}
                </div>
                {!myAcknowledged ? (
                  <div style={{ padding:'0 20px 20px' }}>
                    <button type="button" onClick={acknowledge} disabled={acknowledging}
                      style={{ width:'100%', background:'#1C2B32', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: acknowledging ? 0.7 : 1 }}>
                      {acknowledging ? 'Acknowledging...' : '✓ I have read and acknowledge these notes →'}
                    </button>
                    <p style={{ fontSize:'12px', color:'#7A9098', textAlign:'center' as const, marginTop:'8px' }}>Acknowledging does not mean you agree with everything — it means you have read the record.</p>
                  </div>
                ) : (
                  <div style={{ padding:'0 20px 20px' }}>
                    <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'12px 14px' }}>
                      <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:0 }}>✓ Acknowledged {new Date(myAcknowledged).toLocaleDateString('en-AU')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BOTH ACKNOWLEDGED */}
            {myAcknowledged && theirAcknowledged && (
              <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'12px', padding:'20px', textAlign:'center' as const }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>✓</div>
                <p style={{ fontSize:'15px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>Assessment complete</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px' }}>Both parties have acknowledged each other&apos;s notes. You&apos;re ready to review quotes.</p>
                <a href={isTradie ? '/tradie/dashboard' : '/quotes'}>
                  <button type="button" style={{ background:'#2E7D60', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                    {isTradie ? 'Back to dashboard →' : 'Proceed to quotes →'}
                  </button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* MESSAGES */}
        <a href={'/messages' + (job?.id ? '?job=' + job.id : '')} style={{ display:'block', marginTop:'24px', textDecoration:'none' }}>
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'16px' }}>💬</span>
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Continue the conversation</p>
              <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Message {theirLabel} about the assessment →</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  )
}
