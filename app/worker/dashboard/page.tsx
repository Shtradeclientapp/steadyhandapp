'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkerDashboardPage() {
  const [worker, setWorker] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const timeout = setTimeout(() => { window.location.href = '/login' }, 8000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (!session) { window.location.href = '/login'; return }
      const { data: workerData } = await supabase
        .from('tradie_workers')
        .select('*, tradie:tradie_profiles!tradie_workers_tradie_id_fkey(business_name, logo_url)')
        .eq('profile_id', session.user.id)
        .eq('status', 'active')
        .single()
      if (!workerData) { window.location.href = '/login'; return }
      setWorker(workerData)
      const { data: assignData } = await supabase
        .from('job_worker_assignments')
        .select('*, job:jobs(id, title, suburb, status, address)')
        .eq('worker_id', workerData.id)
        .order('assigned_date', { ascending: false })
      setAssignments(assignData || [])
      setLoading(false)
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#4A5E64', fontSize:'14px' }}>Loading your jobs...</p>
    </div>
  )

  const activeAssignments = assignments.filter(a => a.job?.status && !['complete','cancelled'].includes(a.job.status))
  const pastAssignments = assignments.filter(a => a.job?.status && ['complete','cancelled'].includes(a.job.status))

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky' as const, top:0, zIndex:100 }}>
        <div>
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
          <div style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'1px' }}>FIELD TEAM</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'12px', color:'#4A5E64' }}>{worker?.name}</span>
          <button onClick={handleSignOut} style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'5px 10px', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>
      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'24px 20px' }}>
        <div style={{ background:'#0A0A0A', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'14px' }}>
          {worker?.tradie?.logo_url
            ? <img src={worker.tradie.logo_url} alt="" style={{ width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover' as const }} />
            : <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:'rgba(216,228,225,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'rgba(216,228,225,0.7)', fontFamily:'var(--font-aboreto), sans-serif' }}>{worker?.tradie?.business_name?.charAt(0) || '?'}</div>
          }
          <div>
            <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.5)', margin:'0 0 2px', letterSpacing:'1px', textTransform:'uppercase' as const }}>Working for</p>
            <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.9)', margin:0, fontWeight:600 }}>{worker?.tradie?.business_name}</p>
          </div>
        </div>

        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'1px', margin:'0 0 14px' }}>
          YOUR JOBS{activeAssignments.length > 0 ? ` (${activeAssignments.length})` : ''}
        </h2>

        {activeAssignments.length === 0 ? (
          <div style={{ background:'#E8F0EE', borderRadius:'12px', padding:'28px', textAlign:'center' as const, marginBottom:'24px' }}>
            <p style={{ fontSize:'14px', color:'#4A5E64', margin:'0 0 4px', fontWeight:500 }}>No jobs assigned yet</p>
            <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Your leading hand will assign you to jobs shortly.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'24px' }}>
            {activeAssignments.map(a => (
              <a key={a.id} href={`/worker/job?id=${a.id}`} style={{ textDecoration:'none' }}>
                <div style={{ background:'white', borderRadius:'12px', padding:'16px 18px', border:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{a.job?.title || 'Untitled job'}</p>
                    <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 6px' }}>{a.job?.suburb || a.job?.address || 'Location TBC'}</p>
                    {a.site_brief && <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5', background:'rgba(46,125,96,0.06)', borderRadius:'6px', padding:'6px 8px' }}>📋 {a.site_brief.slice(0, 80)}{a.site_brief.length > 80 ? '...' : ''}</p>}
                  </div>
                  <span style={{ fontSize:'18px', color:'#9AA5AA', flexShrink:0 }}>→</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {pastAssignments.length > 0 && (
          <>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'1px', margin:'0 0 14px' }}>COMPLETED</h2>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {pastAssignments.map(a => (
                <a key={a.id} href={`/worker/job?id=${a.id}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:'10px', padding:'12px 16px', border:'1px solid rgba(28,43,50,0.06)' }}>
                    <p style={{ fontSize:'13px', color:'#7A9098', margin:'0 0 2px' }}>{a.job?.title}</p>
                    <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{a.job?.suburb}</p>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
