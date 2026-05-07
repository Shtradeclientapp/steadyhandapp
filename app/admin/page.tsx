'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview' | 'tradies' | 'clients' | 'jobs' | 'onboarding'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [tradies, setTradies] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('id, email, full_name, role, is_admin').eq('id', session.user.id).single()
      if (!prof?.is_admin) { window.location.href = '/'; return }
      setAuthed(true)
      await loadAll(supabase)
      setLoading(false)
    })
  }, [])

  const loadAll = async (supabase: any) => {
    const [{ data: t }, { data: c }, { data: j }] = await Promise.all([
      supabase.from('tradie_profiles').select('*, profile:profiles(id, full_name, email, is_admin, created_at)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, admin_notes').eq('role', 'client').order('created_at', { ascending: false }),
      supabase.from('jobs').select('*, tradie:tradie_profiles(business_name), client:profiles!jobs_client_id_fkey(full_name, email)').order('created_at', { ascending: false }).limit(200),
    ])
    setTradies(t || [])
    setClients(c || [])
    setJobs(j || [])
    setStats({
      total_tradies: (t || []).length,
      active_subs: (t || []).filter((x: any) => x.subscription_active).length,
      pending_verification: (t || []).filter((x: any) => x.onboarding_step === 'pending_verification').length,
      total_clients: (c || []).length,
      total_jobs: (j || []).length,
      jobs_active: (j || []).filter((x: any) => !['complete','cancelled'].includes(x.status)).length,
      jobs_delivery: (j || []).filter((x: any) => x.status === 'delivery').length,
      jobs_warranty: (j || []).filter((x: any) => x.status === 'warranty').length,
      jobs_stuck: (j || []).filter((x: any) => {
        const days = (Date.now() - new Date(x.updated_at).getTime()) / 86400000
        return days > 14 && !['complete','cancelled'].includes(x.status)
      }).length,
    })
  }

  const save = async (updates: any, table: string, id: string) => {
    setSaving(true)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from(table).update(updates).eq('id', id)
    if (error) setMsg('Error: ' + error.message)
    else { setMsg('Saved'); setTimeout(() => setMsg(null), 2000) }
    setSaving(false)
    await loadAll(supabase)
  }

  const sendOnboardingEmail = async (tradie_id: string, email_type: string) => {
    setSaving(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradie_id, email_type }),
    })
    const data = await res.json()
    setMsg(data.sent ? 'Email sent' : 'Error: ' + data.error)
    setTimeout(() => setMsg(null), 3000)
    setSaving(false)
  }

  const inp = { width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }
  const btn = (color: string) => ({ padding:'6px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', background:color, color:'white', opacity: saving ? 0.6 : 1 })

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0A0A0A' }}><p style={{ color:'rgba(216,228,225,0.5)' }}>Loading admin...</p></div>
  if (!authed) return null

  const filteredTradies = tradies.filter(t => !search || t.business_name?.toLowerCase().includes(search.toLowerCase()) || t.profile?.email?.toLowerCase().includes(search.toLowerCase()))
  const filteredClients = clients.filter(c => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  const filteredJobs = jobs.filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.tradie?.business_name?.toLowerCase().includes(search.toLowerCase()))

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tradies', label: `Tradies (${tradies.length})` },
    { id: 'clients', label: `Clients (${clients.length})` },
    { id: 'jobs', label: `Jobs (${jobs.length})` },
    { id: 'onboarding', label: 'Onboarding' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', fontFamily:'sans-serif', color:'rgba(216,228,225,0.9)' }}>
      {/* Header */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <a href="/admin" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
          <span style={{ fontSize:'11px', color:'rgba(216,228,225,0.3)', letterSpacing:'1px' }}>ADMIN</span>
        </div>
        {msg && <span style={{ fontSize:'13px', color: msg.startsWith('Error') ? '#D4522A' : '#2E7D60', background: msg.startsWith('Error') ? 'rgba(212,82,42,0.1)' : 'rgba(46,125,96,0.1)', padding:'6px 14px', borderRadius:'6px' }}>{msg}</span>}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inp, width:'220px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)' }} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'2px', padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'13px', border:'none', cursor:'pointer', background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === t.id ? 'rgba(216,228,225,0.9)' : 'rgba(216,228,225,0.4)', fontWeight: tab === t.id ? 500 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'24px', maxWidth:'1200px', margin:'0 auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'12px', marginBottom:'28px' }}>
              {[
                { label:'Total tradies', value: stats.total_tradies, color:'#2E6A8F' },
                { label:'Paying subscribers', value: stats.active_subs, color:'#2E7D60' },
                { label:'Total clients', value: stats.total_clients, color:'#9B6B9B' },
                { label:'Total jobs', value: stats.total_jobs, color:'#C07830' },
                { label:'Active jobs', value: stats.jobs_active, color:'#D4522A' },
                { label:'In delivery', value: stats.jobs_delivery, color:'#6B4FA8' },
                { label:'Under warranty', value: stats.jobs_warranty, color:'#2E7D60' },
                { label:'Stuck >14 days', value: stats.jobs_stuck, color: stats.jobs_stuck > 0 ? '#D4522A' : '#2E7D60' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'16px' }}>
                  <p style={{ fontSize:'28px', fontWeight:700, color:s.color, margin:'0 0 4px' }}>{s.value ?? '—'}</p>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Stuck jobs */}
            {stats.jobs_stuck > 0 && (
              <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'12px', padding:'18px 20px', marginBottom:'20px' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#D4522A', letterSpacing:'0.5px', margin:'0 0 12px' }}>STUCK JOBS — NO UPDATE IN 14+ DAYS</p>
                {jobs.filter(j => {
                  const days = (Date.now() - new Date(j.updated_at).getTime()) / 86400000
                  return days > 14 && !['complete','cancelled'].includes(j.status)
                }).map(j => (
                  <div key={j.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(212,82,42,0.1)', gap:'12px' }}>
                    <div>
                      <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.8)', margin:'0 0 2px' }}>{j.title}</p>
                      <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:0 }}>{j.tradie?.business_name} · {j.status} · last updated {Math.floor((Date.now() - new Date(j.updated_at).getTime()) / 86400000)} days ago</p>
                    </div>
                    <button type="button" onClick={() => { setTab('jobs'); setSelected(j) }} style={btn('#D4522A')}>View →</button>
                  </div>
                ))}
              </div>
            )}

            {/* Recent signups */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'18px 20px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:'0 0 14px' }}>RECENT TRADIE SIGNUPS</p>
              {tradies.slice(0, 8).map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', gap:'12px' }}>
                  <div>
                    <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.8)', margin:'0 0 2px' }}>{t.business_name || '—'}</p>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:0 }}>{t.profile?.email} · {t.onboarding_step || 'profile'} · joined {new Date(t.profile?.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background: t.subscription_active ? 'rgba(46,125,96,0.15)' : 'rgba(192,120,48,0.12)', color: t.subscription_active ? '#2E7D60' : '#C07830' }}>
                      {t.free_tier_override || t.subscription_tier || 'basic'}
                    </span>
                    <button type="button" onClick={() => { setTab('tradies'); setSelected(t) }} style={btn('#2E6A8F')}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRADIES ── */}
        {tab === 'tradies' && (
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:'20px', alignItems:'start' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:0 }}>ALL TRADIES</p>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Business','Email','Tier','Onboarding','Joined','Actions'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', fontSize:'11px', color:'rgba(216,228,225,0.35)', textAlign:'left' as const, fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTradies.map(t => (
                    <tr key={t.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: selected?.id === t.id ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                      <td style={{ padding:'10px 12px', fontSize:'13px', color:'rgba(216,228,225,0.8)' }}>{t.business_name || '—'}</td>
                      <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{t.profile?.email}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background: t.subscription_active ? 'rgba(46,125,96,0.15)' : 'rgba(192,120,48,0.12)', color: t.subscription_active ? '#2E7D60' : '#C07830' }}>
                          {t.free_tier_override || t.subscription_tier || 'basic'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{t.onboarding_step || 'profile'}</td>
                      <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.35)' }}>{new Date(t.profile?.created_at).toLocaleDateString('en-AU')}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <button type="button" onClick={() => setSelected(selected?.id === t.id ? null : t)} style={btn('#2E6A8F')}>
                          {selected?.id === t.id ? 'Close' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit panel */}
            {selected && tab === 'tradies' && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px', position:'sticky', top:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:0 }}>EDIT TRADIE</p>
                  <button type="button" onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'rgba(216,228,225,0.4)', cursor:'pointer', fontSize:'18px' }}>×</button>
                </div>
                <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:'0 0 4px' }}>{selected.business_name}</p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:'0 0 20px' }}>{selected.profile?.email}</p>

                <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>

                  {/* Subscription override */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Free tier override</label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {['none','basic','business','pro'].map(tier => (
                        <button key={tier} type="button"
                          onClick={() => save({ free_tier_override: tier === 'none' ? null : tier, subscription_active: tier !== 'none', subscription_tier: tier !== 'none' ? tier : selected.subscription_tier }, 'tradie_profiles', selected.id)}
                          style={{ ...btn(selected.free_tier_override === tier || (tier === 'none' && !selected.free_tier_override) ? '#D4522A' : 'rgba(255,255,255,0.08)'), color:'rgba(216,228,225,0.8)', fontSize:'11px' }}>
                          {tier}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.25)', margin:'4px 0 0' }}>Overrides Stripe — gives free access to that tier</p>
                  </div>

                  {/* Trial end date */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Trial ends</label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <input type="date" defaultValue={selected.trial_ends_at?.split('T')[0] || ''} id="trial_date"
                        style={{ ...inp, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)', flex:1 }} />
                      <button type="button" onClick={() => {
                        const val = (document.getElementById('trial_date') as HTMLInputElement)?.value
                        save({ trial_ends_at: val ? new Date(val).toISOString() : null, subscription_active: true, free_tier_override: 'business' }, 'tradie_profiles', selected.id)
                      }} style={btn('#2E7D60')}>Set</button>
                    </div>
                  </div>

                  {/* Worker seats */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Worker seats included</label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {[0,2,5,10].map(n => (
                        <button key={n} type="button"
                          onClick={() => save({ worker_seats_included: n }, 'tradie_profiles', selected.id)}
                          style={{ ...btn(selected.worker_seats_included === n ? '#D4522A' : 'rgba(255,255,255,0.08)'), color:'rgba(216,228,225,0.8)', fontSize:'11px' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Onboarding step */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Onboarding step</label>
                    <select defaultValue={selected.onboarding_step || 'profile'} onChange={e => save({ onboarding_step: e.target.value }, 'tradie_profiles', selected.id)}
                      style={{ ...inp, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)' }}>
                      {['profile','invite_client','first_job','active','complete'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Suspend / reinstate */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Account status</label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button type="button" onClick={() => save({ suspended_at: selected.suspended_at ? null : new Date().toISOString() }, 'tradie_profiles', selected.id)}
                        style={btn(selected.suspended_at ? '#2E7D60' : '#D4522A')}>
                        {selected.suspended_at ? 'Reinstate account' : 'Suspend account'}
                      </button>
                    </div>
                    {selected.suspended_at && <p style={{ fontSize:'11px', color:'#D4522A', margin:'4px 0 0' }}>Suspended {new Date(selected.suspended_at).toLocaleDateString('en-AU')}</p>}
                  </div>

                  {/* Admin notes */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Admin notes</label>
                    <textarea defaultValue={selected.admin_notes || ''} id="admin_notes" rows={3}
                      style={{ ...inp, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)', resize:'vertical' as const }} />
                    <button type="button" onClick={() => {
                      const val = (document.getElementById('admin_notes') as HTMLTextAreaElement)?.value
                      save({ admin_notes: val }, 'tradie_profiles', selected.id)
                    }} style={{ ...btn('#2E6A8F'), marginTop:'6px' }}>Save notes</button>
                  </div>

                  {/* Onboarding emails */}
                  <div>
                    <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'6px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Send onboarding email</label>
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const }}>
                      {['welcome','profile_complete','first_job','checkin'].map(type => (
                        <button key={type} type="button" onClick={() => sendOnboardingEmail(selected.id, type)}
                          style={{ ...btn('rgba(255,255,255,0.08)'), color:'rgba(216,228,225,0.7)', fontSize:'11px' }}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View as tradie */}
                  <a href="/tradie/dashboard" target="_blank"
                    style={{ display:'block', textAlign:'center' as const, padding:'9px', borderRadius:'7px', background:'rgba(255,255,255,0.06)', color:'rgba(216,228,225,0.6)', textDecoration:'none', fontSize:'12px' }}>
                    View tradie dashboard →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTS ── */}
        {tab === 'clients' && (
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap:'20px', alignItems:'start' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:0 }}>ALL CLIENTS</p>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Name','Email','Suburb','Jobs','Joined','Actions'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', fontSize:'11px', color:'rgba(216,228,225,0.35)', textAlign:'left' as const, fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(cl => {
                    const clientJobs = jobs.filter(j => j.client_id === cl.id)
                    return (
                      <tr key={cl.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: selected?.id === cl.id ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                        <td style={{ padding:'10px 12px', fontSize:'13px', color:'rgba(216,228,225,0.8)' }}>{cl.full_name || '—'}</td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{cl.email}</td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{cl.suburb || '—'}</td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{clientJobs.length}</td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.35)' }}>{new Date(cl.created_at).toLocaleDateString('en-AU')}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <button type="button" onClick={() => setSelected(selected?.id === cl.id ? null : cl)} style={btn('#2E6A8F')}>
                            {selected?.id === cl.id ? 'Close' : 'View'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {selected && tab === 'clients' && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px', position:'sticky', top:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:0 }}>CLIENT DETAIL</p>
                  <button type="button" onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'rgba(216,228,225,0.4)', cursor:'pointer', fontSize:'18px' }}>×</button>
                </div>

                {/* Metadata */}
                <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:'0 0 4px' }}>{selected.full_name || '—'}</p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:'0 0 16px' }}>{selected.email}</p>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px', marginBottom:'16px' }}>
                  {[
                    ['Role', selected.role],
                    ['Suburb', selected.suburb || '—'],
                    ['Phone', selected.phone || '—'],
                    ['Subscription', selected.subscription_plan || 'free'],
                    ['Joined', new Date(selected.created_at).toLocaleDateString('en-AU')],
                    ['Last updated', new Date(selected.updated_at).toLocaleDateString('en-AU')],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                      <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', margin:0, flexShrink:0 }}>{k}</p>
                      <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.7)', margin:0, textAlign:'right' as const }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Jobs */}
                {jobs.filter(j => j.client_id === selected.id).length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 8px' }}>Jobs</p>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px' }}>
                      {jobs.filter(j => j.client_id === selected.id).map(j => (
                        <div key={j.id} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'8px', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.8)', margin:0 }}>{j.title}</p>
                            <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:0 }}>{j.trade_category} · {j.suburb}</p>
                          </div>
                          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'100px', background:'rgba(255,255,255,0.06)', color:'rgba(216,228,225,0.5)' }}>{j.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscription override */}
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Subscription plan</label>
                  <select defaultValue={selected.subscription_plan || 'free'}
                    onChange={e => save({ subscription_plan: e.target.value }, 'profiles', selected.id)}
                    style={{ ...inp, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)' }}>
                    {['free','home','home_annual'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Admin notes */}
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Admin notes</label>
                  <textarea defaultValue={selected.admin_notes || ''} id="client_admin_notes" rows={3}
                    style={{ ...inp, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)', resize:'vertical' as const }} />
                  <button type="button" onClick={() => {
                    const val = (document.getElementById('client_admin_notes') as HTMLTextAreaElement)?.value
                    save({ admin_notes: val }, 'profiles', selected.id)
                  }} style={{ ...btn('#2E6A8F'), marginTop:'6px' }}>Save notes</button>
                </div>

                {/* Suspend */}
                <button type="button" onClick={() => save({ suspended_at: selected.suspended_at ? null : new Date().toISOString() }, 'profiles', selected.id)}
                  style={btn(selected.suspended_at ? '#2E7D60' : '#D4522A')}>
                  {selected.suspended_at ? 'Reinstate account' : 'Suspend account'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── JOBS ── */}
        {tab === 'jobs' && (
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap:'20px', alignItems:'start' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:0 }}>ALL JOBS</p>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Job','Tradie','Client','Stage','Last update','Actions'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', fontSize:'11px', color:'rgba(216,228,225,0.35)', textAlign:'left' as const, fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(j => {
                    const days = Math.floor((Date.now() - new Date(j.updated_at).getTime()) / 86400000)
                    const stuck = days > 14 && !['complete','cancelled'].includes(j.status)
                    return (
                      <tr key={j.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: selected?.id === j.id ? 'rgba(255,255,255,0.04)' : stuck ? 'rgba(212,82,42,0.04)' : 'transparent' }}>
                        <td style={{ padding:'10px 12px', fontSize:'13px', color:'rgba(216,228,225,0.8)' }}>{j.title}</td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{j.tradie?.business_name || '—'}</td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color:'rgba(216,228,225,0.45)' }}>{j.client?.full_name || '—'}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background:'rgba(255,255,255,0.06)', color:'rgba(216,228,225,0.6)' }}>{j.status}</span>
                        </td>
                        <td style={{ padding:'10px 12px', fontSize:'12px', color: stuck ? '#D4522A' : 'rgba(216,228,225,0.35)' }}>{days}d ago</td>
                        <td style={{ padding:'10px 12px' }}>
                          <button type="button" onClick={() => setSelected(selected?.id === j.id ? null : j)} style={btn('#2E6A8F')}>
                            {selected?.id === j.id ? 'Close' : 'View'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Job detail panel */}
            {selected && tab === 'jobs' && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px', position:'sticky', top:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'0.5px', margin:0 }}>JOB DETAIL</p>
                  <button type="button" onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'rgba(216,228,225,0.4)', cursor:'pointer', fontSize:'18px' }}>×</button>
                </div>
                <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(216,228,225,0.9)', margin:'0 0 4px' }}>{selected.title}</p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:'0 0 16px' }}>{selected.trade_category} · {selected.suburb}</p>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'16px' }}>
                  {[
                    ['Status', selected.status],
                    ['Tradie', selected.tradie?.business_name || '—'],
                    ['Client', selected.client?.full_name || '—'],
                    ['Client email', selected.client?.email || '—'],
                    ['Created', new Date(selected.created_at).toLocaleDateString('en-AU')],
                    ['Last update', new Date(selected.updated_at).toLocaleDateString('en-AU')],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                      <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', margin:0, flexShrink:0 }}>{k}</p>
                      <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.7)', margin:0, textAlign:'right' as const }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Override job status */}
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Override status</label>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const }}>
                    {['matching','consult','compare','agreement','delivery','signoff','warranty','complete','cancelled'].map(s => (
                      <button key={s} type="button" onClick={() => save({ status: s }, 'jobs', selected.id)}
                        style={{ ...btn(selected.status === s ? '#D4522A' : 'rgba(255,255,255,0.08)'), color:'rgba(216,228,225,0.7)', fontSize:'10px' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add admin message to job thread */}
                <div>
                  <label style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', display:'block', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Add note to job thread</label>
                  <textarea id="job_note" rows={3} placeholder="Visible to both parties in the job message thread..."
                    style={{ ...inp, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(216,228,225,0.8)', resize:'vertical' as const, marginBottom:'6px' }} />
                  <button type="button" onClick={async () => {
                    const note = (document.getElementById('job_note') as HTMLTextAreaElement)?.value
                    if (!note?.trim()) return
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    await supabase.from('job_messages').insert({ job_id: selected.id, sender_id: session?.user.id, body: '📌 Steadyhand admin: ' + note })
                    setMsg('Note added to job thread')
                    setTimeout(() => setMsg(null), 2000)
                    ;(document.getElementById('job_note') as HTMLTextAreaElement).value = ''
                  }} style={btn('#2E6A8F')}>Post to thread</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ONBOARDING ── */}
        {tab === 'onboarding' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
            {['profile','invite_client','first_job','active'].map(step => {
              const inStep = tradies.filter(t => (t.onboarding_step || 'profile') === step)
              const colors: Record<string,string> = { profile:'#C07830', invite_client:'#2E6A8F', first_job:'#9B6B9B', active:'#2E7D60' }
              return (
                <div key={step} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ fontSize:'12px', color:colors[step], fontWeight:500, margin:0, textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{step.replace('_',' ')}</p>
                    <span style={{ fontSize:'18px', fontWeight:700, color:colors[step] }}>{inStep.length}</span>
                  </div>
                  <div style={{ padding:'8px' }}>
                    {inStep.length === 0 && <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.25)', padding:'8px', margin:0 }}>None at this step</p>}
                    {inStep.map(t => (
                      <div key={t.id} style={{ padding:'8px 10px', borderRadius:'8px', marginBottom:'4px', background:'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.8)', margin:'0 0 2px' }}>{t.business_name || t.profile?.email}</p>
                        <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.3)', margin:'0 0 6px' }}>Joined {new Date(t.profile?.created_at).toLocaleDateString('en-AU')}</p>
                        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' as const }}>
                          {['welcome','profile_complete','first_job','checkin'].map(type => (
                            <button key={type} type="button" onClick={() => sendOnboardingEmail(t.id, type)}
                              style={{ ...btn('rgba(255,255,255,0.06)'), color:'rgba(216,228,225,0.5)', fontSize:'10px', padding:'3px 8px' }}>
                              {type}
                            </button>
                          ))}
                          <button type="button" onClick={() => { setTab('tradies'); setSelected(t) }}
                            style={{ ...btn('#2E6A8F'), fontSize:'10px', padding:'3px 8px' }}>Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
