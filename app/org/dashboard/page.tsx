'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', matching: 'Matching', shortlisted: 'Shortlisted',
  assess: 'Consult', compare: 'Compare', agreement: 'Contract',
  delivery: 'Build', signoff: 'Complete', warranty: 'Protect', complete: 'Done',
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#9AA5AA', matching: '#2E7D60', shortlisted: '#2E6A8F',
  assess: '#9B6B9B', compare: '#7B5EA7', agreement: '#6B4FA8',
  delivery: '#C07830', signoff: '#D4522A', warranty: '#1A6B5A', complete: '#2E7D60',
}

export default function OrgDashboardPage() {
  const [org, setOrg] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs'|'properties'|'members'>('jobs')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProperty, setFilterProperty] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof?.org_id) { window.location.href = '/org/setup'; return }
      setProfile(prof)

      const { data: orgData } = await supabase.from('organisations').select('*').eq('id', prof.org_id).single()
      setOrg(orgData)

      const { data: props } = await supabase.from('properties').select('*').eq('org_id', prof.org_id).order('address')
      setProperties(props || [])

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name), property:properties(address, suburb)')
        .eq('org_id', prof.org_id)
        .order('updated_at', { ascending: false })
      setJobs(jobsData || [])

      const { data: mems } = await supabase
        .from('org_memberships')
        .select('*, profile:profiles(full_name, email)')
        .eq('org_id', prof.org_id)
      setMembers(mems || [])

      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64', fontFamily: 'sans-serif' }}>Loading...</p>
    </div>
  )

  const filteredJobs = jobs.filter(j => {
    if (filterStatus && j.status !== filterStatus) return false
    if (filterProperty && j.property_id !== filterProperty) return false
    return true
  })

  const activeJobs = jobs.filter(j => !['complete', 'cancelled'].includes(j.status))
  const totalSpend = jobs.filter(j => j.agreed_price).reduce((sum, j) => sum + Number(j.agreed_price), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px' }}>STEADYHAND</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a href="/org/properties/new" style={{ fontSize: '13px', color: 'white', textDecoration: 'none', padding: '7px 14px', background: '#D4522A', borderRadius: '6px' }}>+ Add property</a>
          <a href="/request" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none', padding: '7px 14px', border: '1px solid rgba(28,43,50,0.2)', borderRadius: '6px' }}>New job request</a>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>Personal dashboard</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: '#1C2B32', padding: '36px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(212,82,42,0.15), transparent 55%)' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(216,228,225,0.4)', marginBottom: '6px' }}>
            {org?.type?.replace('_', ' ')} · Organisation dashboard
          </p>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: 'clamp(20px, 3vw, 28px)', color: 'rgba(216,228,225,0.9)', letterSpacing: '2px', marginBottom: '4px' }}>
            {org?.name?.toUpperCase()}
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(216,228,225,0.45)', fontWeight: 300 }}>
            {properties.length} properties · {activeJobs.length} active jobs · {members.length} team members
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Active jobs', value: activeJobs.length },
            { label: 'Properties', value: properties.length },
            { label: 'In delivery', value: jobs.filter(j => j.status === 'delivery').length },
            { label: 'Total job value', value: totalSpend > 0 ? '$' + totalSpend.toLocaleString() : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '12px', color: '#4A5E64', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#1C2B32' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(28,43,50,0.1)', marginBottom: '20px' }}>
          {([
            { id: 'jobs', label: 'All jobs', count: jobs.length },
            { id: 'properties', label: 'Properties', count: properties.length },
            { id: 'members', label: 'Team', count: members.length },
          ] as const).map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === t.id ? '2px solid #D4522A' : '2px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#1C2B32' : '#7A9098', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t.label}
              <span style={{ background: activeTab === t.id ? '#D4522A' : 'rgba(28,43,50,0.1)', color: activeTab === t.id ? 'white' : '#7A9098', fontSize: '10px', padding: '1px 6px', borderRadius: '100px' }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Jobs tab */}
        {activeTab === 'jobs' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', background: '#E8F0EE', color: '#1C2B32', outline: 'none' }}>
                <option value=''>All statuses</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '13px', background: '#E8F0EE', color: '#1C2B32', outline: 'none' }}>
                <option value=''>All properties</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
              </select>
            </div>

            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '48px', background: '#E8F0EE', borderRadius: '14px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🏗</div>
                <p style={{ fontSize: '15px', color: '#4A5E64', marginBottom: '6px' }}>No jobs yet</p>
                <p style={{ fontSize: '13px', color: '#7A9098', marginBottom: '20px' }}>Add properties and create job requests to get started.</p>
                <a href="/request"><button type="button" style={{ background: '#D4522A', color: 'white', padding: '11px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>New job request →</button></a>
              </div>
            ) : (
              <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(28,43,50,0.08)', background: 'rgba(28,43,50,0.03)' }}>
                      {['Job', 'Property', 'Tradie', 'Stage', 'Value', ''].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, fontSize: '11px', color: '#7A9098', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map(job => (
                      <tr key={job.id} style={{ borderBottom: '1px solid rgba(28,43,50,0.06)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: '#1C2B32', margin: '0 0 2px' }}>{job.title}</p>
                          <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>{job.trade_category}</p>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4A5E64' }}>
                          {job.property?.address || job.suburb || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4A5E64' }}>
                          {job.tradie?.business_name || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: (STATUS_COLOR[job.status] || '#9AA5AA') + '18', border: '1px solid ' + (STATUS_COLOR[job.status] || '#9AA5AA') + '40', color: STATUS_COLOR[job.status] || '#9AA5AA', fontWeight: 500 }}>
                            {STATUS_LABEL[job.status] || job.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#1C2B32' }}>
                          {job.agreed_price ? '$' + Number(job.agreed_price).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <a href={'/dashboard/' + job.id} style={{ fontSize: '12px', color: '#2E6A8F', textDecoration: 'none' }}>View →</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Properties tab */}
        {activeTab === 'properties' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <a href="/org/properties/new">
                <button type="button" style={{ background: '#1C2B32', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                  + Add property
                </button>
              </a>
            </div>
            {properties.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '48px', background: '#E8F0EE', borderRadius: '14px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🏢</div>
                <p style={{ fontSize: '15px', color: '#4A5E64', marginBottom: '6px' }}>No properties yet</p>
                <p style={{ fontSize: '13px', color: '#7A9098' }}>Add your first property to start managing jobs by location.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {properties.map(p => {
                  const propJobs = jobs.filter(j => j.property_id === p.id)
                  const activeCount = propJobs.filter(j => !['complete', 'cancelled'].includes(j.status)).length
                  return (
                    <a key={p.id} href={'/org/properties/' + p.id} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '18px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1C2B32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '16px' }}>🏢</span>
                          </div>
                          {activeCount > 0 && (
                            <span style={{ fontSize: '11px', background: 'rgba(212,82,42,0.1)', border: '1px solid rgba(212,82,42,0.2)', color: '#D4522A', borderRadius: '100px', padding: '2px 8px', fontWeight: 500 }}>
                              {activeCount} active
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', marginBottom: '3px' }}>{p.address}</p>
                        <p style={{ fontSize: '12px', color: '#7A9098', marginBottom: '8px' }}>{p.suburb} · {p.property_type}</p>
                        <p style={{ fontSize: '12px', color: '#4A5E64' }}>{propJobs.length} job{propJobs.length !== 1 ? 's' : ''} total</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          <div>
            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: '#1C2B32', letterSpacing: '0.5px', margin: 0 }}>TEAM MEMBERS</p>
                <button type="button" style={{ background: '#1C2B32', color: 'white', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                  + Invite member
                </button>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(28,43,50,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1C2B32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: 'white', flexShrink: 0 }}>
                        {m.profile?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32', margin: '0 0 2px' }}>{m.profile?.full_name}</p>
                        <p style={{ fontSize: '12px', color: '#7A9098', margin: 0 }}>{m.profile?.email}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: m.role === 'admin' ? 'rgba(212,82,42,0.1)' : 'rgba(28,43,50,0.06)', border: '1px solid ' + (m.role === 'admin' ? 'rgba(212,82,42,0.2)' : 'rgba(28,43,50,0.1)'), color: m.role === 'admin' ? '#D4522A' : '#4A5E64', fontWeight: 500, textTransform: 'capitalize' as const }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
