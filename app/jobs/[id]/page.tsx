'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/ui/NavHeader'

const STATUS_LABEL: Record<string,string> = {
  draft:'Draft', matching:'Matching', shortlisted:'Shortlisted', assess:'Consult',
  consult:'Consult', compare:'Compare', quote:'Quotes in', agreement:'Agreement',
  delivery:'In progress', signoff:'Sign off', warranty:'Warranty', complete:'Complete', cancelled:'Cancelled',
}
const STATUS_COLOR: Record<string,string> = {
  draft:'#9AA5AA', matching:'#2E7D60', shortlisted:'#2E6A8F', assess:'#9B6B9B',
  consult:'#9B6B9B', compare:'#C07830', quote:'#C07830', agreement:'#6B4FA8',
  delivery:'#C07830', signoff:'#D4522A', warranty:'#1A6B5A', complete:'#2E7D60', cancelled:'#9AA5AA',
}
const STAGE_PATH: Record<string,string> = {
  draft:'/request', matching:'/shortlist', shortlisted:'/shortlist',
  assess:'/consult', consult:'/consult', compare:'/compare', quote:'/compare',
  agreement:'/agreement', delivery:'/delivery', signoff:'/signoff',
  warranty:'/warranty', complete:'/warranty',
}

export default function JobHubPage() {
  const [job, setJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [scope, setScope] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [sharedDocs, setSharedDocs] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'quotes'|'scope'|'documents'|'messages'|'record'>('overview')
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (prof?.role === 'tradie') { window.location.href = '/tradie/dashboard'; return }
      setProfile(prof)
      const id = window.location.pathname.split('/').pop()
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, trade_categories, rating_avg, licence_verified, suburb), client:profiles!jobs_client_id_fkey(full_name, email)')
        .eq('id', id)
        .eq('client_id', session.user.id)
        .single()
      if (!jobData) { window.location.href = '/dashboard'; return }
      setJob(jobData)
      const [{ data: q }, { data: sc }, { data: ms }, { data: msgs }, { data: vd }, { data: shares }, { data: analytics }] = await Promise.all([
        supabase.from('quotes').select('*').eq('job_id', id).order('created_at', { ascending: false }),
        supabase.from('scope_agreements').select('*').eq('job_id', id).maybeSingle(),
        supabase.from('milestones').select('*').eq('job_id', id).order('order_index'),
        supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('job_id', id).order('created_at', { ascending: false }).limit(5),
        supabase.from('vault_documents').select('*').eq('job_id', id).eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('vault_document_shares').select('*, document:vault_documents(*)').eq('shared_with', session.user.id),
        supabase.from('job_analytics').select('*').eq('job_id', id).maybeSingle(),
      ])
      setQuotes(q || [])
      setScope(sc)
      if (analytics) setAnalytics(analytics)
      setMilestones(ms || [])
      setMessages(msgs || [])
      setDocs(vd || [])
      setSharedDocs((shares || []).map((s: any) => ({ ...s.document, _shared: true })).filter(Boolean))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <div style={{ background:'#0A0A0A', height:'120px' }} />
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'28px 24px' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background:'#E8F0EE', borderRadius:'12px', height:'80px', marginBottom:'12px', opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    </div>
  )
  if (!job) return null

  const stageColor = STATUS_COLOR[job.status] || '#9AA5AA'
  const stagePath = STAGE_PATH[job.status]
  const acceptedQuote = quotes.find((q: any) => q.status === 'accepted') || quotes[0]
  const allDocs = [...docs, ...sharedDocs]
  const paidAmount = milestones.filter((m: any) => m.status === 'approved').reduce((s: number, m: any) => s + Number(m.amount || 0), 0)
  const totalAmount = milestones.reduce((s: number, m: any) => s + Number(m.amount || 0), 0) || acceptedQuote?.total_price || 0

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false} />

      {/* Hero */}
      <div style={{ background:'#0A0A0A', padding:'28px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 50%, ' + stageColor + '30, transparent 60%)' }} />
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <a href="/dashboard" style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'12px' }}>← Dashboard</a>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(18px,3vw,24px)', color:'rgba(216,228,225,0.95)', letterSpacing:'1px', margin:'0 0 6px' }}>
                {job.title?.toUpperCase()}
              </h1>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', margin:'0 0 12px' }}>
                {job.trade_category} · {job.suburb}
                {job.tradie?.business_name ? ' · ' + job.tradie.business_name : ''}
              </p>
              <span style={{ fontSize:'12px', fontWeight:600, color:stageColor, background:stageColor + '20', border:'1px solid ' + stageColor + '40', borderRadius:'100px', padding:'4px 12px' }}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
            {totalAmount > 0 && (
              <div style={{ textAlign:'right' as const }}>
                <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:'0 0 2px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Job value</p>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)', margin:0 }}>${Number(totalAmount).toLocaleString()}</p>
                {paidAmount > 0 && <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:'2px 0 0' }}>${Number(paidAmount).toLocaleString()} paid</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary CTA — current stage action */}
      {stagePath && !['complete','cancelled','warranty'].includes(job.status) && (
        <div style={{ background:'#2E7D60', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
          <p style={{ fontSize:'13px', color:'white', margin:0, fontWeight:500 }}>
            {job.status === 'matching' && 'Steadyhand is building your shortlist'}
            {job.status === 'shortlisted' && 'Your shortlist is ready — review and invite a tradie to quote'}
            {job.status === 'consult' && 'Site consult in progress'}
            {(job.status === 'compare' || job.status === 'quote') && 'Quotes are in — review and accept one to proceed'}
            {job.status === 'agreement' && (scope ? 'Scope agreement ready — review and sign' : 'Waiting for your tradie to draft the scope')}
            {job.status === 'delivery' && 'Work in progress — approve milestones as they\'re completed'}
            {job.status === 'signoff' && 'Work complete — review and sign off'}
          </p>
          <a href={stagePath + '?job_id=' + job.id} style={{ fontSize:'13px', fontWeight:600, color:'white', textDecoration:'none', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'7px', padding:'8px 16px', flexShrink:0 }}>
            Go to {STATUS_LABEL[job.status]} →
          </a>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
        {([
          { key:'overview', label:'Overview' },
          { key:'quotes', label:'Quotes' + (quotes.length > 0 ? ' (' + quotes.length + ')' : '') },
          { key:'scope', label:'Scope & milestones' },
          { key:'documents', label:'Documents' + (allDocs.length > 0 ? ' (' + allDocs.length + ')' : '') },
          { key:'messages', label:'Messages' },
          { key:'record', label:'Job Record' },
        ] as {key: typeof activeTab, label: string}[]).map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            style={{ padding:'14px 18px', border:'none', borderBottom: activeTab === t.key ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === t.key ? 600 : 400, color: activeTab === t.key ? '#0A0A0A' : '#7A9098', whiteSpace:'nowrap' as const, flexShrink:0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'28px 24px' }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>

            {/* Tradie card */}
            {job.tradie && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'10px' }}>Your tradie</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                  <div>
                    <p style={{ fontSize:'15px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>{job.tradie.business_name}</p>
                    <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                      {job.tradie.trade_categories?.join(', ')}
                      {job.tradie.suburb ? ' · ' + job.tradie.suburb : ''}
                      {job.tradie.licence_verified ? ' · ✓ Verified' : ''}
                    </p>
                  </div>
                  {job.tradie.rating_avg && (
                    <div style={{ textAlign:'center' as const }}>
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#C07830', margin:'0 0 2px' }}>{Number(job.tradie.rating_avg).toFixed(1)}</p>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Rating</p>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap' as const }}>
                  <a href={'/messages?job=' + job.id} style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'6px', padding:'6px 12px' }}>
                    Message tradie →
                  </a>
                </div>
              </div>
            )}

            {/* Progress timeline */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'14px' }}>Job progress</p>
              <div style={{ display:'flex', gap:'0', overflowX:'auto' as const }}>
                {['shortlisted','consult','agreement','delivery','signoff','warranty','complete'].map((s, i, arr) => {
                  const statusOrder = ['shortlisted','consult','agreement','delivery','signoff','warranty','complete']
                  const currentIdx = statusOrder.indexOf(job.status)
                  const stageIdx = statusOrder.indexOf(s)
                  const done = stageIdx < currentIdx
                  const active = stageIdx === currentIdx
                  const color = done ? '#2E7D60' : active ? STATUS_COLOR[s] || '#C07830' : 'rgba(28,43,50,0.15)'
                  return (
                    <div key={s} style={{ display:'flex', alignItems:'center', flex: i < arr.length - 1 ? 1 : 0 }}>
                      <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'4px', minWidth:'60px' }}>
                        <div style={{ width:'24px', height:'24px', borderRadius:'50%', background: done ? '#2E7D60' : active ? color : 'rgba(28,43,50,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color: done || active ? 'white' : '#9AA5AA', fontWeight:600 }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <p style={{ fontSize:'10px', color: active ? '#0A0A0A' : done ? '#2E7D60' : '#9AA5AA', margin:0, textAlign:'center' as const, fontWeight: active ? 600 : 400 }}>
                          {STATUS_LABEL[s]}
                        </p>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ flex:1, height:'2px', background: done ? '#2E7D60' : 'rgba(28,43,50,0.1)', margin:'0 0 16px', minWidth:'20px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Job details */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Job details</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {[
                  ['Trade', job.trade_category],
                  ['Location', job.suburb],
                  ['Property', job.property_type],
                  ['Budget', job.budget_range],
                  ['Created', new Date(job.created_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })],
                ].filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                    <p style={{ fontSize:'12px', color:'#7A9098', margin:0, flexShrink:0 }}>{k}</p>
                    <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0, textAlign:'right' as const }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {job.description && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'8px' }}>Description</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>{job.description}</p>
              </div>
            )}
          </div>
        )}

        {/* ── QUOTES ── */}
        {activeTab === 'quotes' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            {quotes.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'40px', background:'#E8F0EE', borderRadius:'14px' }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>💰</p>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No quotes yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>Quotes from tradies will appear here once submitted.</p>
              </div>
            ) : quotes.map((q: any) => {
              const isAccepted = q.status === 'accepted'
              return (
                <div key={q.id} style={{ background:'#E8F0EE', border:'1px solid ' + (isAccepted ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.1)'), borderRadius:'12px', overflow:'hidden' }}>
                  <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#0A0A0A', margin:0 }}>${Number(q.total_price).toLocaleString()}</p>
                        <span style={{ fontSize:'11px', color:'rgba(28,43,50,0.4)' }}>AUD inc. GST</span>
                        {isAccepted && <span style={{ fontSize:'11px', color:'#2E7D60', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'2px 8px' }}>✓ Accepted</span>}
                      </div>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Version {q.version || 1} · {new Date(q.created_at).toLocaleDateString('en-AU')}</p>
                    </div>
                    {['compare','quote'].includes(job.status) && !isAccepted && (
                      <a href={'/compare?job_id=' + job.id} style={{ fontSize:'13px', color:'white', background:'#2E7D60', padding:'9px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:500, flexShrink:0 }}>
                        Review & accept →
                      </a>
                    )}
                  </div>
                  {q.line_items && q.line_items.length > 0 && (
                    <div style={{ padding:'14px 20px' }}>
                      {q.line_items.slice(0,5).map((item: any, i: number) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom: i < Math.min(q.line_items.length, 5) - 1 ? '1px solid rgba(28,43,50,0.05)' : 'none' }}>
                          <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>{item.category} — {item.label}</p>
                          <p style={{ fontSize:'12px', color:'#0A0A0A', fontWeight:500, margin:0 }}>${Number(item.amount || 0).toLocaleString()}</p>
                        </div>
                      ))}
                      {q.line_items.length > 5 && <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'8px 0 0' }}>+{q.line_items.length - 5} more items</p>}
                      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', borderTop:'1px solid rgba(28,43,50,0.1)', marginTop:'8px' }}>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:0 }}>Total</p>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:0 }}>${Number(q.total_price).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {q.start_date && (
                    <div style={{ padding:'10px 20px', background:'rgba(28,43,50,0.03)', borderTop:'1px solid rgba(28,43,50,0.06)' }}>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                        Start: {new Date(q.start_date).toLocaleDateString('en-AU')}
                        {q.duration_days ? ' · Duration: ' + q.duration_days + ' days' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── SCOPE & MILESTONES ── */}
        {activeTab === 'scope' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            {!scope ? (
              <div style={{ textAlign:'center' as const, padding:'40px', background:'#E8F0EE', borderRadius:'14px' }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>📋</p>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>
                  {job.status === 'agreement' ? 'Scope being prepared' : 'Scope agreement not yet started'}
                </p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>
                  {job.status === 'agreement' ? 'Your tradie is drafting the scope agreement. You\'ll be notified when it\'s ready to review.' : 'The scope agreement will appear here once your quote is accepted.'}
                </p>
              </div>
            ) : (
              <>
                {/* Signing status */}
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Scope agreement</p>
                  <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
                    <div style={{ flex:1, padding:'10px', background: scope.tradie_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border:'1px solid ' + (scope.tradie_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius:'8px', textAlign:'center' as const }}>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 3px' }}>Tradie</p>
                      <p style={{ fontSize:'13px', fontWeight:500, color: scope.tradie_signed_at ? '#2E7D60' : '#0A0A0A', margin:0 }}>{scope.tradie_signed_at ? '✓ Signed' : 'Not signed'}</p>
                    </div>
                    <div style={{ flex:1, padding:'10px', background: scope.client_signed_at ? 'rgba(46,125,96,0.06)' : '#C8D5D2', border:'1px solid ' + (scope.client_signed_at ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.15)'), borderRadius:'8px', textAlign:'center' as const }}>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 3px' }}>You</p>
                      <p style={{ fontSize:'13px', fontWeight:500, color: scope.client_signed_at ? '#2E7D60' : '#0A0A0A', margin:0 }}>{scope.client_signed_at ? '✓ Signed' : 'Not signed'}</p>
                    </div>
                  </div>
                  {!scope.client_signed_at && scope.tradie_signed_at && (
                    <a href={'/agreement?job_id=' + job.id} style={{ display:'block', textAlign:'center' as const, background:'#6B4FA8', color:'white', padding:'12px', borderRadius:'8px', textDecoration:'none', fontSize:'13px', fontWeight:600 }}>
                      Review and sign scope →
                    </a>
                  )}
                  {scope.client_signed_at && scope.tradie_signed_at && (
                    <a href={'/agreement?job_id=' + job.id} style={{ display:'block', textAlign:'center' as const, background:'rgba(46,125,96,0.08)', color:'#2E7D60', padding:'10px', borderRadius:'8px', textDecoration:'none', fontSize:'13px', border:'1px solid rgba(46,125,96,0.2)' }}>
                      View signed scope →
                    </a>
                  )}
                </div>

                {/* Inclusions / exclusions */}
                {scope.inclusions?.length > 0 && (
                  <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'10px' }}>What\'s included</p>
                    {scope.inclusions.map((item: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'6px' }}>
                        <span style={{ color:'#2E7D60', flexShrink:0 }}>✓</span>
                        <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{item}</p>
                      </div>
                    ))}
                    {scope.exclusions?.length > 0 && (
                      <>
                        <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'14px 0 10px' }}>Not included</p>
                        {scope.exclusions.map((item: string, i: number) => (
                          <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'6px' }}>
                            <span style={{ color:'#D4522A', flexShrink:0 }}>✕</span>
                            <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{item}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Milestones */}
            {milestones.length > 0 && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:0 }}>Payment milestones</p>
                </div>
                {milestones.map((m: any, i: number) => (
                  <div key={m.id} style={{ padding:'14px 20px', borderBottom: i < milestones.length - 1 ? '1px solid rgba(28,43,50,0.06)' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: m.status === 'approved' ? 'rgba(46,125,96,0.1)' : 'rgba(28,43,50,0.06)', border:'1px solid ' + (m.status === 'approved' ? 'rgba(46,125,96,0.3)' : 'rgba(28,43,50,0.1)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color: m.status === 'approved' ? '#2E7D60' : '#9AA5AA', fontWeight:600, flexShrink:0 }}>
                        {m.status === 'approved' ? '✓' : i + 1}
                      </div>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{m.label}</p>
                        {m.description && <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{m.description}</p>}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>${Number(m.amount || 0).toLocaleString()}</p>
                      <span style={{ fontSize:'11px', color: m.status === 'approved' ? '#2E7D60' : m.status === 'active' ? '#C07830' : '#9AA5AA' }}>
                        {m.status === 'approved' ? 'Paid' : m.status === 'active' ? 'Due now' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                <div style={{ padding:'12px 20px', background:'rgba(28,43,50,0.03)', borderTop:'1px solid rgba(28,43,50,0.08)', display:'flex', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:0 }}>Total</p>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:0 }}>${Number(totalAmount).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {allDocs.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'40px', background:'#E8F0EE', borderRadius:'14px' }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>📁</p>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No documents yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>Scope agreements, certificates and documents shared by your tradie will appear here automatically.</p>
              </div>
            ) : allDocs.map((doc: any) => (
              <div key={doc.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'11px', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{doc.title}</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                    {doc.document_type?.replace(/_/g,' ')}
                    {doc._shared ? ' · Shared by tradie' : ''}
                    {doc.issued_date ? ' · ' + new Date(doc.issued_date).toLocaleDateString('en-AU') : ''}
                  </p>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'6px', padding:'6px 12px', flexShrink:0 }}>
                    Open →
                  </a>
                )}
              </div>
            ))}
            <a href="/vault" style={{ display:'block', textAlign:'center' as const, padding:'12px', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', color:'#4A5E64', textDecoration:'none', fontSize:'13px', marginTop:'4px' }}>
              View full document vault →
            </a>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === 'record' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            <div style={{ background:'#0A0A0A', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Property Record</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 4px' }}>{job.title}</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:0 }}>{job.trade_category} · {job.suburb} · {new Date(job.created_at).toLocaleDateString('en-AU', { month:'long', year:'numeric' })}</p>
            </div>

            {!analytics ? (
              <div style={{ background:'#E8F0EE', borderRadius:'12px', padding:'24px', textAlign:'center' as const }}>
                <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>Record data will appear as your job progresses through each stage.</p>
              </div>
            ) : (
              <>
                {/* Financial summary */}
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'14px' }}>Financial summary</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'12px' }}>
                    {[
                      { label:'Agreed scope value', value: analytics.final_scope_value ? '$' + Number(analytics.final_scope_value).toLocaleString() : '—' },
                      { label:'Variations raised', value: analytics.variation_count > 0 ? analytics.variation_count + ' (+$' + Number(analytics.variation_value_total).toLocaleString() + ')' : 'None' },
                      { label:'Milestones', value: analytics.milestone_count || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background:'white', borderRadius:'8px', padding:'12px 14px' }}>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 4px' }}>{label}</p>
                        <p style={{ fontSize:'15px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'14px' }}>Timeline</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                    {[
                      { label:'Job created', date: analytics.job_created_at, done: true },
                      { label:'Scope agreed', date: analytics.scope_signed_at, done: !!analytics.scope_signed_at },
                      { label:'Work started', date: analytics.first_milestone_submitted_at, done: !!analytics.first_milestone_submitted_at },
                      { label:'Work completed', date: analytics.all_milestones_approved_at, done: !!analytics.all_milestones_approved_at },
                      { label:'Sign-off', date: analytics.signoff_completed_at, done: !!analytics.signoff_completed_at },
                      { label:'Warranty started', date: analytics.warranty_started_at, done: !!analytics.warranty_started_at },
                    ].filter(e => e.done).map(({ label, date }) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2E7D60', flexShrink:0 }} />
                          <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0 }}>{label}</p>
                        </div>
                        <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{date ? new Date(date).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }) : '—'}</p>
                      </div>
                    ))}
                  </div>
                  {(analytics.days_delivery || analytics.days_request_to_scope) && (
                    <div style={{ marginTop:'14px', padding:'12px', background:'white', borderRadius:'8px', display:'flex', gap:'20px', flexWrap:'wrap' as const }}>
                      {analytics.days_request_to_scope > 0 && <div><p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 2px' }}>Request to scope</p><p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{analytics.days_request_to_scope} days</p></div>}
                      {analytics.days_delivery > 0 && <div><p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 2px' }}>Delivery time</p><p style={{ fontSize:'14px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{analytics.days_delivery} days</p></div>}
                    </div>
                  )}
                </div>

                {/* Warranty */}
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'14px' }}>Warranty record</p>
                  {analytics.warranty_issues_count === 0 ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'20px' }}>✅</span>
                      <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:0 }}>No warranty issues raised</p>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                      <div style={{ background:'white', borderRadius:'8px', padding:'12px 14px' }}>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 4px' }}>Issues raised</p>
                        <p style={{ fontSize:'18px', fontWeight:600, color:'#C07830', margin:0 }}>{analytics.warranty_issues_count}</p>
                      </div>
                      <div style={{ background:'white', borderRadius:'8px', padding:'12px 14px' }}>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 4px' }}>Resolved</p>
                        <p style={{ fontSize:'18px', fontWeight:600, color:'#2E7D60', margin:0 }}>{analytics.warranty_issues_resolved}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            {messages.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'16px' }}>
                {[...messages].reverse().map((m: any) => (
                  <div key={m.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 16px' }}>
                    <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 4px' }}>
                      {m.sender?.full_name || 'System'} · {new Date(m.created_at).toLocaleDateString('en-AU', { day:'numeric', month:'short' })}
                    </p>
                    <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0, lineHeight:'1.5' }}>{m.body}</p>
                  </div>
                ))}
              </div>
            )}
            <a href={'/messages?job=' + job.id} style={{ display:'block', textAlign:'center' as const, background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>
              Open full message thread →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
