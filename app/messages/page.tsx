'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'

function MessagesPageInner() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string|null>(null)
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({})
  const [unread, setUnread] = useState<Record<string, number>>({})  // per-job unread counts
  const bottomRef = useRef<HTMLDivElement>(null)
  const [mobilePanelView, setMobilePanelView] = useState<'list'|'thread'>('list')
  const supabase = useSupabase()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(prof)

      const isTradie = prof?.role === 'tradie'
      let jobData: any[] = []
      if (isTradie) {
        // Tradies are linked via quote_requests before quote acceptance, tradie_id after
        const { data: qrJobs } = await supabase
          .from('jobs')
          .select('*, client:profiles!jobs_client_id_fkey(full_name), tradie:tradie_profiles(business_name)')
          .eq('tradie_id', session.user.id)
          .order('updated_at', { ascending: false })
        const { data: qrData } = await supabase
          .from('quote_requests')
          .select('job:jobs(*, client:profiles!jobs_client_id_fkey(full_name), tradie:tradie_profiles(business_name))')
          .eq('tradie_id', session.user.id)
          .not('status', 'eq', 'declined')
        const qrJobList = (qrData || []).map((r: any) => r.job).filter(Boolean)
        const seen = new Set((qrJobs || []).map((j: any) => j.id))
        const extra = qrJobList.filter((j: any) => !seen.has(j.id))
        jobData = [...(qrJobs || []), ...extra].sort((a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      } else {
        const { data } = await supabase
          .from('jobs')
          .select('*, client:profiles!jobs_client_id_fkey(full_name), tradie:tradie_profiles(business_name)')
          .eq('client_id', session.user.id)
          .order('updated_at', { ascending: false })
        jobData = data || []
      }

      setJobs(jobData || [])

      // Load message previews — 2 bulk queries instead of N*2 queries
      if (jobData && jobData.length > 0) {
        const uid = session.user.id
        const jobIds = jobData.map((j: any) => j.id)

        // Fetch last 1 message per job in a single query, then pick latest per job in JS
        const { data: allPreviews } = await supabase
          .from('job_messages')
          .select('job_id, body, created_at, sender_id')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })

        const previews: Record<string, any> = {}
        for (const msg of (allPreviews || [])) {
          if (!previews[msg.job_id]) previews[msg.job_id] = msg
        }

        // Fetch all unread messages in a single query, then count per job in JS
        const { data: unreadMsgs } = await supabase
          .from('job_messages')
          .select('job_id')
          .in('job_id', jobIds)
          .neq('sender_id', uid)
          .not('read_by', 'cs', JSON.stringify([uid]))

        const unreadCounts: Record<string, number> = {}
        for (const msg of (unreadMsgs || [])) {
          unreadCounts[msg.job_id] = (unreadCounts[msg.job_id] || 0) + 1
        }

        setLastMessages(previews)
        setUnread(unreadCounts)
      }

      if (jobData && jobData.length > 0) {
        const jobParam = searchParams.get('job')
        const selected = jobParam ? (jobData.find((j: any) => j.id === jobParam) || jobData[0]) : jobData[0]
        setSelectedJob(selected)
        await loadMessages(selected.id)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedJob) return
    const channel = supabase
      .channel('job_messages:' + selectedJob.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'job_messages',
        filter: 'job_id=eq.' + selectedJob.id,
      }, async (payload) => {
        const { data: msg } = await supabase
          .from('job_messages')
          .select('*, sender:profiles(full_name, role)')
          .eq('id', payload.new.id)
          .single()
        if (msg) {
          setMessages(prev => [...prev, msg])
          // Mark as read immediately if it's not mine
          const session = await supabase.auth.getSession()
          const userId = session.data.session?.user.id
          if (userId && msg.sender_id !== userId) {
            await supabase.rpc('append_read_by', { message_id: msg.id, user_id: userId })
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedJob])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (jobId: string) => {
    const { data } = await supabase
      .from('job_messages')
      .select('*, sender:profiles(full_name, role)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Mark unread messages as read
    const session = await supabase.auth.getSession()
    const userId = session.data.session?.user.id
    if (!userId || !data) return
    const unreadIds = data
      .filter(m => m.sender_id !== userId && !(m.read_by || []).includes(userId))
      .map(m => m.id)
    if (unreadIds.length > 0) {
      await Promise.all(unreadIds.map(id =>
        supabase.rpc('append_read_by', { message_id: id, user_id: userId })
      ))
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedJob || !user) return
    setSending(true)
    setSendError(null)
    const { error } = await supabase.from('job_messages').insert({
      job_id: selectedJob.id,
      sender_id: user.id,
      body: newMessage.trim(),
    })
    if (error) {
      setSendError('Message failed to send — check your connection and try again.')
    } else {
      setNewMessage('')
    }
    setSending(false)
  }

  const selectJob = async (job: any) => {
    setSelectedJob(job)
    setMessages([])
    setUnread(prev => ({ ...prev, [job.id]: 0 }))
    setMobilePanelView('thread')
    await loadMessages(job.id)
  }

  const isTradie = profile?.role === 'tradie'
  const dashboardPath = isTradie ? '/tradie/dashboard' : '/dashboard'

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif', display:'flex', flexDirection:'column' }}>
      <style>{`
        @media (max-width: 640px) {
          .messages-grid { grid-template-columns: 1fr !important; grid-template-rows: auto 1fr; }
          .messages-sidebar { max-height: 200px; }
        }
      `}</style>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100, flexShrink:0 }}>
        <a href={dashboardPath} style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'1px' }}>MESSAGES</div>
        <a href={dashboardPath} style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Dashboard</a>
      </nav>

      {/* Mobile tab bar */}
      <div className="messages-mobile-tabs" style={{ display:'none', borderBottom:'1px solid rgba(28,43,50,0.1)', background:'#E8F0EE' }}>
        <button type="button" onClick={() => setMobilePanelView('list')}
          style={{ flex:1, padding:'12px', fontSize:'13px', fontWeight: mobilePanelView === 'list' ? 600 : 400, color: mobilePanelView === 'list' ? '#0A0A0A' : '#7A9098', background:'none', border:'none', borderBottom: mobilePanelView === 'list' ? '2px solid #D4522A' : '2px solid transparent', cursor:'pointer' }}>
          Jobs ({jobs.length})
        </button>
        <button type="button" onClick={() => setMobilePanelView('thread')}
          style={{ flex:1, padding:'12px', fontSize:'13px', fontWeight: mobilePanelView === 'thread' ? 600 : 400, color: mobilePanelView === 'thread' ? '#0A0A0A' : '#7A9098', background:'none', border:'none', borderBottom: mobilePanelView === 'thread' ? '2px solid #D4522A' : '2px solid transparent', cursor:'pointer' }}>
          {selectedJob ? selectedJob.title.length > 20 ? selectedJob.title.slice(0,20) + '…' : selectedJob.title : 'Select a job'}
        </button>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'300px 1fr', overflow:'hidden', height:'calc(100vh - 64px)' }} className="messages-grid">

        <div className="messages-sidebar" style={{ borderRight:'1px solid rgba(28,43,50,0.1)', background:'#E8F0EE', overflowY:'auto' }}>
          <div style={{ padding:'16px', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
            <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', fontWeight:500, margin:0 }}>Job threads ({jobs.filter((j:any) => !['complete','cancelled'].includes(j.status)).length} active)</p>
          </div>
          {jobs.length === 0 && (
            <div style={{ padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:'28px', marginBottom:'10px', opacity:0.4 }}>💬</div>
              <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'8px' }}>No job threads yet.</p>
              <p style={{ fontSize:'12px', color:'#9AA5AA', lineHeight:'1.5' }}>Messages appear here once you have submitted a job request.</p>
              <a href="/request" style={{ display:'inline-block', marginTop:'12px', fontSize:'13px', color:'#2E6A8F', textDecoration:'none', border:'1px solid rgba(46,106,143,0.3)', borderRadius:'7px', padding:'7px 14px' }}>Start a request →</a>
            </div>
          )}
          {jobs.map(job => {
            const isSelected = selectedJob?.id === job.id
            return (
              <div key={job.id} onClick={() => selectJob(job)}
                style={{ padding:'16px', borderBottom:'1px solid rgba(28,43,50,0.08)', cursor:'pointer', background: isSelected ? 'rgba(28,43,50,0.06)' : 'transparent', borderLeft: isSelected ? '3px solid #D4522A' : '3px solid transparent', transition:'all 0.15s' }}>
                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.3px', marginBottom:'4px' }}>{job.title}</div>
                <div style={{ fontSize:'11px', color:'#7A9098', marginBottom:'3px' }}>{job.trade_category} · {job.suburb}</div>
                <div style={{ fontSize:'11px', color:'#4A5E64' }}>
                  {isTradie ? job.client?.full_name : job.tradie?.business_name || 'No tradie yet'}
                </div>
                <div style={{ marginTop:'4px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                  <span style={{ display:'inline-block', background:'rgba(28,43,50,0.06)', borderRadius:'4px', padding:'2px 8px', fontSize:'10px', color:'#7A9098', textTransform:'capitalize' }}>{job.status}</span>
                  {unread[job.id] > 0 && (
                    <span style={{ background:'#D4522A', color:'white', borderRadius:'100px', fontSize:'10px', fontWeight:700, padding:'1px 6px', lineHeight:'1.4', flexShrink:0 }}>{unread[job.id]}</span>
                  )}
                </div>
                {lastMessages[job.id] && (
                  <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'4px 0 0', lineHeight:'1.4', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical' as any }}>
                    {lastMessages[job.id].body.length > 50 ? lastMessages[job.id].body.slice(0,50) + '…' : lastMessages[job.id].body}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className={'messages-right-panel' + (mobilePanelView === 'list' ? ' messages-panel-hidden' : '')} style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {!selectedJob ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ fontSize:'15px', color:'#7A9098' }}>Select a job to view messages</p>
            </div>
          ) : (
            <>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.1)', background:'#E8F0EE', flexShrink:0 }}>
                <button type="button" className="messages-back-btn" onClick={() => setMobilePanelView('list')}
                  style={{ display:'none', fontSize:'12px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:'0 0 8px 0', alignItems:'center', gap:'4px' }}>
                  ← All jobs
                </button>
                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'2px' }}>{selectedJob.title}</div>
                <div style={{ fontSize:'12px', color:'#7A9098' }}>
                  {selectedJob.trade_category} · {selectedJob.suburb} · {isTradie ? selectedJob.client?.full_name : selectedJob.tradie?.business_name}
                </div>
              </div>

              <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px', color:'#7A9098', fontSize:'14px' }}>
                    No messages yet. Start the conversation below.
                  </div>
                )}
                {messages.length === 0 && (
                  <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', height:'200px', padding:'24px', textAlign:'center' as const }}>
                    <div style={{ fontSize:'28px', marginBottom:'10px', opacity:0.3 }}>💬</div>
                    <p style={{ fontSize:'13px', color:'#4A5E64', fontWeight:500, marginBottom:'4px' }}>No messages yet</p>
                    <p style={{ fontSize:'12px', color:'#9AA5AA' }}>Send the first message below.</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user?.id
                  const isSystem = !msg.sender_id || msg.body.startsWith('⚠') || msg.body.startsWith('✍') || msg.body.startsWith('✅') || msg.body.startsWith('📋') || msg.body.includes('has signed') || msg.body.includes('Scope updated') || msg.body.includes('milestone') || msg.body.includes('skipped')
                  // Date separator
                  const msgDate = new Date(msg.created_at).toDateString()
                  const prevDate = idx > 0 ? new Date(messages[idx-1].created_at).toDateString() : null
                  const showDate = msgDate !== prevDate
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div style={{ textAlign:'center', margin:'12px 0' }}>
                          <span style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', borderRadius:'100px', padding:'3px 10px' }}>
                            {new Date(msg.created_at).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' })}
                          </span>
                        </div>
                      )}
                      {isSystem ? (
                        <div style={{ textAlign:'center', margin:'4px 0' }}>
                          <span style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'5px 12px', display:'inline-block', lineHeight:'1.5' }}>
                            {msg.body}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                          <div style={{ fontSize:'11px', color:'#7A9098', marginBottom:'3px' }}>
                            {msg.sender?.full_name} · {new Date(msg.created_at).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
                          </div>
                          <div style={{
                            maxWidth:'70%', padding:'10px 14px', borderRadius:'12px',
                            background: isMine ? '#0A0A0A' : '#E8F0EE',
                            color: isMine ? 'rgba(216,228,225,0.9)' : '#0A0A0A',
                            border: isMine ? 'none' : '1px solid rgba(28,43,50,0.1)',
                            fontSize:'14px', lineHeight:'1.5',
                            borderBottomRightRadius: isMine ? '4px' : '12px',
                            borderBottomLeftRadius: isMine ? '12px' : '4px',
                          }}>
                            {msg.body}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(28,43,50,0.1)', background:'#E8F0EE', flexShrink:0 }}>
                {sendError && (
                  <p style={{ fontSize:'12px', color:'#D4522A', margin:'0 0 6px' }}>⚠ {sendError}</p>
                )}
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                  <textarea
                    value={newMessage}
                    onChange={e => { setNewMessage(e.target.value); if (sendError) setSendError(null) }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message... (Enter to send)"
                    rows={2}
                    style={{ flex:1, padding:'10px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'10px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'none', fontFamily:'sans-serif', lineHeight:'1.5' }}
                  />
                  <button type="button" onClick={sendMessage} disabled={sending || !newMessage.trim()}
                    style={{ background:'#D4522A', color:'white', padding:'10px 20px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:500, opacity: sending || !newMessage.trim() ? 0.5 : 1, flexShrink:0, height:'44px' }}>
                    Send
                  </button>
                </div>
                <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'6px' }}>Press Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div>}>
      <MessagesPageInner />
    </Suspense>
  )
}
