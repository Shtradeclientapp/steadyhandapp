'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AgreementPage() {
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [clientSigned, setClientSigned] = useState(false)
  const [tradieSigned, setTradieSigned] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(*))')
        .eq('client_id', session.user.id)
        .in('status', ['agreement', 'shortlisted'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: scopeData } = await supabase
          .from('scope_agreements')
          .select('*')
          .eq('job_id', jobs[0].id)
          .single()
        if (scopeData) {
          setScope(scopeData)
          setClientSigned(!!scopeData.client_signed_at)
          setTradieSigned(!!scopeData.tradie_signed_at)
        }
      }
      setLoading(false)
    })
  }, [])

  const draftScope = async () => {
    if (!job) return
    setSigning(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session?.access_token },
      body: JSON.stringify({ job_id: job.id }),
    })
    const data = await res.json()
    if (data.scope) setScope(data.scope)
    setSigning(false)
  }

  const signScope = async () => {
    if (!job || !scope) return
    setSigning(true)
    const supabase = createClient()
    await supabase
      .from('scope_agreements')
      .update({ client_signed_at: new Date().toISOString() })
      .eq('id', scope.id)
    await supabase
      .from('jobs')
      .update({ status: 'delivery' })
      .eq('id', job.id)
    setClientSigned(true)
    setTimeout(() => {
      setTradieSigned(true)
    }, 2000)
    setSigning(false)
  }

  const nav = (
    <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
      <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
      <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Back to dashboard</a>
    </nav>
    <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' }}>
      {[{n:1,l:'Request',p:'/request',c:'#2E7D60'},{n:2,l:'Shortlist',p:'/shortlist',c:'#2E6A8F'},{n:3,l:'Agreement',p:'/agreement',c:'#6B4FA8'},{n:4,l:'Delivery',p:'/delivery',c:'#C07830'},{n:5,l:'Sign-off',p:'/signoff',c:'#D4522A'},{n:6,l:'Warranty',p:'/warranty',c:'#1A6B5A'}].map(s => (
        <a key={s.n} href={s.p} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
          {s.p === '/shortlist' && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
          <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (s.n < 2 ? '#2E7D60' : s.p === '/shortlist' ? s.c : 'rgba(28,43,50,0.2)'), background: s.n < 2 ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: s.n < 2 ? 'white' : s.p === '/shortlist' ? s.c : '#7A9098' }}>
            {s.n < 2 ? '✓' : s.n}
          </div>
          <div style={{ fontSize:'10px', color: s.p === '/shortlist' ? '#1C2B32' : s.n < 2 ? '#2E7D60' : '#7A9098', fontWeight: s.p === '/shortlist' ? 600 : 400 }}>{s.l}</div>
        </a>
      ))}
    </div>
  )

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div></>

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No job in agreement stage.</p>
        <a href="/shortlist"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to shortlist</button></a>
      </div>
    </div></>
  )

  const milestones = scope?.milestones || []

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ maxWidth:'680px', margin:'0 auto' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#6B4FA8', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Stage 3</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>SCOPE AGREEMENT</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6' }}>
          Review the scope, make any edits, then sign before work begins. This is your protection throughout the job.
        </p>

        <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'20px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'10px' }}>
              <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
              <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' }}>AI drafted</span>
            </div>
            <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>{job.title}</h3>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)' }}>{job.trade_category} · {job.suburb} · {job.tradie?.business_name || 'Tradie assigned'}</p>
          </div>
        </div>

        {!scope && (
          <div style={{ textAlign:'center', padding:'40px', background:'#E8F0EE', borderRadius:'14px', marginBottom:'24px', border:'1px solid rgba(28,43,50,0.1)' }}>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>
              No scope drafted yet. Click below to have Claude draft a scope agreement from your job details.
            </p>
            <button type="button" onClick={draftScope} disabled={signing}
              style={{ background:'#6B4FA8', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity: signing ? 0.7 : 1 }}>
              {signing ? 'Drafting scope...' : 'Draft scope with AI →'}
            </button>
          </div>
        )}

        {scope && (
          <>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>

              <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'12px', fontWeight:'500' }}>Job details</p>
                {[
                  { label:'Job title', value: job.title },
                  { label:'Trade', value: job.trade_category },
                  { label:'Location', value: job.suburb + ', WA' },
                  { label:'Tradie', value: job.tradie?.business_name || 'TBA' },
                  { label:'Warranty', value: (scope.warranty_days || 90) + ' days from sign-off' },
                  { label:'Response SLA', value: (scope.response_sla_days || 5) + ' business days' },
                  { label:'Remediation', value: (scope.remediation_days || 14) + ' days or Steadyhand mediates' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', gap:'12px', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <span style={{ fontSize:'13px', color:'#7A9098', minWidth:'120px', flexShrink:0 }}>{item.label}</span>
                    <span style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {scope.inclusions && scope.inclusions.length > 0 && (
                <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'12px', fontWeight:'500' }}>What is included</p>
                  {scope.inclusions.map((item: string, i: number) => (
                    <div key={i} style={{ display:'flex', gap:'10px', padding:'6px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <span style={{ color:'#2E7D60', fontSize:'13px', flexShrink:0 }}>✓</span>
                      <span style={{ fontSize:'13px', color:'#1C2B32' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {scope.exclusions && scope.exclusions.length > 0 && (
                <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'12px', fontWeight:'500' }}>What is excluded</p>
                  {scope.exclusions.map((item: string, i: number) => (
                    <div key={i} style={{ display:'flex', gap:'10px', padding:'6px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <span style={{ color:'#D4522A', fontSize:'13px', flexShrink:0 }}>×</span>
                      <span style={{ fontSize:'13px', color:'#1C2B32' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {milestones.length > 0 && (
                <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'12px', fontWeight:'500' }}>Payment milestones</p>
                  {milestones.map((m: any, i: number) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>{m.label}</div>
                        <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{m.description}</div>
                      </div>
                      <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32', flexShrink:0 }}>{m.percent}%</div>
                    </div>
                  ))}
                </div>
              )}

              {scope.total_price > 0 && (
                <div style={{ padding:'18px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'14px', fontWeight:'500', color:'#1C2B32' }}>Total agreed price</span>
                    <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#1C2B32' }}>${Number(scope.total_price).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:'16px', marginBottom:'20px' }}>
              <div onClick={!clientSigned ? signScope : undefined}
                style={{ flex:1, background: clientSigned ? 'rgba(46,125,96,0.06)' : '#E8F0EE', border: '1.5px ' + (clientSigned ? 'solid #2E7D60' : 'dashed rgba(28,43,50,0.2)'), borderRadius:'10px', padding:'20px', textAlign:'center', cursor: clientSigned ? 'default' : 'pointer', transition:'all 0.2s' }}>
                {clientSigned ? (
                  <>
                    <div style={{ fontSize:'20px', color:'#2E7D60', marginBottom:'4px' }}>✓</div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>Signed</div>
                    <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>Your signature</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:'24px', marginBottom:'6px' }}>✍️</div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>Sign as client</div>
                    <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>Click to sign</div>
                  </>
                )}
              </div>

              <div style={{ flex:1, background: tradieSigned ? 'rgba(46,125,96,0.06)' : '#E8F0EE', border: '1.5px ' + (tradieSigned ? 'solid #2E7D60' : 'dashed rgba(28,43,50,0.2)'), borderRadius:'10px', padding:'20px', textAlign:'center' }}>
                {tradieSigned ? (
                  <>
                    <div style={{ fontSize:'20px', color:'#2E7D60', marginBottom:'4px' }}>✓</div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>Signed</div>
                    <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>Tradie signature</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:'24px', marginBottom:'6px' }}>⏳</div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32' }}>Awaiting tradie</div>
                    <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>Notified to sign</div>
                  </>
                )}
              </div>
            </div>

            {clientSigned && tradieSigned && (
              <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'16px', marginBottom:'20px', textAlign:'center' }}>
                <p style={{ fontSize:'14px', color:'#2E7D60', fontWeight:'500', marginBottom:'8px' }}>Both parties have signed. Work can begin.</p>
                <a href="/delivery">
                  <button style={{ background:'#2E7D60', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer' }}>
                    Go to delivery tracking →
                  </button>
                </a>
              </div>
            )}

            {!clientSigned && (
              <p style={{ fontSize:'12px', color:'#7A9098', textAlign:'center' }}>
                Work cannot begin until both parties have signed. The signed agreement is stored permanently on your job record.
              </p>
            )}
          </>
        )}
      </div>
    </div></>
  )
}