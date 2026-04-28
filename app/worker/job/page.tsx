'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkerJobPage() {
  const [assignment, setAssignment] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [scopeItems, setScopeItems] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [evidence, setEvidence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [workerId, setWorkerId] = useState<string|null>(null)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [activeTab, setActiveTab] = useState<'brief'|'scope'|'messages'|'evidence'>('brief')
  const fileRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const assignmentId = p.get('id')
    if (!assignmentId) { window.location.href = '/worker/dashboard'; return }
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!sess) { window.location.href = '/login'; return }
      setSession(sess)
      const { data: workerData } = await supabase.from('tradie_workers').select('id').eq('profile_id', sess.user.id).single()
      if (!workerData) { window.location.href = '/worker/dashboard'; return }
      setWorkerId(workerData.id)
      const { data: asgn } = await supabase.from('job_worker_assignments').select('*, job:jobs(id, title, suburb, address, status, description, tradie_id)').eq('id', assignmentId).single()
      if (!asgn || asgn.worker_id !== workerData.id) { window.location.href = '/worker/dashboard'; return }
      setAssignment(asgn); setJob(asgn.job); setNotes(asgn.worker_notes || '')
      const { data: ms } = await supabase.from('milestones').select('id, title, description, status, order_index').eq('job_id', asgn.job.id).order('order_index')
      setMilestones(ms || [])
      const { data: scope } = await supabase.from('scope_agreements').select('scope_items').eq('job_id', asgn.job.id).order('created_at', { ascending: false }).limit(1).single()
      if (scope?.scope_items) {
        setScopeItems((scope.scope_items as any[]).map(({ description, quantity, unit, notes: n }: any) => ({ description, quantity, unit, notes: n })))
      }
      const { data: msgs } = await supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(full_name)').eq('job_id', asgn.job.id).eq('worker_id', workerData.id).order('created_at')
      setMessages(msgs || [])
      const { data: ev } = await supabase.from('worker_evidence').select('*').eq('assignment_id', assignmentId).order('uploaded_at', { ascending: false })
      setEvidence(ev || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, activeTab])

  const saveNotes = async () => {
    if (!assignment) return
    setNotesSaving(true)
    const supabase = createClient()
    await supabase.from('job_worker_assignments').update({ worker_notes: notes }).eq('id', assignment.id)
    setNotesSaving(false)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !session || !workerId) return
    setSendingMsg(true)
    const supabase = createClient()
    const { data: msg } = await supabase.from('messages').insert({ job_id: job.id, worker_id: workerId, sender_id: session.user.id, recipient_id: job.tradie_id, content: newMsg.trim(), message_type: 'worker' }).select('*, sender:profiles!messages_sender_id_fkey(full_name)').single()
    if (msg) setMessages(prev => [...prev, msg])
    setNewMsg(''); setSendingMsg(false)
  }

  const uploadEvidence = async (file: File) => {
    if (!session || !assignment) return
    setUploadingEvidence(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `worker-evidence/${assignment.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('job-photos').upload(path, file)
    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(path)
      const { data: ev } = await supabase.from('worker_evidence').insert({ assignment_id: assignment.id, storage_path: publicUrl, uploaded_by: session.user.id }).select().single()
      if (ev) setEvidence(prev => [ev, ...prev])
    }
    setUploadingEvidence(false)
  }

  const currentMilestone = milestones.find(m => m.status === 'pending') || milestones[milestones.length - 1]

  if (loading) return <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'#4A5E64', fontSize:'14px' }}>Loading job...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky' as const, top:0, zIndex:100 }}>
        <a href="/worker/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← My jobs</a>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#D4522A', letterSpacing:'1px' }}>STEADYHAND</div>
        <div style={{ width:'60px' }} />
      </nav>

      <div style={{ background:'#0A0A0A', padding:'20px' }}>
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:'0 0 4px', letterSpacing:'1px', textTransform:'uppercase' as const }}>{job?.suburb || 'Site'}</p>
          <h1 style={{ fontSize:'18px', color:'rgba(216,228,225,0.9)', margin:'0 0 10px', fontWeight:600 }}>{job?.title}</h1>
          {job?.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none' }}>📍 {job.address} — open in maps</a>}
          {currentMilestone && <div style={{ marginTop:'12px', background:'rgba(216,228,225,0.06)', borderRadius:'8px', padding:'10px 14px' }}>
            <p style={{ fontSize:'10px', color:'rgba(216,228,225,0.4)', margin:'0 0 3px', letterSpacing:'1px' }}>CURRENT STAGE</p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.8)', margin:0 }}>{currentMilestone.title}</p>
          </div>}
        </div>
      </div>

      <div style={{ background:'white', borderBottom:'1px solid rgba(28,43,50,0.08)', position:'sticky' as const, top:'56px', zIndex:90 }}>
        <div style={{ maxWidth:'640px', margin:'0 auto', display:'flex' }}>
          {(['brief','scope','messages','evidence'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex:1, padding:'12px 8px', border:'none', borderBottom: activeTab === t ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'12px', fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? '#0A0A0A' : '#7A9098', textTransform:'capitalize' as const }}>
              {t}{t === 'messages' && messages.length > 0 && <span style={{ marginLeft:'4px', background:'#D4522A', color:'white', borderRadius:'100px', fontSize:'9px', padding:'1px 5px' }}>{messages.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'20px' }}>
        {activeTab === 'brief' && (
          <div>
            {assignment?.site_brief
              ? <div style={{ background:'white', borderRadius:'12px', padding:'20px', marginBottom:'16px', border:'1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 10px', letterSpacing:'1px', textTransform:'uppercase' as const }}>Site brief from leading hand</p>
                  <p style={{ fontSize:'14px', color:'#0A0A0A', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' as const }}>{assignment.site_brief}</p>
                </div>
              : <div style={{ background:'#E8F0EE', borderRadius:'12px', padding:'20px', marginBottom:'16px', textAlign:'center' as const }}>
                  <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>No site brief yet — message the leading hand.</p>
                </div>
            }
            <div style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 10px', letterSpacing:'1px', textTransform:'uppercase' as const }}>Your notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add site notes, observations, issues..."
                style={{ width:'100%', minHeight:'120px', padding:'12px', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'8px', fontSize:'13px', color:'#0A0A0A', lineHeight:'1.6', resize:'vertical' as const, outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }} />
              <button onClick={saveNotes} disabled={notesSaving}
                style={{ marginTop:'10px', background:'#0A0A0A', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity:notesSaving ? 0.7 : 1 }}>
                {notesSaving ? 'Saving...' : 'Save notes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scope' && (
          <div>
            {milestones.length > 0 && <div style={{ marginBottom:'20px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 10px', letterSpacing:'1px', textTransform:'uppercase' as const }}>Milestones</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {milestones.map((m, i) => (
                  <div key={m.id} style={{ background:'white', borderRadius:'10px', padding:'12px 16px', border:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'50%', background: m.status === 'approved' ? '#2E7D60' : m.status === 'pending' ? '#D4522A' : 'rgba(28,43,50,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color: m.status === 'approved' || m.status === 'pending' ? 'white' : '#7A9098', flexShrink:0 }}>
                      {m.status === 'approved' ? '✓' : i + 1}
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight: m.status === 'pending' ? 600 : 400, color: m.status === 'approved' ? '#7A9098' : '#0A0A0A', margin:'0 0 2px', textDecoration: m.status === 'approved' ? 'line-through' : 'none' }}>{m.title}</p>
                      {m.description && <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{m.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>}
            {scopeItems.length > 0
              ? <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 10px', letterSpacing:'1px', textTransform:'uppercase' as const }}>Scope items</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px' }}>
                    {scopeItems.map((item, i) => (
                      <div key={i} style={{ background:'white', borderRadius:'10px', padding:'12px 16px', border:'1px solid rgba(28,43,50,0.08)' }}>
                        <p style={{ fontSize:'13px', color:'#0A0A0A', margin:'0 0 4px', fontWeight:500 }}>{item.description}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{item.quantity && `Qty: ${item.quantity}`}{item.unit && ` ${item.unit}`}{item.notes && ` · ${item.notes}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              : <div style={{ background:'#E8F0EE', borderRadius:'12px', padding:'20px', textAlign:'center' as const }}><p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Scope not yet available.</p></div>
            }
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'16px', minHeight:'200px' }}>
              {messages.length === 0
                ? <div style={{ textAlign:'center' as const, padding:'32px 0' }}><p style={{ fontSize:'13px', color:'#7A9098' }}>No messages yet.</p></div>
                : messages.map((m: any) => {
                    const isMe = m.sender_id === session?.user?.id
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth:'75%', background: isMe ? '#0A0A0A' : 'white', borderRadius:'12px', padding:'10px 14px', border: isMe ? 'none' : '1px solid rgba(28,43,50,0.08)' }}>
                          {!isMe && <p style={{ fontSize:'10px', color:'#9AA5AA', margin:'0 0 4px', fontWeight:600 }}>{m.sender?.full_name || 'Leading hand'}</p>}
                          <p style={{ fontSize:'13px', color: isMe ? 'rgba(216,228,225,0.9)' : '#0A0A0A', margin:0, lineHeight:'1.5', whiteSpace:'pre-wrap' as const }}>{m.content}</p>
                          <p style={{ fontSize:'10px', color: isMe ? 'rgba(216,228,225,0.35)' : '#9AA5AA', margin:'4px 0 0', textAlign: isMe ? 'right' : 'left' as const }}>{new Date(m.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</p>
                        </div>
                      </div>
                    )
                  })
              }
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Message leading hand..." rows={2}
                style={{ flex:1, padding:'10px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', resize:'none' as const, outline:'none', fontFamily:'sans-serif' }} />
              <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()}
                style={{ background:'#0A0A0A', color:'white', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: (!newMsg.trim() || sendingMsg) ? 0.5 : 1, whiteSpace:'nowrap' as const }}>Send</button>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if (e.target.files?.[0]) uploadEvidence(e.target.files[0]) }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploadingEvidence}
              style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'12px', borderRadius:'10px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', marginBottom:'16px', opacity:uploadingEvidence ? 0.7 : 1 }}>
              {uploadingEvidence ? 'Uploading...' : '📷 Upload photo or evidence'}
            </button>
            {evidence.length === 0
              ? <div style={{ background:'#E8F0EE', borderRadius:'12px', padding:'28px', textAlign:'center' as const }}><p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>No evidence uploaded yet.</p></div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px' }}>
                  {evidence.map((ev: any) => (
                    <a key={ev.id} href={ev.storage_path} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                      <div style={{ borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(28,43,50,0.08)', aspectRatio:'1', background:'#E8F0EE' }}>
                        <img src={ev.storage_path} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' as const }} />
                      </div>
                      <p style={{ fontSize:'10px', color:'#9AA5AA', margin:'4px 0 0', textAlign:'center' as const }}>{new Date(ev.uploaded_at).toLocaleDateString()}</p>
                    </a>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  )
}
