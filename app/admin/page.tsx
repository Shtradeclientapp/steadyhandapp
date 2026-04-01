'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'test@test.com'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'tradies'|'jobs'|'users'>('tradies')
  const [tradies, setTradies] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      if (session.user.email !== ADMIN_EMAIL) { alert('Not admin. Your email: ' + session.user.email + ' Expected: ' + ADMIN_EMAIL); window.location.href = '/dashboard'; return }
      setUser(session.user)

      const { data: tradieData } = await supabase
        .from('tradie_profiles')
        .select('*, profile:profiles(full_name, email, suburb, created_at)')
        .order('created_at', { ascending: false })
      setTradies(tradieData || [])

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email), tradie:tradie_profiles(business_name)')
        .order('created_at', { ascending: false })
      setJobs(jobData || [])

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers(userData || [])

      setLoading(false)
    })
  }, [])

  const verifyTradie = async (id: string, field: 'licence_verified'|'insurance_verified', value: boolean) => {
    const supabase = createClient()
    await supabase.from('tradie_profiles').update({ [field]: value }).eq('id', id)
    setTradies(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const activateTradie = async (id: string, value: boolean) => {
    const supabase = createClient()
    await supabase.from('tradie_profiles').update({ subscription_active: value }).eq('id', id)
    setTradies(ts => ts.map(t => t.id === id ? { ...t, subscription_active: value } : t))
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading admin...</p>
    </div>
  )

  const statusColor: Record<string,string> = {
    draft:'#7A9098', matching:'#2E6A8F', shortlisted:'#2E6A8F', agreement:'#6B4FA8',
    delivery:'#C07830', signoff:'#D4522A', warranty:'#1A6B5A', complete:'#2E7D60'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#1C2B32', borderBottom:'1px solid rgba(255,255,255,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</div>
          <span style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', letterSpacing:'1px', textTransform:'uppercase', background:'rgba(212,82,42,0.15)', border:'1px solid rgba(212,82,42,0.3)', padding:'3px 8px', borderRadius:'4px' }}>Admin</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)' }}>{user?.email}</span>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(216,228,225,0.7)', padding:'6px 14px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ background:'#1C2B32', padding:'24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,82,42,0.1), transparent 55%)' }} />
        <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>ADMIN DASHBOARD</h1>
          <div style={{ display:'flex', gap:'24px', flexWrap:'wrap' }}>
            {[
              { label:'Total users', value: users.length },
              { label:'Tradies', value: tradies.length },
              { label:'Active jobs', value: jobs.filter(j => j.status !== 'complete').length },
              { label:'Pending verification', value: tradies.filter(t => !t.licence_verified || !t.insurance_verified).length },
            ].map(s => (
              <div key={s.label} style={{ marginTop:'12px' }}>
                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)' }}>{s.value}</div>
                <div style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', marginTop:'2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'24px' }}>
        <div style={{ display:'flex', gap:'0', marginBottom:'24px', background:'#E8F0EE', borderRadius:'10px', padding:'4px', width:'fit-content' }}>
          {(['tradies','jobs','users'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{ padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight: tab===t ? 600 : 400, background: tab===t ? '#1C2B32' : 'transparent', color: tab===t ? 'white' : '#4A5E64', textTransform:'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'tradies' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'16px' }}>TRADIE PROFILES ({tradies.length})</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {tradies.map(t => (
                <div key={t.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'4px' }}>{t.business_name}</div>
                      <div style={{ fontSize:'13px', color:'#7A9098', marginBottom:'8px' }}>{t.profile?.full_name} · {t.profile?.email} · {t.trade_categories?.join(', ')}</div>
                      <div style={{ fontSize:'12px', color:'#4A5E64' }}>Service areas: {t.service_areas?.join(', ')}</div>
                      {t.licence_number && <div style={{ fontSize:'12px', color:'#4A5E64' }}>Licence: {t.licence_number} · ABN: {t.abn}</div>}
                      <div style={{ fontSize:'12px', color:'#4A5E64', marginTop:'4px' }}>Rating: {Number(t.rating_avg).toFixed(1)} · Jobs: {t.jobs_completed}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', flexShrink:0 }}>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        <button type="button" onClick={() => verifyTradie(t.id, 'licence_verified', !t.licence_verified)}
                          style={{ padding:'6px 12px', borderRadius:'6px', border:'1px solid ' + (t.licence_verified ? '#2E7D60' : 'rgba(28,43,50,0.2)'), background: t.licence_verified ? 'rgba(46,125,96,0.1)' : 'transparent', color: t.licence_verified ? '#2E7D60' : '#7A9098', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>
                          {t.licence_verified ? '✓ Licence' : 'Verify licence'}
                        </button>
                        <button type="button" onClick={() => verifyTradie(t.id, 'insurance_verified', !t.insurance_verified)}
                          style={{ padding:'6px 12px', borderRadius:'6px', border:'1px solid ' + (t.insurance_verified ? '#2E7D60' : 'rgba(28,43,50,0.2)'), background: t.insurance_verified ? 'rgba(46,125,96,0.1)' : 'transparent', color: t.insurance_verified ? '#2E7D60' : '#7A9098', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>
                          {t.insurance_verified ? '✓ Insurance' : 'Verify insurance'}
                        </button>
                      </div>
                      <button type="button" onClick={() => activateTradie(t.id, !t.subscription_active)}
                        style={{ padding:'7px 14px', borderRadius:'6px', border:'none', background: t.subscription_active ? '#2E7D60' : '#D4522A', color:'white', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>
                        {t.subscription_active ? '✓ Active — click to deactivate' : 'Activate profile'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'16px' }}>ALL JOBS ({jobs.length})</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {jobs.map(job => (
                <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid ' + (statusColor[job.status] || '#7A9098'), borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', marginBottom:'4px' }}>{job.title}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098' }}>
                      {job.trade_category} · {job.suburb} · Client: {job.client?.full_name}
                      {job.tradie?.business_name ? ' · Tradie: ' + job.tradie.business_name : ' · No tradie assigned'}
                    </div>
                    <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'4px' }}>Created {new Date(job.created_at).toLocaleDateString('en-AU')}</div>
                  </div>
                  <span style={{ background: (statusColor[job.status] || '#7A9098') + '18', border:'1px solid ' + (statusColor[job.status] || '#7A9098') + '40', borderRadius:'100px', padding:'4px 12px', fontSize:'11px', fontWeight:500, color: statusColor[job.status] || '#7A9098', textTransform:'capitalize', flexShrink:0 }}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'16px' }}>ALL USERS ({users.length})</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {users.map(u => (
                <div key={u.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'11px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', marginBottom:'2px' }}>{u.full_name}</div>
                    <div style={{ fontSize:'12px', color:'#7A9098' }}>{u.email} · {u.suburb}</div>
                    <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>Joined {new Date(u.created_at).toLocaleDateString('en-AU')}</div>
                  </div>
                  <span style={{ background: u.role === 'tradie' ? 'rgba(46,125,96,0.1)' : 'rgba(46,106,143,0.1)', border:'1px solid ' + (u.role === 'tradie' ? 'rgba(46,125,96,0.3)' : 'rgba(46,106,143,0.3)'), borderRadius:'100px', padding:'4px 12px', fontSize:'11px', fontWeight:500, color: u.role === 'tradie' ? '#2E7D60' : '#2E6A8F', textTransform:'capitalize', flexShrink:0 }}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
