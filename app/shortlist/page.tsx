'use client'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'
import { StageRail, WaitingPanel } from '@/components/ui'

const TRADE_CATEGORIES = [
  'Electrical','Plumbing','Carpentry','Painting','Tiling','Roofing',
  'Landscaping','Concreting','Bricklaying','Plastering','Flooring',
  'Air Conditioning','Solar','Fencing','Demolition','Waterproofing',
  'Cabinetry','Glazing','Rendering','Pest Control','Other'
]

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'matches'|'browse'|'invite'|'requested'>('matches')

  // AI matches
  const [matches, setMatches] = useState<any[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchReasons, setMatchReasons] = useState<Record<string,string>>({})
  const [selectedTradies, setSelectedTradies] = useState<string[]>([])

  // Browse / Google Places
  const [browseCategory, setBrowseCategory] = useState('')
  const [browseSuburb, setBrowseSuburb] = useState('')
  const [suburbSuggestions, setSuburbSuggestions] = useState<string[]>([])
  const [browseResults, setBrowseResults] = useState<any[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const suburbRef = useRef<HTMLInputElement>(null)

  // Invite
  const [inviteForm, setInviteForm] = useState({ business_name:'', email:'', trade_category:'', phone:'', personal_message:'' })
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [inviteSent, setInviteSent] = useState(false)

  // Send state
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string|null>(null)
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [allQuotes, setAllQuotes] = useState<any[]>([])

  const supabase = useSupabase()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const urlJobId = new URLSearchParams(window.location.search).get('job_id')
      let q = supabase.from('jobs').select('*').eq('client_id', session.user.id)
        .in('status', ['draft','matching','shortlisted','consult','assess','compare','quote','agreement','delivery','signoff','warranty','complete'])
        .order('created_at', { ascending: false })
      if (urlJobId) q = q.eq('id', urlJobId)
      const { data: jobsData } = await q
      setJobs(jobsData || [])
      const job = urlJobId ? jobsData?.find((j:any) => j.id === urlJobId) : jobsData?.[0]
      if (job) {
        setSelectedJob(job)
        loadJobData(job.id, session.user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const loadJobData = async (jobId: string, userId: string) => {
    const [{ data: qrs }, { data: quotes }] = await Promise.all([
      supabase.from('quote_requests').select('*, tradie:tradie_profiles(business_name, trade_category, suburb)').eq('job_id', jobId),
      supabase.from('quotes').select('*').eq('job_id', jobId),
    ])
    setQuoteRequests(qrs || [])
    setAllQuotes(quotes || [])
    if ((qrs || []).length > 0) setTab('requested')
    else triggerAIMatch(jobId)
  }

  const triggerAIMatch = async (jobId: string) => {
    setMatchLoading(true)
    try {
      await fetch('/api/match', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job_id: jobId }) })
      const { data } = await supabase.from('tradie_profiles')
        .select('id, business_name, trade_categories, service_areas, bio, logo_url, licence_verified, dialogue_score_avg')
        .eq('licence_verified', true)
        .limit(20)
      const tradies = data || []
      setMatches(tradies)
      // Generate match reasoning for each tradie
      if (tradies.length > 0 && jobs.length > 0) {
        const jobDesc = jobs[0].description || ''
        const jobTrade = jobs[0].trade_category || ''
        const jobSuburb = jobs[0].suburb || ''
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            messages: [{ role: 'user', content: 'For each tradie below, write a single sentence explaining why they are a good match for this job. Return ONLY valid JSON: {"reasons": {"<id>": "<sentence>"}}.\n\nJob: ' + jobTrade + ' in ' + jobSuburb + '\nDescription: ' + jobDesc.slice(0,200) + '\n\nTradies:\n' + tradies.slice(0,6).map((t: any) => t.id + ': ' + t.business_name + ' — ' + (t.trade_categories?.[0] || ''||'') + ' — ' + (t.suburb||'') + ' — score: ' + (t.dialogue_score_avg||0)).join('\n') }]
          })
        }).then(r => r.json()).then(data => {
          const text = data.content?.find((b: any) => b.type === 'text')?.text || ''
          const clean = text.replace(/```json|```/g, '').trim()
          try { setMatchReasons(JSON.parse(clean).reasons || {}) } catch {}
        }).catch(console.error)
      }
    } catch(e) { console.error(e) }
    setMatchLoading(false)
  }

  const browseDirectory = async () => {
    setBrowseLoading(true)
    let q = supabase.from('tradie_profiles')
      .select('id, business_name, trade_categories, service_areas, bio, logo_url, licence_verified, dialogue_score_avg')
      .eq('licence_verified', true)
    if (browseCategory) q = q.eq('trade_category', browseCategory)
    if (browseSuburb) q = q.ilike('service_areas', '%' + browseSuburb + '%')
    const { data } = await q.limit(30)
    setBrowseResults(data || [])
    setBrowseLoading(false)
  }

  const fetchSuburbSuggestions = async (val: string) => {
    if (val.length < 2) { setSuburbSuggestions([]); return }
    const r = await fetch('/api/places?query=' + encodeURIComponent(val) + '&type=suburb')
    const d = await r.json()
    setSuburbSuggestions(d.suggestions || [])
  }

  const toggleTradie = (id: string) => {
    setSelectedTradies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const addInvite = () => {
    if (!inviteForm.business_name || !inviteForm.email) return
    setPendingInvites(prev => [...prev, { ...inviteForm }])
    setInviteForm({ business_name:'', email:'', trade_category:'', phone:'', personal_message:'' })
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 2000)
  }

  const removeInvite = (idx: number) => setPendingInvites(prev => prev.filter((_,i) => i !== idx))

  const sendQuoteRequests = async () => {
    if (!selectedJob) return
    setSending(true)
    setSendError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Insert selected Steadyhand tradies
      for (const tradieId of selectedTradies) {
        await supabase.from('quote_requests').upsert(
          { job_id: selectedJob.id, tradie_id: tradieId, status: 'requested', requested_at: new Date().toISOString() },
          { onConflict: 'job_id,tradie_id' }
        )
        await fetch('/api/notify', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'tradie_selected', job_id: selectedJob.id, tradie_id: tradieId }) }).catch(console.error)
      }

      // Send invite emails for manually-added tradies
      for (const inv of pendingInvites) {
        await fetch('/api/notify', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'tradie_invite', job_id: selectedJob.id, ...inv }) }).catch(console.error)
      }

      await supabase.from('jobs').update({ status: 'shortlisted' }).eq('id', selectedJob.id)
      setSent(true)
      setSelectedTradies([])
      setPendingInvites([])
      setPendingConfirm(false)
      setTab('requested')
      const { data: qrs } = await supabase.from('quote_requests')
        .select('*, tradie:tradie_profiles(business_name, trade_category)')
        .eq('job_id', selectedJob.id)
      setQuoteRequests(qrs || [])
    } catch(e) { setSendError('Something went wrong. Please try again.') }
    setSending(false)
  }

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={false} />
      <StageRail currentPath="/shortlist" jobStatus={selectedJob?.status} role="client" />
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

  const totalSelected = selectedTradies.length + pendingInvites.length
  const inpStyle: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' }

  const TradieTile = ({ t, selectable }: { t: any, selectable?: boolean }) => {
    const selected = selectedTradies.includes(t.id)
    const alreadyRequested = quoteRequests.some((qr:any) => qr.tradie_id === t.id)
    return (
      <div style={{ background: selected ? 'rgba(46,125,96,0.08)' : '#E8F0EE', border: selected ? '1.5px solid #2E7D60' : '1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', color:'white', fontFamily:'var(--font-aboreto), sans-serif', flexShrink:0 }}>
          {t.logo_url ? <img src={t.logo_url} style={{ width:'100%', height:'100%', borderRadius:'10px', objectFit:'cover' }} alt="" /> : (t.business_name?.charAt(0) || '?')}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px', flexWrap:'wrap' as const }}>
            <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{t.business_name}</p>
            {t.licence_verified && <span style={{ fontSize:'10px', background:'rgba(46,125,96,0.1)', color:'#2E7D60', padding:'2px 7px', borderRadius:'100px', fontWeight:600 }}>✓ Verified</span>}
            {t.dialogue_score_avg && <span style={{ fontSize:'10px', background:'rgba(107,79,168,0.1)', color:'#534AB7', padding:'2px 7px', borderRadius:'100px', fontWeight:600 }}>⭐ {t.dialogue_score_avg.toFixed(1)}</span>}
          </div>
          <p style={{ fontSize:'12px', color:'#4A5E64', margin:'0 0 6px' }}>{t.trade_category}{t.suburb ? ' · ' + t.suburb : ''}</p>
          {t.bio && <p style={{ fontSize:'12px', color:'#7A9098', margin:0, lineHeight:'1.5', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>{t.bio}</p>}
          {matchReasons[t.id] && <p style={{ fontSize:'11px', color:'#6B4FA8', margin:'6px 0 0', background:'rgba(107,79,168,0.06)', borderRadius:'6px', padding:'4px 8px', lineHeight:'1.5' }}>✦ {matchReasons[t.id]}</p>}
        </div>
        {selectable && (
          <button type="button" onClick={() => toggleTradie(t.id)} disabled={alreadyRequested}
            style={{ flexShrink:0, padding:'7px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:500, border:'none', cursor: alreadyRequested ? 'default' : 'pointer',
              background: alreadyRequested ? 'rgba(28,43,50,0.08)' : selected ? '#2E7D60' : '#0A0A0A',
              color: alreadyRequested ? '#9AA5AA' : 'white' }}>
            {alreadyRequested ? 'Sent' : selected ? '✓ Selected' : 'Select'}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {nav}
      <div style={{ background:'#C8D5D2', minHeight:'calc(100vh - 110px)', padding:'24px 16px' }}>
        <div style={{ maxWidth:'780px', margin:'0 auto' }}>

          {/* Job selector */}
          {jobs.length > 1 && (
            <div style={{ marginBottom:'16px' }}>
              <select value={selectedJob?.id || ''} onChange={e => {
                const j = jobs.find((x:any) => x.id === e.target.value)
                setSelectedJob(j)
                if (j) loadJobData(j.id, '')
              }} style={{ ...inpStyle, width:'auto', minWidth:'240px' }}>
                {jobs.map((j:any) => <option key={j.id} value={j.id}>{j.title || 'Untitled job'}</option>)}
              </select>
            </div>
          )}

          {selectedJob && (
            <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 50%, rgba(46,125,96,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
              <p style={{ fontSize:'11px', fontWeight:600, color:'rgba(216,228,225,0.5)', letterSpacing:'1px', textTransform:'uppercase' as const, margin:'0 0 4px' }}>Active job</p>
              <p style={{ fontSize:'16px', fontWeight:500, color:'rgba(216,228,225,0.95)', margin:0 }}>{selectedJob.title || 'Untitled job'}</p>
              {selectedJob.suburb && <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', margin:'2px 0 0' }}>{selectedJob.suburb} · {selectedJob.trade_category}</p>}
            </div>
          )}

          <div style={{ background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 1px 4px rgba(28,43,50,0.06)' }}>
            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              {([
                { key:'matches', label:'AI Matches' },
                { key:'browse', label:'Browse' },
                { key:'invite', label:'Invite' },
                { key:'requested', label:'Requested', count: quoteRequests.length },
              ] as any[]).map(t => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  style={{ flex:1, padding:'14px 8px', fontSize:'13px', fontWeight: tab === t.key ? 600 : 400,
                    color: tab === t.key ? '#1C2B32' : '#7A9098',
                    borderBottom: tab === t.key ? '2px solid #1C2B32' : '2px solid transparent',
                    background:'none', border:'none',
                    cursor:'pointer' }}>
                  {t.label}{t.count ? ' (' + t.count + ')' : ''}
                </button>
              ))}
            </div>

            {/* AI MATCHES TAB */}
            {tab === 'matches' && (
              <div style={{ padding:'20px' }}>
                {matchLoading ? (
                  <div style={{ textAlign:'center' as const, padding:'40px', color:'#7A9098' }}>
                    <p style={{ fontSize:'14px', marginBottom:'8px' }}>Finding the best tradies for your job...</p>
                    <p style={{ fontSize:'12px' }}>This usually takes a few seconds</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div style={{ textAlign:'center' as const, padding:'40px' }}>
                    <p style={{ fontSize:'14px', color:'#7A9098', marginBottom:'16px' }}>No verified tradies found yet.</p>
                    <p style={{ fontSize:'13px', color:'#9AA5AA' }}>Try Browse to search the directory, or Invite a tradie you already know.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'10px', padding:'12px 14px', marginBottom:'16px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#2E7D60', margin:'0 0 2px' }}>Steadyhand recommendations</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>These verified tradies match your job type and area. Select 2–4 for the best comparison.</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                      {matches.map((t:any) => <TradieTile key={t.id} t={t} selectable />)}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* BROWSE TAB */}
            {tab === 'browse' && (
              <div style={{ padding:'20px' }}>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px' }}>Search verified Steadyhand tradies by trade and location.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Trade category</label>
                    <select value={browseCategory} onChange={e => setBrowseCategory(e.target.value)} style={inpStyle}>
                      <option value="">All trades</option>
                      {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ position:'relative' as const }}>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Suburb</label>
                    <input ref={suburbRef} type="text" placeholder="e.g. Subiaco" value={browseSuburb}
                      onChange={e => { setBrowseSuburb(e.target.value); fetchSuburbSuggestions(e.target.value) }}
                      style={inpStyle} />
                    {suburbSuggestions.length > 0 && (
                      <div style={{ position:'absolute' as const, top:'100%', left:0, right:0, background:'white', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', zIndex:50, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', marginTop:'2px' }}>
                        {suburbSuggestions.map((s,i) => (
                          <div key={i} onClick={() => { setBrowseSuburb(s); setSuburbSuggestions([]) }}
                            style={{ padding:'10px 14px', fontSize:'13px', cursor:'pointer', color:'#1C2B32', borderBottom: i < suburbSuggestions.length - 1 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.background='#F4F8F7')}
                            onMouseLeave={e => (e.currentTarget.style.background='white')}>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button type="button" onClick={browseDirectory} disabled={browseLoading}
                  style={{ width:'100%', background:'#1C2B32', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', marginBottom:'16px', opacity: browseLoading ? 0.7 : 1 }}>
                  {browseLoading ? 'Searching...' : 'Search directory'}
                </button>
                {browseResults.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                    {browseResults.map((t:any) => <TradieTile key={t.id} t={t} selectable />)}
                  </div>
                )}
                {browseResults.length === 0 && !browseLoading && (
                  <div style={{ textAlign:'center' as const, padding:'24px', color:'#9AA5AA', fontSize:'13px' }}>
                    Search above to browse verified tradies — or use Invite to add someone you know.
                  </div>
                )}
              </div>
            )}

            {/* INVITE TAB */}
            {tab === 'invite' && (
              <div style={{ padding:'20px' }}>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px' }}>Know a tradie you trust? Invite them directly — they will receive your job details and a link to submit a quote.</p>
                {pendingInvites.length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    {pendingInvites.map((inv:any, idx:number) => (
                      <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', marginBottom:'6px' }}>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{inv.business_name}</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{inv.email}</p>
                        </div>
                        <button type="button" onClick={() => removeInvite(idx)}
                          style={{ fontSize:'12px', color:'#D4522A', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ background:'#C8D5D2', borderRadius:'10px', padding:'16px' }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', marginBottom:'14px' }}>Add a tradie</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Business name *</label>
                      <input type="text" placeholder="e.g. Smith Electrical" value={inviteForm.business_name} onChange={e => setInviteForm(f => ({ ...f, business_name: e.target.value }))} style={inpStyle} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Email address *</label>
                      <input type="email" placeholder="tradie@email.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} style={inpStyle} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Trade category</label>
                      <input type="text" placeholder="e.g. Electrical" value={inviteForm.trade_category} onChange={e => setInviteForm(f => ({ ...f, trade_category: e.target.value }))} style={inpStyle} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Phone (optional)</label>
                      <input type="tel" placeholder="0400 000 000" value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} style={inpStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom:'10px' }}>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>Personal message <span style={{ fontWeight:400, color:'#7A9098' }}>(optional)</span></label>
                    <textarea placeholder="e.g. Hi — I have worked with you before and would love to get a quote on this job through Steadyhand." value={inviteForm.personal_message} onChange={e => setInviteForm(f => ({ ...f, personal_message: e.target.value }))}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'vertical', minHeight:'72px', fontFamily:'sans-serif', boxSizing:'border-box' }} />
                  </div>
                  <button type="button" onClick={addInvite} disabled={!inviteForm.business_name || !inviteForm.email}
                    style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !inviteForm.business_name || !inviteForm.email ? 0.5 : 1 }}>
                    {inviteSent ? '✓ Added to list' : '+ Add to quote request'}
                  </button>
                </div>
              </div>
            )}

            {/* REQUESTED TAB */}
            {tab === 'requested' && (
              <div style={{ padding:'20px' }}>
                {quoteRequests.length === 0 ? (
                  <div style={{ textAlign:'center' as const, padding:'32px', color:'#7A9098', fontSize:'14px' }}>
                    No quote requests sent yet.
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign:'center' as const, padding:'16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', marginBottom:'16px' }}>
                      <p style={{ fontSize:'15px', fontWeight:500, color:'#2E7D60', marginBottom:'4px' }}>Quote requests sent</p>
                      <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>We have notified {quoteRequests.length} tradie{quoteRequests.length !== 1 ? 's' : ''} about your job.</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'16px' }}>
                      {quoteRequests.map((qr:any) => (
                        <div key={qr.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'white', fontFamily:'var(--font-aboreto), sans-serif', flexShrink:0 }}>
                              {qr.tradie?.business_name?.charAt(0) || '?'}
                            </div>
                            <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{qr.tradie?.business_name}</p>
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'100px',
                            background: qr.qr_status === 'accepted' ? 'rgba(46,125,96,0.1)' : 'rgba(192,120,48,0.1)',
                            color: qr.qr_status === 'accepted' ? '#2E7D60' : '#C07830' }}>
                            {qr.qr_status === 'accepted' ? '✓ Accepted' : '⏳ Awaiting quote'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'rgba(155,107,155,0.08)', border:'1px solid rgba(155,107,155,0.25)', borderRadius:'10px', padding:'14px 16px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#9B6B9B', marginBottom:'4px' }}>Before quotes arrive — book a consult</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', marginBottom:'10px' }}>A consult creates a shared record of what was discussed before any quote is submitted.</p>
                      <a href={'/consult?job_id=' + (selectedJob?.id || '')}>
                        <button type="button" style={{ width:'100%', background:'#9B6B9B', color:'white', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                          Go to consult →
                        </button>
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Send bar */}
          {totalSelected > 0 && !sent && (
            <div style={{ marginTop:'16px', background:'#0A0A0A', borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
              <div>
                <p style={{ fontSize:'14px', fontWeight:500, color:'rgba(216,228,225,0.9)', marginBottom:'2px' }}>
                  {totalSelected} tradie{totalSelected !== 1 ? 's' : ''} selected
                </p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>
                  {totalSelected < 2 ? 'Consider selecting at least 2 for comparison' : 'Ready to send quote requests'}
                </p>
              </div>
              {sendError && <p style={{ fontSize:'12px', color:'#D4522A' }}>{sendError}</p>}
              <button type="button" onClick={sendQuoteRequests} disabled={sending}
                style={{ background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: sending ? 0.7 : 1, flexShrink:0 }}>
                {sending ? 'Sending...' : 'Request quotes →'}
              </button>
            </div>
          )}

        </div>
      </div>
      <StageGuideModal
        storageKey="seen_shortlist_guide"
        stageNumber={2}
        stageColor="#2E6A8F"
        stageLabel="Match"
        headline="Choose who quotes on your job"
        intro="Steadyhand gives you three ways to find a tradie — AI-matched recommendations, a browseable directory of verified tradies, or a direct invite to someone you already trust."
        checklist={[
          { text: 'Select 2 to 4 tradies for the best comparison', emphasis: true },
          { text: 'AI Matches shows verified tradies ranked by trade and location', emphasis: false },
          { text: 'Browse lets you search by trade category and suburb', emphasis: false },
          { text: 'Invite lets you bring in a tradie you already know', emphasis: false },
        ]}
        warning="Selecting just one tradie means no comparison. Two to four quotes gives you real leverage and the information to make a confident decision."
        ctaLabel="Find tradies"
      />
    </>
  )
}
