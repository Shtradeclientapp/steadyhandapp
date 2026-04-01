'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AgreementPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [scope, setScope] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [pushingMsg, setPushingMsg] = useState<string|null>(null)
  const [scopeVersion, setScopeVersion] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)

      const isTradie = prof?.role === 'tradie'
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(*, profile:profiles(*)), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq(isTradie ? 'tradie_id' : 'client_id', session.user.id)
        .in('status', ['agreement', 'shortlisted', 'delivery'])
        .order('updated_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        setJob(jobs[0])
        const { data: scopeData } = await supabase.from('scope_agreements').select('*').eq('job_id', jobs[0].id).single()
        if (scopeData) { setScope(scopeData); setScopeVersion(scopeData.version || 1) }
        const { data: msgs } = await supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('job_id', jobs[0].id).order('created_at', { ascending: true })
        setMessages(msgs || [])
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!job) return
    const supabase = createClient()
    const channel = supabase.channel('agreement_msgs:' + job.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages', filter: 'job_id=eq.' + job.id }, async (payload) => {
        const { data: msg } = await supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('id', payload.new.id).single()
        if (msg) setMessages(prev => [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [job])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const draftScope = async (suggestion?: string) => {
    if (!job) return
    setDrafting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session?.access_token },
      body: JSON.stringify({ job_id: job.id, suggestion }),
    })
    const data = await res.json()
    if (data.scope) { setScope(data.scope); setScopeVersion(v => v + 1) }
    setDrafting(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !job || !user) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('job_messages').insert({ job_id: job.id, sender_id: user.id, body: newMessage.trim() })
    setNewMessage('')
    setSending(false)
  }

  const pushToScope = async (msg: any) => {
    setPushingMsg(msg.id)
    await draftScope(msg.body)
    const supabase = createClient()
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: user.id,
      body: 'Scope redrafted incorporating: "' + msg.body + '"',
    })
    setPushingMsg(null)
  }

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string|null>(null)

  const saveEdit = async (updates: any) => {
    if (!scope) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const newScope = { ...scope, ...updates }
    setScope(newScope)
    await supabase.from('scope_agreements').update({
      ...updates,
      last_edited_by: session?.user.id,
      last_edited_at: new Date().toISOString(),
      client_signed_at: null,
      tradie_signed_at: null,
    }).eq('id', scope.id)
    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' }))
  }

    const signScope = async () => {
    if (!job || !scope) return
    const supabase = createClient()
    const field = profile?.role === 'tradie' ? 'tradie_signed_at' : 'client_signed_at'
    await supabase.from('scope_agreements').update({ [field]: new Date().toISOString() }).eq('id', scope.id)
    setScope({ ...scope, [field]: new Date().toISOString() })
    const updated = { ...scope, [field]: new Date().toISOString() }
    if (updated.client_signed_at && updated.tradie_signed_at) {
      await supabase.from('jobs').update({ status: 'delivery' }).eq('id', job.id)
      setTimeout(() => { window.location.href = profile?.role === 'tradie' ? '/tradie/dashboard' : '/delivery' }, 1200)
    }
  }

  const isTradie = profile?.role === 'tradie'

  const nav = (
    <div>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href={isTradie ? '/tradie/dashboard' : '/dashboard'} style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href={isTradie ? '/tradie/dashboard' : '/dashboard'} style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Back to dashboard</a>
      </nav>
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
        {[{n:1,l:'Request',p:'/request',c:'#2E7D60'},{n:2,l:'Shortlist',p:'/shortlist',c:'#2E6A8F'},{n:3,l:'Agreement',p:'/agreement',c:'#6B4FA8'},{n:4,l:'Delivery',p:'/delivery',c:'#C07830'},{n:5,l:'Sign-off',p:'/signoff',c:'#D4522A'},{n:6,l:'Warranty',p:'/warranty',c:'#1A6B5A'}].map(s => (
          <a key={s.n} href={s.p} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {s.p === '/agreement' && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:s.c }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (s.n < 3 ? '#2E7D60' : s.p === '/agreement' ? s.c : 'rgba(28,43,50,0.2)'), background: s.n < 3 ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: s.n < 3 ? 'white' : s.p === '/agreement' ? s.c : '#7A9098' }}>
              {s.n < 3 ? '✓' : s.n}
            </div>
            <div style={{ fontSize:'10px', color: s.p === '/agreement' ? '#1C2B32' : s.n < 3 ? '#2E7D60' : '#7A9098', fontWeight: s.p === '/agreement' ? 600 : 400 }}>{s.l}</div>
          </a>
        ))}
      </div>
    </div>
  )

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div></>

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 110px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px', fontFamily:'sans-serif' }}>No job in agreement stage.</p>
        <a href="/shortlist"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to shortlist</button></a>
      </div>
    </div></>
  )

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 110px)', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'1fr 380px', gap:'24px', alignItems:'start' }} className="agreement-grid">

        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#6B4FA8', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Stage 3</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const, marginBottom:'6px' }}>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px' }}>SCOPE AGREEMENT</h1>
            {scope && <span style={{ fontSize:'12px', color:'#7A9098', background:'rgba(28,43,50,0.06)', padding:'4px 10px', borderRadius:'6px' }}>Version {scopeVersion}</span>}
          </div>
          <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'24px', lineHeight:'1.6' }}>
            Review the scope below. Use the message thread to suggest changes — either party can push a suggestion directly into a new scope draft.
          </p>

          <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'20px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'10px' }}>
                <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
                <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' as const }}>AI drafted · v{scopeVersion}</span>
              </div>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>{job.title}</h3>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)' }}>{job.trade_category} · {job.suburb} · {job.tradie?.business_name || 'Tradie assigned'}</p>
            </div>
          </div>

          {!scope && (
            <div style={{ textAlign:'center', padding:'40px', background:'#E8F0EE', borderRadius:'14px', marginBottom:'20px', border:'1px solid rgba(28,43,50,0.1)' }}>
              <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'20px', lineHeight:'1.6' }}>No scope drafted yet. Click below to have Claude draft a scope from your job details.</p>
              <button type="button" onClick={() => draftScope()} disabled={drafting}
                style={{ background:'#6B4FA8', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: drafting ? 0.7 : 1 }}>
                {drafting ? 'Drafting...' : 'Draft scope with AI →'}
              </button>
            </div>
          )}

          {scope && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'20px' }}>
             {scope.inclusions?.length > 0 && (
  <div style={{ padding:'18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
      <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>What is included</p>
      <span style={{ fontSize:'10px', color:'#2E7D60' }}>Click to edit</span>
    </div>
    {scope.inclusions.map((item: string, i: number) => (
      <div key={i} style={{ display:'flex', gap:'10px', padding:'4px 0', borderBottom:'1px solid rgba(28,43,50,0.06)', alignItems:'center' }}>
        <span style={{ color:'#2E7D60', flexShrink:0 }}>✓</span>
        <input
          type="text"
          defaultValue={item}
          onBlur={e => {
            const updated = [...scope.inclusions]
            updated[i] = e.target.value
            saveEdit({ inclusions: updated })
          }}
          style={{ flex:1, border:'none', background:'transparent', fontSize:'13px', color:'#1C2B32', outline:'none', padding:'4px 6px', borderRadius:'4px', cursor:'text' }}
          onFocus={e => { e.target.style.background = 'rgba(28,43,50,0.05)' }}
        />
        <button type="button" onClick={() => {
          const updated = scope.inclusions.filter((_: string, idx: number) => idx !== i)
          saveEdit({ inclusions: updated })
        }} style={{ background:'none', border:'none', color:'#D4522A', cursor:'pointer', fontSize:'14px', flexShrink:0, padding:'0 4px' }}>×</button>
      </div>
    ))}
    <button type="button" onClick={() => saveEdit({ inclusions: [...scope.inclusions, 'New inclusion'] })}
      style={{ marginTop:'8px', fontSize:'12px', color:'#2E7D60', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>
      + Add inclusion
    </button>
  </div>
)}
              {scope.exclusions?.length > 0 && (
  <div style={{ padding:'18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
      <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>What is excluded</p>
      <span style={{ fontSize:'10px', color:'#D4522A' }}>Click to edit</span>
    </div>
    {scope.exclusions.map((item: string, i: number) => (
      <div key={i} style={{ display:'flex', gap:'10px', padding:'4px 0', borderBottom:'1px solid rgba(28,43,50,0.06)', alignItems:'center' }}>
        <span style={{ color:'#D4522A', flexShrink:0 }}>×</span>
        <input
          type="text"
          defaultValue={item}
          onBlur={e => {
            const updated = [...scope.exclusions]
            updated[i] = e.target.value
            saveEdit({ exclusions: updated })
          }}
          style={{ flex:1, border:'none', background:'transparent', fontSize:'13px', color:'#1C2B32', outline:'none', padding:'4px 6px', borderRadius:'4px', cursor:'text' }}
          onFocus={e => { e.target.style.background = 'rgba(28,43,50,0.05)' }}
        />
        <button type="button" onClick={() => {
          const updated = scope.exclusions.filter((_: string, idx: number) => idx !== i)
          saveEdit({ exclusions: updated })
        }} style={{ background:'none', border:'none', color:'#D4522A', cursor:'pointer', fontSize:'14px', flexShrink:0, padding:'0 4px' }}>×</button>
      </div>
    ))}
    <button type="button" onClick={() => saveEdit({ exclusions: [...scope.exclusions, 'New exclusion'] })}
      style={{ marginTop:'8px', fontSize:'12px', color:'#D4522A', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>
      + Add exclusion
    </button>
  </div>
)}
              {scope.milestones?.length > 0 && (
                <div style={{ padding:'18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'12px', fontWeight:500 }}>Payment milestones</p>
                  {scope.milestones.map((m: any, i: number) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{m.label}</div>
                        <div style={{ fontSize:'12px', color:'#7A9098', marginTop:'2px' }}>{m.description}</div>
                      </div>
                      <div style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', flexShrink:0 }}>{m.percent}%</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding:'18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', marginBottom:'8px', fontWeight:500 }}>Warranty terms</p>
                {[
                  { label:'Warranty period', value: (scope.warranty_days || 90) + ' days from sign-off' },
                  { label:'Response SLA', value: (scope.response_sla_days || 5) + ' business days' },
                  { label:'Remediation', value: (scope.remediation_days || 14) + ' days or Steadyhand mediates' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', gap:'12px', padding:'6px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <span style={{ fontSize:'13px', color:'#7A9098', minWidth:'130px', flexShrink:0 }}>{item.label}</span>
                    <span style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:'18px' }}>
                <div style={{ display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap' as const }}>
                  <div style={{ flex:1, padding:'14px', background: scope.client_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border:'1.5px ' + (scope.client_signed_at ? 'solid #2E7D60' : 'dashed rgba(28,43,50,0.2)'), borderRadius:'10px', textAlign:'center' as const }}>
                    <div style={{ fontSize:'16px', marginBottom:'4px' }}>{scope.client_signed_at ? '✅' : '⏳'}</div>
                    <div style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32' }}>Client</div>
                    <div style={{ fontSize:'11px', color:'#7A9098' }}>{scope.client_signed_at ? 'Signed' : 'Not yet signed'}</div>
                  </div>
                  <div style={{ flex:1, padding:'14px', background: scope.tradie_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border:'1.5px ' + (scope.tradie_signed_at ? 'solid #2E7D60' : 'dashed rgba(28,43,50,0.2)'), borderRadius:'10px', textAlign:'center' as const }}>
                    <div style={{ fontSize:'16px', marginBottom:'4px' }}>{scope.tradie_signed_at ? '✅' : '⏳'}</div>
                    <div style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32' }}>Tradie</div>
                    <div style={{ fontSize:'11px', color:'#7A9098' }}>{scope.tradie_signed_at ? 'Signed' : 'Not yet signed'}</div>
                  </div>
                </div>

                {!(profile?.role === 'tradie' ? scope.tradie_signed_at : scope.client_signed_at) && (
                  <button type="button" onClick={signScope}
                    style={{ width:'100%', background:'#6B4FA8', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', marginBottom:'8px' }}>
                    Sign scope as {profile?.role === 'tradie' ? 'tradie' : 'client'} →
                  </button>
                )}
                <button type="button" onClick={() => draftScope()} disabled={drafting}
                  style={{ width:'100%', background:'transparent', color:'#6B4FA8', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(107,79,168,0.3)', cursor:'pointer', opacity: drafting ? 0.7 : 1 }}>
                  {drafting ? 'Redrafting...' : '↻ Redraft scope with AI'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', position:'sticky' as const, top:'130px', display:'flex', flexDirection:'column' as const, height:'600px' }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.1)', flexShrink:0 }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'0.5px' }}>NEGOTIATION THREAD</p>
            <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>Suggest changes · Push to scope</p>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 16px', color:'#7A9098', fontSize:'13px' }}>
                No messages yet. Suggest a change below and either party can push it into the scope.
              </div>
            )}
            {messages.map(msg => {
              const isMine = msg.sender_id === user?.id
              const isSystemMsg = msg.body.startsWith('Scope redrafted')
              return (
                <div key={msg.id} style={{ display:'flex', flexDirection:'column' as const, alignItems: isSystemMsg ? 'center' : isMine ? 'flex-end' : 'flex-start' }}>
                  {isSystemMsg ? (
                    <div style={{ background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', color:'#6B4FA8', textAlign:'center' as const }}>
                      ↻ {msg.body}
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize:'10px', color:'#7A9098', marginBottom:'3px' }}>
                        {msg.sender?.full_name} · {new Date(msg.created_at).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div style={{ maxWidth:'90%', padding:'9px 13px', borderRadius:'10px', background: isMine ? '#1C2B32' : '#C8D5D2', color: isMine ? 'rgba(216,228,225,0.9)' : '#1C2B32', fontSize:'13px', lineHeight:'1.5', borderBottomRightRadius: isMine ? '3px' : '10px', borderBottomLeftRadius: isMine ? '10px' : '3px' }}>
                        {msg.body}
                      </div>
                      <button type="button" onClick={() => pushToScope(msg)} disabled={!!pushingMsg || drafting}
                        style={{ marginTop:'4px', fontSize:'10px', color:'#6B4FA8', background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', opacity: pushingMsg === msg.id ? 0.7 : 1 }}>
                        {pushingMsg === msg.id ? '↻ Pushing to scope...' : '↑ Push to scope'}
                      </button>
                    </>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:'12px', borderTop:'1px solid rgba(28,43,50,0.1)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:'8px' }}>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Suggest a change..."
                rows={2}
                style={{ flex:1, padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'none', fontFamily:'sans-serif', lineHeight:'1.4' }}
              />
              <button type="button" onClick={sendMessage} disabled={sending || !newMessage.trim()}
                style={{ background:'#D4522A', color:'white', padding:'8px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, opacity: sending || !newMessage.trim() ? 0.5 : 1, flexShrink:0, alignSelf:'flex-end' as const }}>
                Send
              </button>
            </div>
            <p style={{ fontSize:'10px', color:'#7A9098', marginTop:'5px' }}>Enter to send · Click "Push to scope" on any message to redraft</p>
          </div>
        </div>

      </div>
    </div></>
  )
}
