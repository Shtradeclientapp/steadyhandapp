'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGES: Record<string, { label: string; path: string; color: string }> = {
  draft:       { label: 'Draft',             path: '/request',   color: '#7A9098' },
  matching:    { label: 'AI Matching',        path: '/shortlist',  color: '#2E6A8F' },
  shortlisted: { label: 'Review shortlist',   path: '/shortlist',  color: '#2E6A8F' },
  agreement:   { label: 'Sign agreement',     path: '/agreement',  color: '#6B4FA8' },
  delivery:    { label: 'In delivery',        path: '/delivery',   color: '#C07830' },
  signoff:     { label: 'Ready for sign-off', path: '/signoff',    color: '#D4522A' },
  warranty:    { label: 'Under warranty',     path: '/warranty',   color: '#1A6B5A' },
  complete:    { label: 'Complete',           path: '/warranty',   color: '#2E7D60' },
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const { data } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })
      setJobs(data || [])
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const activeJobs = jobs.filter(j => j.status !== 'complete')
  const doneJobs = jobs.filter(j => j.status === 'complete')

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <a href="/messages" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px' }}>Messages</a>
<span style={{ fontSize:'13px', color:'#4A5E64' }}>{user?.email}</span>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', color:'#1C2B32', padding:'7px 14px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ background:'#1C2B32', padding:'40px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,82,42,0.12), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Client dashboard</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(24px, 5vw, 36px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>STEADYHAND</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', fontWeight:300 }}>Request-to-warranty · Western Australia</p>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>
        <div className="dashboard-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'28px' }}>
          {[
            { label:'Active jobs', value: activeJobs.length },
            { label:'Under warranty', value: jobs.filter(j => j.status === 'warranty').length },
            { label:'Complete', value: doneJobs.length },
          ].map(s => (
            <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'6px' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'#1C2B32', letterSpacing:'1px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'#2E7D60', borderRadius:'14px', padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'32px' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'white', letterSpacing:'1px', marginBottom:'4px' }}>START A NEW REQUEST</h2>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>Define your job, get AI-matched tradies, set the scope.</p>
          </div>
          <a href="/request" style={{ background:'white', color:'#2E7D60', padding:'13px 24px', borderRadius:'10px', fontSize:'14px', fontWeight:600, textDecoration:'none', fontFamily:'var(--font-aboreto), sans-serif', letterSpacing:'1px', whiteSpace:'nowrap' as const }}>
            NEW REQUEST
          </a>
        </div>

        {activeJobs.length > 0 && (
          <div style={{ marginBottom:'28px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'14px' }}>ACTIVE JOBS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {activeJobs.map(job => {
                const stage = STAGES[job.status] || STAGES.draft
                return (
                  <a key={job.id} href={stage.path} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid ' + stage.color, borderRadius:'11px', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', transition:'background 0.15s', cursor:'pointer' }}>
                      <div style={{ flex:1, minWidth:'200px' }}>
                        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px', marginBottom:'4px' }}>{job.title}</div>
                        <div style={{ fontSize:'12px', color:'#7A9098' }}>{job.trade_category} · {job.suburb}{job.tradie?.business_name ? ' · ' + job.tradie.business_name : ''}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                        <span style={{ background: stage.color + '18', border:'1px solid ' + stage.color + '40', borderRadius:'100px', padding:'4px 12px', fontSize:'11px', fontWeight:500, color: stage.color }}>
                          {stage.label}
                        </span>
                        <span style={{ fontSize:'18px', color:'#7A9098' }}>→</span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {jobs.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>🏗</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No jobs yet</p>
            <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'20px' }}>Post your first job request to get started.</p>
            <a href="/request">
              <button style={{ background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer' }}>
                Post a request →
              </button>
            </a>
          </div>
        )}

        {doneJobs.length > 0 && (
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'14px' }}>COMPLETED JOBS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {doneJobs.map(job => (
                <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid #2E7D60', borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', opacity:0.7 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'0.3px' }}>{job.title}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{job.trade_category} · {job.suburb}</div>
                  </div>
                  <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60' }}>Complete</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
