'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/hooks'
import { NavHeader } from '@/components/ui/NavHeader'

const EVENT_ICONS: Record<string, string> = {
  job_created: '📋', quote_request_sent: '✉️', quote_request_accepted: '✓',
  quote_request_declined: '✗', quote_submitted: '💰', consult_logged: '👁',
  scope_signed: '✍️', milestone_approved: '✓', site_observation: '📍',
  warranty_issue_logged: '⚠', warranty_response: '↩', warranty_resolved: '✓',
  job_signed_off: '🏁', message_sent: '💬', vault_filed: '🔒',
}

const STAGE_COLORS: Record<string, string> = {
  request: '#2E6A8F', match: '#2E6A8F', consult: '#6B4FA8',
  compare: '#C07830', agreement: '#6B4FA8', build: '#D4522A',
  signoff: '#C44B8A', warranty: '#2E7D60', system: '#7A9098',
}

function buildTimeline(job: any, messages: any[], milestones: any[], issues: any[], assessments: any[], agreements: any[], qrs: any[]) {
  const events: any[] = []

  if (job.created_at) events.push({ id: 'job_created', at: job.created_at, stage: 'request', type: 'job_created', title: 'Job request submitted', detail: job.title, actor: 'client' })

  ;(qrs || []).forEach((q: any) => {
    events.push({ id: 'qr_' + q.id, at: q.created_at, stage: 'match', type: 'quote_request_sent', title: 'Tradie invited to quote', detail: q.tradie?.business_name || '', actor: 'client' })
    if (q.qr_status === 'accepted') events.push({ id: 'qra_' + q.id, at: q.updated_at, stage: 'match', type: 'quote_request_accepted', title: 'Quote request accepted', detail: q.tradie?.business_name, actor: 'tradie' })
    if (q.qr_status === 'declined') events.push({ id: 'qrd_' + q.id, at: q.updated_at, stage: 'match', type: 'quote_request_declined', title: 'Quote request declined', detail: q.tradie?.business_name, actor: 'tradie' })
    if (q.quote_submitted_at) events.push({ id: 'qs_' + q.id, at: q.quote_submitted_at, stage: 'compare', type: 'quote_submitted', title: 'Estimate submitted', detail: (q.tradie?.business_name || '') + (q.amount ? ' · $' + q.amount.toLocaleString() : ''), actor: 'tradie' })
  })

  ;(assessments || []).forEach((a: any) => {
    events.push({ id: 'sa_' + a.id, at: a.created_at, stage: 'consult', type: 'consult_logged', title: a.role === 'tradie' ? 'Tradie site assessment logged' : 'Client consult notes logged', detail: (a.summary || a.observations || '').slice(0, 80), actor: a.role || 'system' })
  })

  ;(agreements || []).forEach((a: any) => {
    if (a.tradie_signed_at) events.push({ id: 'agts_' + a.id, at: a.tradie_signed_at, stage: 'agreement', type: 'scope_signed', title: 'Scope agreement signed by tradie', detail: '', actor: 'tradie' })
    if (a.client_signed_at) events.push({ id: 'agcs_' + a.id, at: a.client_signed_at, stage: 'agreement', type: 'scope_signed', title: 'Scope agreement signed by client', detail: '', actor: 'client' })
  })

  ;(milestones || []).forEach((m: any) => {
    if (m.approved_at) events.push({ id: 'mil_' + m.id, at: m.approved_at, stage: 'build', type: 'milestone_approved', title: 'Milestone approved', detail: m.title + (m.amount ? ' · $' + m.amount.toLocaleString() : ''), actor: 'client' })
  })

  ;(messages || []).forEach((m: any) => {
    events.push({ id: 'msg_' + m.id, at: m.created_at, stage: 'system', type: 'message_sent', title: 'Message / log entry', detail: (m.body || '').slice(0, 80), actor: m.sender_id === job.client_id ? 'client' : 'tradie' })
  })

  ;(issues || []).forEach((i: any) => {
    events.push({ id: 'wi_' + i.id, at: i.created_at, stage: 'warranty', type: 'warranty_issue_logged', title: 'Warranty issue logged', detail: i.title + ' · ' + i.severity + ' · ' + i.warranty_type, actor: 'client' })
    if (i.tradie_responded_at) events.push({ id: 'wr_' + i.id, at: i.tradie_responded_at, stage: 'warranty', type: 'warranty_response', title: 'Tradie responded to warranty issue', detail: (i.tradie_response || '').slice(0, 80), actor: 'tradie' })
    if (i.resolved_at) events.push({ id: 'wres_' + i.id, at: i.resolved_at, stage: 'warranty', type: 'warranty_resolved', title: 'Warranty issue resolved', detail: i.title, actor: 'system' })
    if (i.client_accepted_at) events.push({ id: 'wacc_' + i.id, at: i.client_accepted_at, stage: 'warranty', type: 'warranty_resolved', title: 'Resolution accepted by client', detail: i.title, actor: 'client' })
  })

  if (job.signoff_at) events.push({ id: 'signoff', at: job.signoff_at, stage: 'signoff', type: 'job_signed_off', title: 'Job signed off', detail: '', actor: 'client' })

  return events.filter(e => e.at).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export default function JobHistoryPage() {
  const [job, setJob] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'client' | 'tradie' | 'system'>('all')
  const supabase = useSupabase()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const params = new URLSearchParams(window.location.search)
      const jobId = params.get('job_id')
      if (!jobId) { setLoading(false); return }
      const [{ data: j }, { data: msgs }, { data: mils }, { data: iss }, { data: asses }, { data: ags }, { data: qrs }] = await Promise.all([
        supabase.from('jobs').select('*, tradie:tradie_profiles(business_name)').eq('id', jobId).single(),
        supabase.from('job_messages').select('*').eq('job_id', jobId).order('created_at'),
        supabase.from('milestones').select('*').eq('job_id', jobId).order('created_at'),
        supabase.from('warranty_issues').select('*').eq('job_id', jobId).order('created_at'),
        supabase.from('site_assessments').select('*').eq('job_id', jobId).order('created_at'),
        supabase.from('scope_agreements').select('*').eq('job_id', jobId).order('created_at'),
        supabase.from('quote_requests').select('*, tradie:tradie_profiles(business_name)').eq('job_id', jobId).order('created_at'),
      ])
      setJob(j)
      setEvents(buildTimeline(j, msgs || [], mils || [], iss || [], asses || [], ags || [], qrs || []))
      setLoading(false)
    })
  }, [])

  const isTradie = profile?.role === 'tradie'
  const filtered = filter === 'all' ? events : events.filter(e => e.actor === filter)
  const actorLabel = (a: string) => ({ client: 'Client', tradie: 'Tradie', system: 'System' }[a] || 'System')
  const actorColor = (a: string) => ({ client: '#2E6A8F', tradie: '#D4522A', system: '#7A9098' }[a] || '#7A9098')

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' as const, color: '#7A9098', fontSize: '13px' }}>Loading transaction log…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#F2F6F5' }}>
      <NavHeader profile={profile} isTradie={isTradie} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#7A9098', marginBottom: '4px' }}>Job audit trail</p>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '24px', color: '#0A0A0A', letterSpacing: '1px', margin: '0 0 6px' }}>TRANSACTION LOG</h1>
          {job && <p style={{ fontSize: '14px', color: '#4A5E64', margin: 0 }}>{job.title} · {job.tradie?.business_name || 'No tradie assigned'}</p>}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
          {(['all', 'client', 'tradie', 'system'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: '100px', border: '1.5px solid ' + (filter === f ? '#0A0A0A' : 'rgba(28,43,50,0.2)'), background: filter === f ? '#0A0A0A' : 'transparent', color: filter === f ? 'white' : '#4A5E64', fontSize: '12px', cursor: 'pointer', fontWeight: filter === f ? 500 : 400, textTransform: 'capitalize' as const }}>
              {f === 'all' ? 'All events (' + events.length + ')' : f}
            </button>
          ))}
        </div>

        {!job && <div style={{ padding: '40px', textAlign: 'center' as const, color: '#7A9098', fontSize: '13px' }}>No job selected — add ?job_id= to the URL.</div>}
        {job && filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center' as const, color: '#7A9098', fontSize: '13px' }}>No events match this filter.</div>}

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '2px', background: 'rgba(28,43,50,0.08)', zIndex: 0 }} />
          {filtered.map((ev, i) => (
            <div key={ev.id + i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '2px solid ' + (STAGE_COLORS[ev.stage] || '#7A9098'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, boxShadow: '0 1px 4px rgba(28,43,50,0.1)' }}>
                {EVENT_ICONS[ev.type] || '·'}
              </div>
              <div style={{ flex: 1, background: 'white', border: '1px solid rgba(28,43,50,0.08)', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(28,43,50,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' as const, marginBottom: ev.detail ? '4px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>{ev.title}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: actorColor(ev.actor) + '18', color: actorColor(ev.actor), fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{actorLabel(ev.actor)}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: (STAGE_COLORS[ev.stage] || '#7A9098') + '12', color: STAGE_COLORS[ev.stage] || '#7A9098', textTransform: 'capitalize' as const }}>{ev.stage}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9AA5AA', flexShrink: 0 }}>
                    {new Date(ev.at).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {ev.detail && <p style={{ fontSize: '12px', color: '#4A5E64', margin: 0, lineHeight: '1.5' }}>{ev.detail}</p>}
              </div>
            </div>
          ))}
        </div>

        {job && events.length > 0 && (
          <div style={{ marginTop: '32px', background: 'white', border: '1px solid rgba(28,43,50,0.08)', borderRadius: '12px', padding: '20px 24px' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '12px', color: '#7A9098', letterSpacing: '0.5px', margin: '0 0 16px' }}>LOG SUMMARY</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Total events', value: events.length },
                { label: 'Client actions', value: events.filter(e => e.actor === 'client').length },
                { label: 'Tradie actions', value: events.filter(e => e.actor === 'tradie').length },
                { label: 'First event', value: events[0] ? new Date(events[0].at).toLocaleDateString('en-AU') : '—' },
                { label: 'Latest event', value: events[events.length - 1] ? new Date(events[events.length - 1].at).toLocaleDateString('en-AU') : '—' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: '11px', color: '#9AA5AA', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{s.label}</p>
                  <p style={{ fontSize: '18px', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(28,43,50,0.04)', border: '1px solid rgba(28,43,50,0.08)', borderRadius: '8px' }}>
          <p style={{ fontSize: '11px', color: '#7A9098', margin: 0, lineHeight: '1.6' }}>
            This log records every transaction, action and event across the job lifecycle. All entries are timestamped. Accessible to client, tradie and Steadyhand admin.
          </p>
        </div>
      </div>
    </div>
  )
}
