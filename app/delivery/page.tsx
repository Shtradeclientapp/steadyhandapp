'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DeliveryPage() {
  const [job, setJob] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('client_id', session.user.id)
        .in('status', ['delivery', 'agreement'])
        .order('updated_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: ms } = await supabase
          .from('milestones')
          .select('*')
          .eq('job_id', jobs[0].id)
          .order('order_index', { ascending: true })

        if (ms && ms.length > 0) {
          setMilestones(ms)
        } else {
          const { data: scope } = await supabase
            .from('scope_agreements')
            .select('milestones, total_price')
            .eq('job_id', jobs[0].id)
            .single()

          if (scope?.milestones) {
            const rows = scope.milestones.map((m: any, i: number) => ({
              job_id: jobs[0].id,
              label: m.label,
              description: m.description,
              order_index: i + 1,
              percent: m.percent,
              amount: scope.total_price ? (scope.total_price * m.percent / 100) : 0,
              status: 'pending',
            }))
            await supabase.from('milestones').insert(rows)
            const { data: fresh } = await supabase.from('milestones').select('*').eq('job_id', jobs[0].id).order('order_index', { ascending: true })
            setMilestones(fresh || [])
          }
        }
      }
      setLoading(false)
    })
  }, [])

 const approveM = async (id: string, amount: number) => {
    const supabase = createClient()
    await supabase.from('milestones').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id)
    setMilestones(ms => ms.map(m => m.id === id ? { ...m, status: 'approved', approved_at: new Date().toISOString() } : m))
    if (amount > 0) {
      await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release_milestone', milestone_id: id }),
      })
    }
    const allDone = milestones.every(m => m.id === id ? true : m.status === 'approved')
    if (allDone && job) {
      await supabase.from('jobs').update({ status: 'signoff' }).eq('id', job.id)
    }
  }

  const nav = (
    <div>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Back to dashboard</a>
      </nav>
      <div style={{ position:'sticky', top:'64px', zIndex:90, background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' }}>
        {[
          { num:1, label:'Request', path:'/request', color:'#2E7D60' },
          { num:2, label:'Shortlist', path:'/shortlist', color:'#2E6A8F' },
          { num:3, label:'Agreement', path:'/agreement', color:'#6B4FA8' },
          { num:4, label:'Delivery', path:'/delivery', color:'#C07830' },
          { num:5, label:'Sign-off', path:'/signoff', color:'#D4522A' },
          { num:6, label:'Warranty', path:'/warranty', color:'#1A6B5A' },
        ].map(s => (
          <a key={s.num} href={s.path} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {s.path === '/delivery' && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.color }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, border:'1.5px solid ' + (s.num < 4 ? s.color : s.path === '/delivery' ? s.color : 'rgba(28,43,50,0.2)'), background: s.num < 4 ? s.color : '#C8D5D2', color: s.num < 4 ? 'white' : s.path === '/delivery' ? s.color : '#7A9098' }}>
              {s.num < 4 ? '✓' : s.num}
            </div>
            <div style={{ fontSize:'10px', color: s.path === '/delivery' ? '#1C2B32' : s.num < 4 ? s.color : '#7A9098', fontWeight: s.path === '/delivery' ? 600 : 400 }}>{s.label}</div>
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
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No job in delivery stage.</p>
        <a href="/agreement"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to agreement</button></a>
      </div>
    </div></>
  )

  const done = milestones.filter(m => m.status === 'approved').length
  const total = milestones.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ maxWidth:'780px', margin:'0 auto' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#C07830', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Stage 4</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>DELIVERY TRACKING</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6' }}>
          You confirm each milestone as it is completed. Payment releases only when you approve.
        </p>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'16px' }}>
            <div>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'4px' }}>{job.title}</h3>
              <p style={{ fontSize:'13px', color:'#7A9098' }}>{job.trade_category} · {job.suburb} · {job.tradie?.business_name}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#1C2B32' }}>{progress}%</div>
              <div style={{ fontSize:'11px', color:'#7A9098' }}>{done}/{total} milestones</div>
            </div>
          </div>
          <div style={{ height:'6px', background:'rgba(28,43,50,0.1)', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#C07830', borderRadius:'3px', width: progress + '%', transition:'width 0.4s' }} />
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
          {milestones.map((m, i) => {
            const isDone = m.status === 'approved'
            const isActive = !isDone && (i === 0 || milestones[i-1]?.status === 'approved')
            return (
              <div key={m.id} style={{ display:'flex', gap:'16px', position:'relative' }}>
                {i < milestones.length - 1 && (
                  <div style={{ position:'absolute', left:'19px', top:'40px', bottom:'-2px', width:'1px', background:'rgba(28,43,50,0.1)' }} />
                )}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:'4px' }}>
                  <div style={{
                    width:'22px', height:'22px', borderRadius:'50%', border:'2px solid',
                    borderColor: isDone ? '#2E7D60' : isActive ? '#C07830' : 'rgba(28,43,50,0.2)',
                    background: isDone ? '#2E7D60' : isActive ? '#1C2B32' : '#C8D5D2',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'10px', color: isDone || isActive ? 'white' : '#7A9098',
                    flexShrink:0, zIndex:1
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                </div>
                <div style={{ padding:'4px 0 28px', flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                    <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px' }}>{m.label}</h3>
                    {isDone && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'2px 8px', fontSize:'10px', color:'#2E7D60' }}>Approved</span>}
                    {isActive && !isDone && <span style={{ background:'rgba(192,120,48,0.1)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'100px', padding:'2px 8px', fontSize:'10px', color:'#C07830' }}>Action needed</span>}
                  </div>
                  <p style={{ fontSize:'13px', color:'#7A9098', lineHeight:'1.55', marginBottom:'8px' }}>{m.description}</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'10px' }}>
                    {m.percent}% of total{m.amount > 0 ? ' · $' + Number(m.amount).toLocaleString() : ''}
                    {isDone && m.approved_at ? ' · Approved ' + new Date(m.approved_at).toLocaleDateString('en-AU') : ''}
                  </p>
                  {isActive && !isDone && (
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      <button type="button" onClick={() => approveM(m.id, m.amount || 0)}
                        style={{ background:'#2E7D60', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'none', cursor:'pointer' }}>
                        Approve milestone →
                      </button>
                      <button type="button"
                        style={{ background:'transparent', color:'#D4522A', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(212,82,42,0.3)', cursor:'pointer' }}>
                        Flag an issue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {done === total && total > 0 && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'20px', textAlign:'center', marginTop:'8px' }}>
            <p style={{ fontSize:'15px', color:'#2E7D60', fontWeight:'500', marginBottom:'12px' }}>All milestones complete. Ready for final sign-off.</p>
            <a href="/signoff">
              <button style={{ background:'#2E7D60', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer' }}>
                Go to sign-off →
              </button>
            </a>
          </div>
        )}
      </div>
    </div></>
  )
}