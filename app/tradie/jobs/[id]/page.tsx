'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/hooks'
import { NavHeader } from '@/components/ui/NavHeader'

const STAGE_COLOR: Record<string, string> = {
  shortlisted:'#2E6A8F', assess:'#9B6B9B', consult:'#9B6B9B',
  quote:'#C07830', compare:'#C07830', agreement:'#6B4FA8',
  delivery:'#C07830', signoff:'#D4522A', warranty:'#1A6B5A', complete:'#2E7D60',
}
const STAGE_LABEL: Record<string, string> = {
  shortlisted:'Quote requested', assess:'Site consult', consult:'Consult',
  quote:'Quoting', compare:'Under review', agreement:'Agreement',
  delivery:'Delivery', signoff:'Sign-off', warranty:'Warranty', complete:'Complete',
}
const STAGE_PATH: Record<string, string> = {
  shortlisted:'/tradie/job', assess:'/consult', consult:'/consult',
  quote:'/tradie/job', compare:'/tradie/job', agreement:'/agreement',
  delivery:'/delivery', signoff:'/signoff', warranty:'/warranty', complete:'/warranty',
}

type Tab = 'overview'|'consult'|'quote'|'delivery'|'documents'|'messages'

export default function TradieJobHub() {
  const supabase = useSupabase()
  const [profile, setProfile] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [scope, setScope] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [stageDropdown, setStageDropdown] = useState(false)

  useEffect(() => {
    const jobId = window.location.pathname.split('/').pop() || new URLSearchParams(window.location.search).get('id')
    if (!jobId) { window.location.href = '/tradie/dashboard'; return }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles')
        .select('*, tradie:tradie_profiles(business_name, id)')
        .eq('id', session.user.id).single()
      setProfile(prof)

      const [
        { data: jobData },
        { data: assessData },
        { data: quotesData },
        { data: scopeData },
        { data: msData },
        { data: docsData },
        { data: msgData },
      ] = await Promise.all([
        supabase.from('jobs')
          .select('*, client:profiles!jobs_client_id_fkey(full_name, email, phone, suburb, address, org_id), org:organisations(name)')
          .eq('id', jobId).single(),
        supabase.from('site_assessments').select('*').eq('job_id', jobId).maybeSingle(),
        supabase.from('quotes').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
        supabase.from('scope_agreements').select('*').eq('job_id', jobId).maybeSingle(),
        supabase.from('milestones').select('*').eq('job_id', jobId).order('order_index', { ascending: true }),
        supabase.from('vault_documents').select('*').eq('job_id', jobId).eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('job_messages').select('*, sender:profiles(full_name, role)').eq('job_id', jobId).order('created_at', { ascending: false }).limit(5),
      ])

      if (!jobData) { window.location.href = '/tradie/dashboard'; return }
      setJob(jobData)
      setAssessment(assessData)
      setQuotes(quotesData || [])
      setScope(scopeData)
      setMilestones(msData || [])
      setDocs(docsData || [])
      setMessages(msgData || [])
      setLoading(false)
    })
  }, [])

  const stageColor = job ? (STAGE_COLOR[job.status] || '#7A9098') : '#7A9098'
  const stageLabel = job ? (STAGE_LABEL[job.status] || job?.status) : ''
  const currentQuote = quotes[0] || null

  const TABS: { id: Tab; label: string }[] = [
    { id:'overview', label:'Overview' },
    { id:'consult', label:'Consult' },
    { id:'quote', label:'Quote & Scope' },
    { id:'delivery', label:'Delivery' },
    { id:'documents', label:'Documents' },
    { id:'messages', label:'Messages' },
  ]

  const Row = ({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) => (
    <tr style={{ borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
      <td style={{ padding:'8px 12px', fontSize:'12px', color:'#7A9098', fontWeight:500, width:'38%', whiteSpace:'nowrap' as const }}>{label}</td>
      <td style={{ padding:'8px 12px', fontSize:'12px', color:'#0A0A0A', fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</td>
    </tr>
  )

  const Pill = ({ label, color }: { label: string; color: string }) => (
    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background: color + '18', border:'1px solid ' + color + '40', color, fontWeight:500 }}>{label}</span>
  )

  const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.8px', margin:0 }}>{title}</p>
      {action}
    </div>
  )

  const goToStage = (path: string) => {
    const param = path === '/tradie/job' ? '?id=' : '?job_id='
    window.location.href = path + param + job?.id
    setStageDropdown(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2' }}>
      <div style={{ background:'#0A0A0A', height:'120px' }} />
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'24px' }}>
        {[1,2,3].map(i => <div key={i} style={{ background:'#E8F0EE', borderRadius:'10px', height:'72px', marginBottom:'10px', opacity: 1 - i * 0.2 }} />)}
      </div>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' as const }}>
        <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'16px' }}>Job not found.</p>
        <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'#2E6A8F' }}>← Back to dashboard</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={true} />

      {/* ── Hero ── */}
      <div style={{ background:'#0A0A0A', padding:'24px 24px 0', position:'relative' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' as const, marginBottom:'16px' }}>
            <div>
              <a href="/tradie/dashboard" style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', textDecoration:'none', letterSpacing:'0.5px' }}>← DASHBOARD</a>
              <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.92)', letterSpacing:'1px', margin:'6px 0 4px' }}>{job.title}</h1>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>
                {job.trade_category} · {job.suburb} · {job.client?.full_name}
                {job.org?.name && <span style={{ color:'rgba(155,107,155,0.8)', marginLeft:'8px' }}>· 🏢 {job.org.name}</span>}
              </p>
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
              <Pill label={stageLabel} color={stageColor} />
              {/* Go to stage dropdown */}
              <div style={{ position:'relative' as const }}>
                <button type="button" onClick={() => setStageDropdown(v => !v)}
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(216,228,225,0.8)', padding:'5px 12px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
                  Go to stage ↓
                </button>
                {stageDropdown && (
                  <div style={{ position:'absolute' as const, top:'100%', right:0, marginTop:'4px', background:'#1A2830', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', overflow:'hidden', zIndex:50, minWidth:'180px' }}>
                    {Object.entries(STAGE_PATH).map(([status, path]) => (
                      <button key={status} type="button" onClick={() => goToStage(path)}
                        style={{ display:'block', width:'100%', textAlign:'left' as const, padding:'9px 14px', fontSize:'12px', color: job.status === status ? stageColor : 'rgba(216,228,225,0.7)', background: job.status === status ? 'rgba(255,255,255,0.06)' : 'transparent', border:'none', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {job.status === status ? '▸ ' : ''}{STAGE_LABEL[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:'2px', overflowX:'auto' as const }}>
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                style={{ padding:'9px 16px', fontSize:'12px', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'white' : 'rgba(216,228,225,0.45)', background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent', border:'none', borderRadius:'6px 6px 0 0', cursor:'pointer', whiteSpace:'nowrap' as const, letterSpacing:'0.3px' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'24px' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

            {/* Job details */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>JOB DETAILS</p>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <tbody>
                  <Row label="Status" value={stageLabel} />
                  <Row label="Trade" value={job.trade_category} />
                  <Row label="Suburb" value={job.suburb} />
                  <Row label="Posted" value={new Date(job.created_at).toLocaleDateString('en-AU')} />
                  <Row label="Last updated" value={new Date(job.updated_at).toLocaleDateString('en-AU')} />
                  {job.description && <Row label="Description" value={job.description.slice(0, 80) + (job.description.length > 80 ? '…' : '')} />}
                </tbody>
              </table>
            </div>

            {/* Client details */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>CLIENT</p>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <tbody>
                  <Row label="Name" value={job.client?.full_name} />
                  {job.org?.name && <Row label="Organisation" value={job.org.name} />}
                  <Row label="Email" value={job.client?.email} />
                  <Row label="Phone" value={job.client?.phone} />
                  <Row label="Suburb" value={job.client?.suburb} />
                </tbody>
              </table>
            </div>

            {/* Pipeline snapshot */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', gridColumn:'1 / -1' }}>
              <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>PIPELINE SNAPSHOT</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderCollapse:'collapse' as const }}>
                {[
                  { label:'Consult', done: !!assessment?.tradie_acknowledged_at, color:'#9B6B9B' },
                  { label:'Quote', done: quotes.length > 0, color:'#C07830' },
                  { label:'Scope', done: !!scope?.tradie_signed_at, color:'#6B4FA8' },
                  { label:'Milestones', done: milestones.length > 0 && milestones.every(m => m.status === 'approved'), color:'#2E6A8F' },
                  { label:'Sign-off', done: ['signoff','warranty','complete'].includes(job.status), color:'#2E7D60' },
                ].map((s, i) => (
                  <div key={i} style={{ padding:'14px', textAlign:'center' as const, borderRight: i < 4 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                    <div style={{ fontSize:'20px', marginBottom:'4px' }}>{s.done ? '✓' : '○'}</div>
                    <p style={{ fontSize:'11px', fontWeight:500, color: s.done ? s.color : '#9AA5AA', margin:0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── CONSULT ── */}
        {tab === 'consult' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>CONSULT NOTES</p>
              <a href={'/consult?job_id=' + job.id} style={{ fontSize:'12px', color:'#9B6B9B', textDecoration:'none', fontWeight:500 }}>Open consult page →</a>
            </div>
            {assessment ? (
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <tbody>
                  <Row label="Site access" value={assessment.site_access} />
                  <Row label="Existing conditions" value={assessment.existing_conditions} />
                  <Row label="Scope observations" value={assessment.scope_observations} />
                  <Row label="Materials noted" value={assessment.materials_noted} />
                  <Row label="Safety considerations" value={assessment.safety_considerations} />
                  <Row label="Quote assumptions" value={assessment.quote_assumptions} />
                  <Row label="Tradie acknowledged" value={assessment.tradie_acknowledged_at ? new Date(assessment.tradie_acknowledged_at).toLocaleDateString('en-AU') : null} />
                  <Row label="Client acknowledged" value={assessment.client_acknowledged_at ? new Date(assessment.client_acknowledged_at).toLocaleDateString('en-AU') : null} />
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'32px', textAlign:'center' as const }}>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'12px' }}>No consult notes recorded yet.</p>
                <a href={'/consult?job_id=' + job.id} style={{ fontSize:'13px', color:'#9B6B9B', fontWeight:500, textDecoration:'none' }}>Go to consult page →</a>
              </div>
            )}
          </div>
        )}

        {/* ── QUOTE & SCOPE ── */}
        {tab === 'quote' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>

            {/* Quotes table */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>QUOTES ({quotes.length})</p>
                <a href={'/tradie/job?id=' + job.id} style={{ fontSize:'12px', color:'#C07830', textDecoration:'none', fontWeight:500 }}>Submit / manage →</a>
              </div>
              {quotes.length > 0 ? (
                <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                  <thead>
                    <tr style={{ background:'rgba(28,43,50,0.03)' }}>
                      {['Version','Amount','Type','Status','Submitted'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', fontSize:'11px', color:'#7A9098', fontWeight:500, textAlign:'left' as const, borderBottom:'1px solid rgba(28,43,50,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q: any) => (
                      <tr key={q.id} style={{ borderBottom:'1px solid rgba(28,43,50,0.05)' }}>
                        <td style={{ padding:'8px 12px', fontSize:'12px', color:'#0A0A0A' }}>v{q.version}</td>
                        <td style={{ padding:'8px 12px', fontSize:'12px', color:'#0A0A0A', fontWeight:500 }}>${Number(q.total_amount || q.amount || 0).toLocaleString()}</td>
                        <td style={{ padding:'8px 12px', fontSize:'12px', color:'#7A9098' }}>{q.quote_type || '—'}</td>
                        <td style={{ padding:'8px 12px' }}><Pill label={q.status} color={q.status === 'accepted' ? '#2E7D60' : q.status === 'rejected' ? '#D4522A' : '#C07830'} /></td>
                        <td style={{ padding:'8px 12px', fontSize:'11px', color:'#9AA5AA' }}>{new Date(q.created_at).toLocaleDateString('en-AU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding:'24px', textAlign:'center' as const }}>
                  <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'10px' }}>No quotes submitted yet.</p>
                  <a href={'/tradie/job?id=' + job.id} style={{ fontSize:'13px', color:'#C07830', fontWeight:500, textDecoration:'none' }}>Go to job page to quote →</a>
                </div>
              )}
            </div>

            {/* Scope agreement */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>SCOPE AGREEMENT</p>
                <a href={'/agreement?job_id=' + job.id} style={{ fontSize:'12px', color:'#6B4FA8', textDecoration:'none', fontWeight:500 }}>View / sign →</a>
              </div>
              {scope ? (
                <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                  <tbody>
                    <Row label="Tradie signed" value={scope.tradie_signed_at ? new Date(scope.tradie_signed_at).toLocaleDateString('en-AU') : 'Not yet'} />
                    <Row label="Client signed" value={scope.client_signed_at ? new Date(scope.client_signed_at).toLocaleDateString('en-AU') : 'Not yet'} />
                    <Row label="Total value" value={scope.total_amount ? '$' + Number(scope.total_amount).toLocaleString() : null} />
                    <Row label="Inclusions" value={scope.inclusions?.slice(0,100)} />
                    <Row label="Exclusions" value={scope.exclusions?.slice(0,100)} />
                  </tbody>
                </table>
              ) : (
                <div style={{ padding:'24px', textAlign:'center' as const }}>
                  <p style={{ fontSize:'13px', color:'#7A9098' }}>No scope agreement yet — created after client accepts a quote.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DELIVERY ── */}
        {tab === 'delivery' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>MILESTONES ({milestones.length})</p>
              <a href={'/delivery?job_id=' + job.id} style={{ fontSize:'12px', color:'#C07830', textDecoration:'none', fontWeight:500 }}>Manage delivery →</a>
            </div>
            {milestones.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ background:'rgba(28,43,50,0.03)' }}>
                    {['#','Milestone','Amount','Status','Due'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', fontSize:'11px', color:'#7A9098', fontWeight:500, textAlign:'left' as const, borderBottom:'1px solid rgba(28,43,50,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m: any, i: number) => (
                    <tr key={m.id} style={{ borderBottom:'1px solid rgba(28,43,50,0.05)' }}>
                      <td style={{ padding:'8px 12px', fontSize:'12px', color:'#9AA5AA' }}>{i+1}</td>
                      <td style={{ padding:'8px 12px', fontSize:'12px', color:'#0A0A0A', fontWeight:500 }}>{m.title || m.label}</td>
                      <td style={{ padding:'8px 12px', fontSize:'12px', color:'#0A0A0A' }}>{m.amount ? '$' + Number(m.amount).toLocaleString() : '—'}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <Pill label={m.status} color={m.status==='approved'?'#2E7D60':m.status==='submitted'?'#C07830':m.status==='pending'?'#7A9098':'#D4522A'} />
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:'11px', color:'#9AA5AA' }}>{m.due_date ? new Date(m.due_date).toLocaleDateString('en-AU') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'24px', textAlign:'center' as const }}>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'10px' }}>No milestones set up yet.</p>
                <a href={'/delivery?job_id=' + job.id} style={{ fontSize:'13px', color:'#C07830', fontWeight:500, textDecoration:'none' }}>Go to delivery page →</a>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === 'documents' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>VAULT DOCUMENTS ({docs.length})</p>
              <a href="/tradie/vault" style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>Open vault →</a>
            </div>
            {docs.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ background:'rgba(28,43,50,0.03)' }}>
                    {['Document','Type','Date'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', fontSize:'11px', color:'#7A9098', fontWeight:500, textAlign:'left' as const, borderBottom:'1px solid rgba(28,43,50,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d: any) => (
                    <tr key={d.id} style={{ borderBottom:'1px solid rgba(28,43,50,0.05)' }}>
                      <td style={{ padding:'8px 12px', fontSize:'12px', color:'#0A0A0A', fontWeight:500 }}>📄 {d.title}</td>
                      <td style={{ padding:'8px 12px', fontSize:'11px', color:'#7A9098' }}>{d.document_type || '—'}</td>
                      <td style={{ padding:'8px 12px', fontSize:'11px', color:'#9AA5AA' }}>{new Date(d.created_at).toLocaleDateString('en-AU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'24px', textAlign:'center' as const }}>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>No documents filed to this job yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {tab === 'messages' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ background:'rgba(28,43,50,0.04)', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#4A5E64', letterSpacing:'0.8px', margin:0 }}>RECENT MESSAGES</p>
              <a href={'/messages?job=' + job.id} style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>Open full thread →</a>
            </div>
            {messages.length > 0 ? (
              <div>
                {[...messages].reverse().map((m: any) => (
                  <div key={m.id} style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.05)', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: m.sender?.role === 'tradie' ? '#2E6A8F' : '#9B6B9B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'white', fontWeight:600, flexShrink:0 }}>
                      {m.sender?.full_name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}>
                        <p style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{m.sender?.full_name}</p>
                        <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0 }}>{new Date(m.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{m.body}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding:'12px 14px' }}>
                  <a href={'/messages?job=' + job.id} style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>Open full thread to reply →</a>
                </div>
              </div>
            ) : (
              <div style={{ padding:'24px', textAlign:'center' as const }}>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'10px' }}>No messages yet.</p>
                <a href={'/messages?job=' + job.id} style={{ fontSize:'13px', color:'#2E6A8F', fontWeight:500, textDecoration:'none' }}>Open message thread →</a>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
