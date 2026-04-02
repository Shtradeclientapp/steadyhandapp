'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HintPanel } from '@/components/ui/HintPanel'

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [shortlist, setShortlist] = useState<any[]>([])
  const [matching, setMatching] = useState(false)
  const [selected, setSelected] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
 const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ business_name:'', email:'', trade_category:'', phone:'' })
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', session.user.id)
        .in('status', ['matching', 'shortlisted', 'agreement'])
        .order('created_at', { ascending: false })
      if (!jobsData || jobsData.length === 0) { setLoading(false); return }
      setJobs(jobsData)
      setSelectedJob(jobsData[0])
      const existing = await loadShortlist(jobsData[0].id)
      if (!existing || existing.length === 0) {
        setMatching(true)
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
          body: JSON.stringify({ job_id: jobsData[0].id }),
        })
        const data = await res.json()
        if (data.shortlist) await loadShortlist(jobsData[0].id)
        setMatching(false)
      }
      setLoading(false)
    })
  }, [])

  const loadShortlist = async (jobId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('shortlist')
      .select('*, tradie:tradie_profiles(*, profile:profiles(*))')
      .eq('job_id', jobId)
      .order('rank', { ascending: true })
    setShortlist(data || [])
    return data
  }

  const runMatching = async () => {
    if (!selectedJob) return
    setMatching(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session?.access_token },
      body: JSON.stringify({ job_id: selectedJob.id }),
    })
    const data = await res.json()
    if (data.shortlist) await loadShortlist(selectedJob.id)
    setMatching(false)
  }

  const selectTradie = async (tradieId: string) => {
    setSelected(tradieId)
    const supabase = createClient()
    await supabase.from('jobs').update({ tradie_id: tradieId, status: 'agreement' }).eq('id', selectedJob.id)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tradie_selected', job_id: selectedJob.id }),
    })
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tradie_selected', job_id: selectedJob.id }),
    })
    setTimeout(() => { window.location.href = '/agreement' }, 1000)
  }

  const nav = (
    <div>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
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
    </div>
  )

  if (loading) return (
    <>
      {nav}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}>
        <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
      </div>
    </>
  )

  return (
    <>
      {nav}
      <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', padding:'40px 24px' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#2E6A8F', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Stage 2</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>YOUR SHORTLIST</h1>

          <HintPanel color="#2E6A8F" hints={[
            "Steadyhand ranks tradies by category fit, location, track record and verification status — not by who pays to be listed.",
            "Check each tradie's completed job count and rating before selecting. More jobs means more experience on the platform.",
            "Verified licence and insurance badges mean Steadyhand has checked the tradie's credentials. Only select verified tradies.",
            "You're not committing to anything by viewing the shortlist. Take your time before selecting.",
          ]} />

          <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6', fontFamily:'sans-serif' }}>
            These tradies match your request. Review each one, then select who you'd like to proceed with.
          </p>

          {jobs.length > 1 && (
            <div style={{ marginBottom:'24px' }}>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32', fontFamily:'sans-serif', marginBottom:'6px', display:'block' }}>Select job</label>
              <select value={selectedJob?.id || ''} onChange={async e => {
                const job = jobs.find(j => j.id === e.target.value)
                setSelectedJob(job)
                await loadShortlist(job.id)
              }} style={{ padding:'10px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', width:'100%' }}>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.suburb}</option>)}
              </select>
            </div>
          )}

          {selectedJob && (
            <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'20px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'10px' }}>
                  <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
                  <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' as const }}>Steadyhand matching</span>
                </div>
                <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'6px' }}>{selectedJob.title}</h3>
                <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)', fontFamily:'sans-serif' }}>{selectedJob.trade_category} · {selectedJob.suburb}</p>
              </div>
            </div>
          )}

          {shortlist.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px', background:'#E8F0EE', borderRadius:'14px', marginBottom:'24px', border:'1px solid rgba(28,43,50,0.1)' }}>
              {matching ? (
                <>
                  <div style={{ fontSize:'32px', marginBottom:'12px' }}>🔍</div>
                  <p style={{ fontSize:'15px', color:'#1C2B32', fontWeight:500, marginBottom:'6px' }}>Finding your best matches...</p>
                  <p style={{ fontSize:'13px', color:'#7A9098', lineHeight:'1.6' }}>Steadyhand is reviewing your job and ranking verified local tradies.</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>No matches found. Try running matching again.</p>
                  <button type="button" onClick={runMatching} style={{ background:'#2E7D60', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                    Retry matching →
                  </button>
                </>
              )}
            </div>
          )}

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
                    <div key={entry.id} style={{ background:'#E8F0EE', border: i === 0 ? '1.5px solid #D4522A' : '1.5px solid rgba(28,43,50,0.12)', borderTop: i === 0 ? '3px solid #D4522A' : '1.5px solid rgba(28,43,50,0.12)', borderRadius:'14px', padding:'24px', position:'relative' as const }}>
                      {i === 0 && (
                        <div style={{ position:'absolute', top:'12px', right:'12px', background:'#D4522A', color:'white', fontSize:'9px', fontWeight:'600', padding:'3px 8px', borderRadius:'100px', fontFamily:'sans-serif', letterSpacing:'0.5px' }}>
                          STEADYHAND TOP PICK
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
                        <div style={{ marginLeft:'auto', textAlign:'right' as const }}>
                          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A' }}>{Math.round(entry.ai_score)}%</div>
                          <div style={{ fontSize:'10px', color:'#7A9098', fontFamily:'sans-serif' }}>match score</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' as const }}>
                        {t?.licence_verified && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60', fontFamily:'sans-serif' }}>✓ Licence verified</span>}
                        {t?.insurance_verified && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'3px 10px', fontSize:'11px', color:'#2E7D60', fontFamily:'sans-serif' }}>✓ Insurance current</span>}
                      </div>
                      <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'9px', padding:'12px 14px', marginBottom:'14px' }}>
                        <div style={{ fontSize:'9px', fontWeight:'600', letterSpacing:'0.8px', textTransform:'uppercase' as const, color:'#D4522A', marginBottom:'4px', fontFamily:'sans-serif' }}>Why Steadyhand recommends</div>
                        <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', fontFamily:'sans-serif' }}>{entry.ai_reasoning}</p>
                      </div>
                      <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.55', marginBottom:'14px', fontFamily:'sans-serif' }}>{t?.bio}</p>
                      <button onClick={() => selectTradie(t.id)} disabled={!!selected}
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
