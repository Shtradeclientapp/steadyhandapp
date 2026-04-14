'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIER_LIMITS: Record<string, number> = {
  property_starter: 10,
  property_growth: 50,
  property_enterprise: Infinity,
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', matching: 'Matching', shortlisted: 'Shortlisted',
  assess: 'Consult', compare: 'Compare', agreement: 'Agreement',
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
  const [preferredTradies, setPreferredTradies] = useState<any[]>([])
  const [showAddTradie, setShowAddTradie] = useState(false)
  const [tradieSearch, setTradieSearch] = useState('')
  const [tradieResults, setTradieResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs'|'properties'|'members'|'preferred'|'reports'>('jobs')
  const [myRole, setMyRole] = useState<string>('member')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProperty, setFilterProperty] = useState('')
  const [showContractorImport, setShowContractorImport] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvResult, setCsvResult] = useState<string|null>(null)
  const [manualContractor, setManualContractor] = useState({ name:'', email:'' })
  const [addingManual, setAddingManual] = useState(false)

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
      // Find current user's role
      const myMembership = (mems || []).find((m: any) => m.profile?.email === prof?.email)
      if (myMembership) setMyRole(myMembership.role)
      else setMyRole('admin') // org creator is admin

      const { data: preferred } = await supabase
        .from('org_preferred_tradies')
        .select('*, tradie:tradie_profiles(business_name, trade_categories, suburb, rating_avg, jobs_completed, licence_verified)')
        .eq('org_id', prof.org_id)
      setPreferredTradies(preferred || [])
      setLoading(false)
    })
  }, [])

  const searchTradies = async (q: string) => {
    setTradieSearch(q)
    if (q.length < 2) { setTradieResults([]); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('tradie_profiles')
      .select('id, business_name, trade_categories, suburb, rating_avg, licence_verified')
      .ilike('business_name', '%' + q + '%')
      .limit(8)
    setTradieResults(data || [])
  }

  const addPreferredTradie = async (tradieId: string) => {
    const supabase = createClient()
    await supabase.from('org_preferred_tradies').insert({ org_id: org.id, tradie_id: tradieId, added_by: profile.id })
    const { data: preferred } = await supabase
      .from('org_preferred_tradies')
      .select('*, tradie:tradie_profiles(business_name, trade_categories, suburb, rating_avg, jobs_completed, licence_verified)')
      .eq('org_id', org.id)
    setPreferredTradies(preferred || [])
    setShowAddTradie(false)
    setTradieSearch('')
    setTradieResults([])
  }

  const removePreferredTradie = async (id: string) => {
    const supabase = createClient()
    await supabase.from('org_preferred_tradies').delete().eq('id', id)
    setPreferredTradies(prev => prev.filter(p => p.id !== id))
  }

  const importContractorsCSV = async (file: File) => {
    setCsvImporting(true)
    setCsvResult(null)
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].toLowerCase().split(',').map(h => h.replace(/"/g,'').trim())
    const nameIdx = headers.findIndex(h => h.includes('name'))
    const emailIdx = headers.findIndex(h => h.includes('email'))
    const tradeIdx = headers.findIndex(h => h.includes('trade'))
    const licenceIdx = headers.findIndex(h => h.includes('licen'))
    if (nameIdx === -1 || emailIdx === -1) { setCsvResult('CSV must have name and email columns'); setCsvImporting(false); return }
    const supabase = createClient()
    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/"/g,'').trim())
      const name = cols[nameIdx] || ''
      const email = cols[emailIdx] || ''
      if (!name || !email) continue
      const trade = tradeIdx >= 0 ? cols[tradeIdx] : null
      const licence = licenceIdx >= 0 ? cols[licenceIdx] : null
      await supabase.from('org_preferred_tradies').upsert({
        org_id: org.id,
        added_by: profile.id,
        contractor_name: name,
        contractor_email: email,
        trade_category: trade,
        licence_number: licence,
        import_source: 'csv',
      }, { onConflict: 'org_id,contractor_email' })
      imported++
    }
    const { data: preferred } = await supabase.from('org_preferred_tradies').select('*, tradie:tradie_profiles(business_name, trade_category)').eq('org_id', org.id)
    setPreferredTradies(preferred || [])
    setCsvResult('✓ Imported ' + imported + ' contractor' + (imported !== 1 ? 's' : ''))
    setCsvImporting(false)
  }

  const addManualContractor = async () => {
    if (!manualContractor.name || !manualContractor.email) return
    setAddingManual(true)
    const supabase = createClient()
    await supabase.from('org_preferred_tradies').upsert({
      org_id: org.id,
      added_by: profile.id,
      contractor_name: manualContractor.name,
      contractor_email: manualContractor.email,
      import_source: 'manual',
    }, { onConflict: 'org_id,contractor_email' })
    const { data: preferred } = await supabase.from('org_preferred_tradies').select('*, tradie:tradie_profiles(business_name, trade_category)').eq('org_id', org.id)
    setPreferredTradies(preferred || [])
    setManualContractor({ name:'', email:'' })
    setAddingManual(false)
  }

  const exportJobsCSV = () => {
    const headers = ['Job title', 'Trade', 'Property', 'Tradie', 'Status', 'Value', 'Updated']
    const rows = jobs.map(j => [
      j.title,
      j.trade_category,
      j.property?.address || j.suburb || '',
      j.tradie?.business_name || '',
      STATUS_LABEL[j.status] || j.status,
      j.agreed_price ? '$' + Number(j.agreed_price).toLocaleString() : '',
      new Date(j.updated_at).toLocaleDateString('en-AU'),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (org?.name || 'org') + '-jobs-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const removeMember = async (memberId: string, memberName: string) => {
    if (!confirm('Remove ' + memberName + ' from your organisation?')) return
    const supabase = createClient()
    await supabase.from('org_memberships').delete().eq('id', memberId)
    setMembers(prev => prev.filter((m: any) => m.id !== memberId))
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !org) return
    setInviting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    try {
      await supabase.from('org_memberships').insert({
        org_id: org.id,
        role: inviteRole,
        invited_email: inviteEmail.trim(),
        invited_at: new Date().toISOString(),
        invited_by: session?.user.id,
        status: 'pending',
      })
    } catch { /* non-critical */ }
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'org_invite',
        to: inviteEmail.trim(),
        org_name: org.name,
        org_id: org.id,
        role: inviteRole,
      }),
    }).catch(() => {})
    setInviteSent(true)
    setInviting(false)
    setInviteEmail('')
    setTimeout(() => { setInviteSent(false); setShowInvite(false) }, 2000)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const filteredJobs = jobs.filter(j => {
    if (filterStatus && j.status !== filterStatus) return false
    if (filterProperty && j.property_id !== filterProperty) return false
    return true
  })
  const activeJobs = jobs.filter(j => !['complete','cancelled'].includes(j.status))
  const totalSpend = jobs.filter(j => j.agreed_price).reduce((sum, j) => sum + Number(j.agreed_price), 0)

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <a href="/org/properties/new" style={{ fontSize:'13px', color:'white', textDecoration:'none', padding:'7px 14px', background:'#D4522A', borderRadius:'6px' }}>+ Add property</a>
          <a href="/org/request" style={{ fontSize:'13px', color:'white', textDecoration:'none', padding:'7px 14px', background:'#2E7D60', borderRadius:'6px' }}>+ New job request</a>
          <a href="/request" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'6px' }}>New job</a>
          <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Personal dashboard</a>
        </div>
      </nav>

      <div style={{ background:'#1C2B32', padding:'36px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(212,82,42,0.15), transparent 55%)' }} />
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>{org?.type?.replace('_',' ')} · Organisation dashboard</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(20px,3vw,28px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>{org?.name?.toUpperCase()}</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', fontWeight:300 }}>{properties.length} properties · {activeJobs.length} active jobs · {members.length} team members</p>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'28px' }}>
          {[
            { label:'Active jobs', value: activeJobs.length },
            { label:'Properties', value: properties.length },
            { label:'In delivery', value: jobs.filter(j => j.status === 'delivery').length },
            { label:'Total job value', value: totalSpend > 0 ? '$' + totalSpend.toLocaleString() : '—' },
          ].map(s => (
            <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'6px' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)', marginBottom:'20px' }}>
          {([
            { id:'jobs', label:'All jobs', count: jobs.length },
            { id:'properties', label:'Properties', count: properties.length },
            { id:'members', label:'Team', count: members.length },
            { id:'preferred', label:'Preferred tradies', count: preferredTradies.length },
            { id:'reports', label:'Reports', count: undefined },
          ] as const).map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{ padding:'10px 20px', border:'none', borderBottom: activeTab === t.id ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#1C2B32' : '#7A9098', display:'flex', alignItems:'center', gap:'6px' }}>
              {t.label}
              <span style={{ background: activeTab === t.id ? '#D4522A' : 'rgba(28,43,50,0.1)', color: activeTab === t.id ? 'white' : '#7A9098', fontSize:'10px', padding:'1px 6px', borderRadius:'100px' }}>{t.count}</span>
            </button>
          ))}
        </div>

        {activeTab === 'jobs' && (
          <div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' as const }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#E8F0EE', color:'#1C2B32', outline:'none' }}>
                <option value=''>All statuses</option>
                {Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
                style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#E8F0EE', color:'#1C2B32', outline:'none' }}>
                <option value=''>All properties</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
              </select>
            </div>
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'48px', background:'#E8F0EE', borderRadius:'14px' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>🏗</div>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'16px' }}>No jobs yet — add properties and create job requests to get started.</p>
                <a href="/request"><button type="button" style={{ background:'#D4522A', color:'white', padding:'11px 24px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>New job request →</button></a>
              </div>
            ) : (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:'13px' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.03)' }}>
                      {['Job','Property','Tradie','Stage','Value',''].map(h => (
                        <th key={h} style={{ padding:'12px 16px', textAlign:'left' as const, fontSize:'11px', color:'#7A9098', fontWeight:500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map(job => (
                      <tr key={job.id} style={{ borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                        <td style={{ padding:'12px 16px' }}>
                          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', margin:'0 0 2px' }}>{job.title}</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{job.trade_category}</p>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:'#4A5E64' }}>{job.property?.address || job.suburb || '—'}</td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:'#4A5E64' }}>{job.tradie?.business_name || '—'}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'100px', background:(STATUS_COLOR[job.status]||'#9AA5AA')+'18', border:'1px solid '+(STATUS_COLOR[job.status]||'#9AA5AA')+'40', color:STATUS_COLOR[job.status]||'#9AA5AA', fontWeight:500 }}>
                            {STATUS_LABEL[job.status]||job.status}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{job.agreed_price ? '$'+Number(job.agreed_price).toLocaleString() : '—'}</td>
                        <td style={{ padding:'12px 16px' }}><a href={'/dashboard/'+job.id} style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none' }}>View →</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'properties' && (
          <div>
            {(() => {
              const tier = org?.subscription_tier || 'property_starter'
              const limit = TIER_LIMITS[tier] || 10
              const atLimit = properties.length >= limit
              return (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <div>
                    {limit < Infinity && <p style={{ fontSize:'12px', color: atLimit ? '#D4522A' : '#7A9098', margin:0 }}>{properties.length} / {limit} properties used{atLimit ? ' — upgrade to add more' : ''}</p>}
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {atLimit ? (
                      <a href="/org/subscribe"><button type="button" style={{ background:'#D4522A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>Upgrade plan →</button></a>
                    ) : (
                      <a href="/org/properties/new"><button type="button" style={{ background:'#1C2B32', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>+ Add property</button></a>
                    )}
                  </div>
                </div>
              )
            })()}
            {properties.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'48px', background:'#E8F0EE', borderRadius:'14px' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>🏢</div>
                <p style={{ fontSize:'15px', color:'#4A5E64' }}>No properties yet — add your first property to start managing jobs by location.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'14px' }}>
                {properties.map(p => {
                  const propJobs = jobs.filter(j => j.property_id === p.id)
                  const activeCount = propJobs.filter(j => !['complete','cancelled'].includes(j.status)).length
                  return (
                    <a key={p.id} href={'/org/properties/'+p.id} style={{ textDecoration:'none' }}>
                      <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px', cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'8px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ fontSize:'16px' }}>🏢</span>
                          </div>
                          {activeCount > 0 && <span style={{ fontSize:'11px', background:'rgba(212,82,42,0.1)', border:'1px solid rgba(212,82,42,0.2)', color:'#D4522A', borderRadius:'100px', padding:'2px 8px', fontWeight:500 }}>{activeCount} active</span>}
                        </div>
                        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', marginBottom:'3px' }}>{p.address}</p>
                        <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'8px' }}>{p.suburb} · {p.property_type}</p>
                        <p style={{ fontSize:'12px', color:'#4A5E64' }}>{propJobs.length} job{propJobs.length !== 1 ? 's' : ''} total</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', margin:0 }}>TEAM MEMBERS</p>
                <button type="button" onClick={() => setShowInvite(!showInvite)}
                  style={{ background:'#1C2B32', color:'white', padding:'7px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  + Invite member
                </button>
              </div>
              {showInvite && (
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(46,106,143,0.04)' }}>
                  {inviteSent ? (
                    <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:0 }}>✓ Invite sent to {inviteEmail || 'member'}</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                      <p style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', margin:0 }}>Invite a team member by email</p>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com.au"
                          style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', minWidth:'200px' }} />
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                          style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button type="button" onClick={sendInvite} disabled={!inviteEmail.trim() || inviting}
                          style={{ background:'#2E6A8F', color:'white', padding:'8px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity:!inviteEmail.trim() || inviting ? 0.5 : 1 }}>
                          {inviting ? 'Sending...' : 'Send invite'}
                        </button>
                      </div>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>They will receive an email with a link to join your organisation.</p>
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding:'16px 20px' }}>
                {members.map(m => (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'white', flexShrink:0 }}>
                        {m.profile?.full_name?.charAt(0)||'?'}
                      </div>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{m.profile?.full_name}</p>
                        <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{m.profile?.email}</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                      {m.status === 'pending' && (
                        <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'100px', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', color:'#C07830', fontWeight:500 }}>Pending</span>
                      )}
                      <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background: m.role==='admin'?'rgba(212,82,42,0.1)':'rgba(28,43,50,0.06)', border:'1px solid '+(m.role==='admin'?'rgba(212,82,42,0.2)':'rgba(28,43,50,0.1)'), color: m.role==='admin'?'#D4522A':'#4A5E64', fontWeight:500, textTransform:'capitalize' as const }}>
                        {m.role}
                      </span>
                      <button type="button" onClick={() => removeMember(m.id, m.profile?.full_name || 'this member')}
                        style={{ fontSize:'11px', color:'#9AA5AA', background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferred tradies tab */}
        {activeTab === 'preferred' && (
          <div>
            <div style={{ background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
              <p style={{ fontSize:'13px', color:'#2E6A8F', fontWeight:500, marginBottom:'4px' }}>Preferred tradie network</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                Preferred tradies appear first in your shortlist when creating job requests. Add trusted trade businesses you have worked with before.
              </p>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
              <button type="button" onClick={() => setShowAddTradie(!showAddTradie)}
                style={{ background: showAddTradie ? 'rgba(28,43,50,0.08)' : '#1C2B32', color: showAddTradie ? '#1C2B32' : 'white', padding:'9px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                {showAddTradie ? 'Cancel' : '+ Add preferred tradie'}
                </button>
                <button type="button" onClick={() => setShowContractorImport(!showContractorImport)}
                  style={{ background:'rgba(46,106,143,0.1)', color:'#2E6A8F', padding:'7px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:500, border:'1px solid rgba(46,106,143,0.2)', cursor:'pointer' }}>
                  {showContractorImport ? 'Cancel import' : '↑ Import CSV'}
              </button>
            </div>
            {showAddTradie && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px', marginBottom:'16px' }}>
                <input type="text" placeholder="Search by business name..." value={tradieSearch}
                  onChange={e => searchTradies(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
                {tradieResults.length > 0 && (
                  <div style={{ marginTop:'8px', background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', overflow:'hidden' }}>
                    {tradieResults.map(t => (
                      <div key={t.id} onClick={() => addPreferredTradie(t.id)}
                        style={{ padding:'11px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{t.business_name}</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{(t.trade_categories || []).slice(0,2).join(', ')} · {t.suburb}</p>
                        </div>
                        <span style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500 }}>+ Add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {showContractorImport && (
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(46,106,143,0.04)' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'12px' }}>Import contractor list</p>
                <div style={{ marginBottom:'16px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', marginBottom:'6px', textTransform:'uppercase' as const }}>CSV Upload</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'8px' }}>CSV must include columns: <strong>name</strong>, <strong>email</strong>. Optional: trade, licence.</p>
                  <input type="file" accept=".csv" onChange={e => e.target.files?.[0] && importContractorsCSV(e.target.files[0])}
                    style={{ fontSize:'13px', color:'#1C2B32' }} />
                  {csvImporting && <p style={{ fontSize:'12px', color:'#C07830', marginTop:'6px' }}>Importing...</p>}
                  {csvResult && <p style={{ fontSize:'12px', color: csvResult.startsWith('✓') ? '#2E7D60' : '#D4522A', marginTop:'6px', fontWeight:500 }}>{csvResult}</p>}
                </div>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', marginBottom:'6px', textTransform:'uppercase' as const }}>Or add manually</p>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
                    <input type="text" value={manualContractor.name} onChange={e => setManualContractor(m => ({ ...m, name: e.target.value }))}
                      placeholder="Contractor name"
                      style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', minWidth:'160px' }} />
                    <input type="email" value={manualContractor.email} onChange={e => setManualContractor(m => ({ ...m, email: e.target.value }))}
                      placeholder="Email address"
                      style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', minWidth:'160px' }} />
                    <button type="button" onClick={addManualContractor} disabled={!manualContractor.name || !manualContractor.email || addingManual}
                      style={{ background:'#2E6A8F', color:'white', padding:'8px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !manualContractor.name || !manualContractor.email ? 0.5 : 1 }}>
                      {addingManual ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {preferredTradies.length === 0 && !showAddTradie ? (
              <div style={{ textAlign:'center' as const, padding:'40px', background:'#E8F0EE', borderRadius:'12px' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.4 }}>⭐</div>
                <p style={{ fontSize:'14px', color:'#4A5E64' }}>No preferred tradies yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098', marginTop:'4px' }}>Add trusted trade businesses to see them first in your shortlist.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {preferredTradies.map(pt => (
                  <div key={pt.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'11px', padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                    <div>
                      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', margin:'0 0 3px' }}>{pt.tradie?.business_name}</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>
                        {(pt.tradie?.trade_categories || []).slice(0,2).join(', ')}
                        {pt.tradie?.suburb ? ' · ' + pt.tradie.suburb : ''}
                        {pt.tradie?.rating_avg > 0 ? ' · ⭐ ' + Number(pt.tradie.rating_avg).toFixed(1) : ''}
                        {pt.tradie?.licence_verified ? ' · ✓ Verified' : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => removePreferredTradie(pt.id)}
                      style={{ background:'transparent', color:'rgba(212,82,42,0.5)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', cursor:'pointer' }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports tab */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.03)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', margin:0 }}>EXPORT REPORTS</p>
              </div>
              <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', background:'#F4F8F7', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)' }}>
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', margin:'0 0 4px' }}>All jobs — CSV</p>
                    <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Job title, trade, property, tradie, status, value and date for all {jobs.length} jobs</p>
                  </div>
                  <button type="button" onClick={exportJobsCSV}
                    style={{ background:'#1C2B32', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
                    Download CSV →
                  </button>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', background:'#F4F8F7', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)' }}>
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', margin:'0 0 4px' }}>Spend by property — CSV</p>
                    <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Total spend per property across all completed jobs</p>
                  </div>
                  <button type="button" onClick={() => {
                    const rows = properties.map(p => {
                      const propJobs = jobs.filter(j => j.property_id === p.id && j.agreed_price)
                      const total = propJobs.reduce((s, j) => s + Number(j.agreed_price), 0)
                      return [p.address, p.suburb || '', propJobs.length, '$' + total.toLocaleString()]
                    })
                    const csv = [['Address','Suburb','Jobs','Total spend'], ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n')
                    const blob = new Blob([csv], { type:'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = (org?.name||'org') + '-spend-by-property-' + new Date().toISOString().split('T')[0] + '.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                    style={{ background:'#1C2B32', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
                    Download CSV →
                  </button>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', background:'#F4F8F7', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)' }}>
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', margin:'0 0 4px' }}>Warranty tracking — CSV</p>
                    <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Jobs in warranty period with tradie details and expiry dates</p>
                  </div>
                  <button type="button" onClick={() => {
                    const warrantyJobs = jobs.filter(j => j.status === 'warranty' || j.status === 'signoff')
                    const rows = warrantyJobs.map(j => [
                      j.title, j.trade_category,
                      j.property?.address || j.suburb || '',
                      j.tradie?.business_name || '',
                      STATUS_LABEL[j.status] || j.status,
                    ])
                    const csv = [['Job','Trade','Property','Tradie','Status'], ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n')
                    const blob = new Blob([csv], { type:'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = (org?.name||'org') + '-warranty-' + new Date().toISOString().split('T')[0] + '.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                    style={{ background:'#1C2B32', color:'white', padding:'9px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
                    Download CSV →
                  </button>
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'14px 16px' }}>
              <p style={{ fontSize:'12px', color:'#C07830', margin:0 }}>PDF reports and GST-ready payment summaries coming soon for Steadyhand Business accounts.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
