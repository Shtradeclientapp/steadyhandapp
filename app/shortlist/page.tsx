'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [shortlist, setShortlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })

      setJobs(jobsData || [])
      if (jobsData && jobsData.length > 0) {
        setSelectedJob(jobsData[0])
        loadShortlist(jobsData[0].id, session.access_token)
      }
      setLoading(false)
    })
  }, [])

  const loadShortlist = async (jobId: string, token: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('shortlist')
      .select('*, tradie:tradie_profiles(*, profile:profiles(*))')
      .eq('job_id', jobId)
      .order('rank', { ascending: true })
    setShortlist(data || [])
  }

  const runMatching = async () => {
    if (!selectedJob) return
    setMatching(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ job_id: selectedJob.id }),
    })
    const data = await res.json()
    if (data.shortlist) {
      await loadShortlist(selectedJob.id, session?.access_token || '')
    }
    setMatching(false)
  }

  const selectTradie = async (tradieId: string) => {
    setSelected(tradieId)
    const supabase = createClient()
    await supabase
      .from('jobs')
      .update({ tradie_id: tradieId, status: 'agreement' })
      .eq('id', selectedJob.id)
    setTimeout(() => { window.location.href = '/dashboard' }, 1000)
  }

  const nav = (
    <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
      <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
      <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
    </nav>
  )

  if (loading) return (
    <>
      {nav}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}>
        <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
      </div>
    </>
  )

  return (
    <>
      {nav}
      <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#2E6A8F', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Stage 2</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>YOUR AI SHORTLIST</h1>
          <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6', fontFamily:'sans-serif' }}>
            These tradies match your request. Review each one, then select who you'd like to proceed with.
          </p>

          {/* Job selector */}
          {jobs.length > 1 && (
            <div style={{ marginBottom:'24px' }}>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32', fontFamily:'sans-serif', marginBottom:'6px', display:'block' }}>Select job</label>
              <select
                value={selectedJob?.id || ''}
                onChange={async e => {
                  const job = jobs.find(j => j.id === e.target.value)
                  setSelectedJob(job)
                  const supabase = createClient()
                  const { data: { session } } = await supabase.auth.getSession()
                  if (session) loadShortlist(job.id, session.access_token)
                }}
                style={{ padding:'10px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', width:'100%' }}>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.suburb}</option>)}
              </select>
            </div>
          )}

          {/* Selected job summary */}
          {selectedJob && (
            <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'20px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'10px' }}>
                  <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
                  <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' }}>AI matching</span>
                </div>
                <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'6px' }}>{selectedJob.title}</h3>
                <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)', fontFamily:'sans-serif' }}>{selectedJob.trade_category} · {selectedJob.suburb} · Status: {selectedJob.status}</p>
              </div>
            </div>
          )}

          {/* Run matching button */}
          {shortlist.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px', background:'#E8F0EE', borderRadius:'14px', marginBottom:'24px', border:'1px solid rgba(28,43,50,0.1)' }}>
              <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'20px', fontFamily:'sans-serif', lineHeight:'1.6' }}>
                No shortlist yet. Click below to run AI matching for this job.
              </p>
              <button
                onClick={runMatching}
                disabled={matching}
                style={{ background:'#2E7D60', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', fontFamily:'sans-serif', opacity: matching ? 0.7 : 1 }}>
                {matching ? 'Matching in progress...' : 'Run AI matching →'}
              </button>
            </div>
          )}

          {/* Shortlist cards */}
          {shortlist.length > 0 && (
            <>
              <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', fontFamily:'sans-serif' }}>
                {shortlist.length} tradies matched — select one to proceed to the agreement stage.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {shortlist.map((entry, i) => {
                  const t = entry.tradie
                  const isSelected = selected === t?.id
                  return (
                    <div key={entry.id} style={{
                      background: i === 0 ? '#E8F0EE' : '#E8F0EE',
                      border: `1.5px solid ${i === 0 ? '#D4522A' : 'rgba(28,43,50,0.12)'}`,
                      borderTop: i === 0 ? '3px solid #D4522A' : '1.5px solid rgba(28,43,50,0.12)',
                      borderRadius:'14px', padding:'24px', position:'relative'
                    }}>
                      {i === 0 && (
                        <div style={{ position:'absolute', top:'12px', right:'12px', background:'#D4522A', color:'white', fontSize:'9px', fontWeight:'600', padding:'3px 8px', borderRadius:'100px', fontFamily:'sans-serif', letterSpacing:'0.5px' }}>
                          AI TOP PICK
                        </div>
                      )}

                      <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
                        <div style={{ width:'48px', height:'48px', borderRadius:'11px', background: i === 0 ? '#2E7D60' : i === 1 ? '#2E6A8F' : '#6B4FA8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'white', flexShrink:0 }}>
                          {t?.business_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.5px' }}>{t?.business_name}</div>
                          <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px', fontFamily:'sans-serif' }}>
                            {t?.service_areas?.[0]} · ⭐ {Number(t?.rating_avg).toFixed(1)} · {t?.jobs_completed} jobs
                          </div>
                        </div>
                        <div style={{ marginLeft:'auto', textAlign:'right' }}>
                          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A' }}>{Math.round(entry.ai_score)}%</div>
                          <div style={{ fontSize:'10px', color:'#7A9098', fontFamily:'sans-serif' }}>match score</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                        {t?.licence_verified && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60', fontFamily:'sans-serif' }}>✓ Licence verified</span>}
                        {t?.insurance_verified && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60', fontFamily:'sans-serif' }}>✓ Insurance current</span>}
                      </div>

                      <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'9px', padding:'12px 14px', marginBottom:'14px' }}>
                        <div style={{ fontSize:'9px', fontWeight:'600', letterSpacing:'0.8px', textTransform:'uppercase', color:'#D4522A', marginBottom:'4px', fontFamily:'sans-serif' }}>Why AI recommends</div>
                        <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', fontFamily:'sans-serif' }}>{entry.ai_reasoning}</p>
                      </div>

                      <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', marginBottom:'14px', fontFamily:'sans-serif' }}>{t?.bio}</p>

                      <button
                        onClick={() => selectTradie(t.id)}
                        disabled={!!selected}
                        style={{ width:'100%', background: isSelected ? '#2E7D60' : '#1C2B32', color:'white', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', fontFamily:'sans-serif', opacity: selected && !isSelected ? 0.5 : 1 }}>
                        {isSelected ? '✓ Selected — proceeding to agreement...' : 'Select this tradie →'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}