'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'anthony.coxeter@gmail.com'

export default function AdminPage() {
  const [tab, setTab] = useState<'tradies'|'clients'|'jobs'>('tradies')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20
  const [tradies, setTradies] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [profileJobs, setProfileJobs] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [adminId, setAdminId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      if (session.user.email !== ADMIN_EMAIL) { window.location.href = '/dashboard'; return }
      setAdminId(session.user.id)
      const { data: tradieData } = await supabase.from('tradie_profiles').select('*, profile:profiles(id, full_name, email, suburb, created_at)').order('created_at', { ascending: false })
      setTradies(tradieData || [])
      const { data: clientData } = await supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false })
      setClients(clientData || [])
      const { data: jobData } = await supabase.from('jobs').select('*, client:profiles!jobs_client_id_fkey(full_name, email), tradie:tradie_profiles(business_name)').order('created_at', { ascending: false }).limit(50)
      setJobs(jobData || [])
      setLoading(false)
    })
  }, [])

  const loadProfileDetail = async (profileId: string, type: 'tradie'|'client') => {
    const supabase = createClient()
    const col = type === 'tradie' ? 'tradie_id' : 'client_id'
    const { data: jobData } = await supabase.from('jobs').select('id, title, status, trade_category, suburb, created_at').eq(col, profileId).order('created_at', { ascending: false })
    setProfileJobs(jobData || [])
    const { data: noteData } = await supabase.from('admin_notes').select('*, admin:profiles(full_name)').eq('profile_id', profileId).order('created_at', { ascending: false })
    setNotes(noteData || [])
  }

  const selectProfile = async (profile: any, type: 'tradie'|'client') => {
    setSelectedProfile({ ...profile, type })
    await loadProfileDetail(profile.profile?.id || profile.id, type)
  }

  const saveNote = async () => {
    if (!newNote.trim() || !selectedProfile) return
    setSavingNote(true)
    const supabase = createClient()
    const profileId = selectedProfile.profile?.id || selectedProfile.id
    await supabase.from('admin_notes').insert({ profile_id: profileId, admin_id: adminId, note: newNote.trim() })
    const { data: noteData } = await supabase.from('admin_notes').select('*, admin:profiles(full_name)').eq('profile_id', profileId).order('created_at', { ascending: false })
    setNotes(noteData || [])
    setNewNote('')
    setSavingNote(false)
  }

  const verifyTradie = async (id: string, field: 'licence_verified'|'insurance_verified', value: boolean) => {
    const supabase = createClient()
    await supabase.from('tradie_profiles').update({ [field]: value }).eq('id', id)
    setTradies(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const activateTradie = async (id: string, value: boolean) => {
    const supabase = createClient()
    await supabase.from('tradie_profiles').update({ subscription_active: value }).eq('id', id)
    setTradies(prev => prev.map(t => t.id === id ? { ...t, subscription_active: value } : t))
  }

  const inp = { width: '100%', padding: '9px 11px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '7px', fontSize: '13px', background: '#F4F8F7', color: '#1C2B32', outline: 'none', boxSizing: 'border-box' as const }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64' }}>Loading admin...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px' }}>STEADYHAND</span>
        <span style={{ fontSize: '13px', color: '#D4522A', fontWeight: 500 }}>Admin</span>
      </nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: selectedProfile ? '1fr 380px' : '1fr', gap: '24px', alignItems: 'start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '24px', color: '#1C2B32', letterSpacing: '1.5px', marginBottom: '20px' }}>ADMIN DASHBOARD</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Tradies', value: tradies.length },
              { label: 'Clients', value: clients.length },
              { label: 'Jobs', value: jobs.length },
              { label: 'Pending verification', value: tradies.filter(t => !t.licence_verified || !t.insurance_verified).length },
            ].map(s => (
              <div key={s.label} style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '10px', padding: '16px' }}>
                <p style={{ fontSize: '11px', color: '#7A9098', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#1C2B32', margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(28,43,50,0.1)', marginBottom: '20px' }}>
            {(['tradies', 'clients', 'jobs'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setTab(t); setPage(0) }}
                style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t ? '2px solid #D4522A' : '2px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#1C2B32' : '#7A9098', textTransform: 'capitalize' as const }}>
                {t} ({t === 'tradies' ? tradies.length : t === 'clients' ? clients.length : jobs.length})
              </button>
            ))}
          </div>
          {tab === 'tradies' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {tradies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(t => (
                <div key={t.id} onClick={() => selectProfile(t, 'tradie')}
                  style={{ background: '#E8F0EE', border: selectedProfile?.id === t.id ? '1.5px solid #D4522A' : '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '15px', color: '#1C2B32', marginBottom: '3px' }}>{t.business_name}</p>
                      <p style={{ fontSize: '12px', color: '#7A9098', marginBottom: '8px' }}>{t.profile?.full_name} · {t.profile?.email} · {t.trade_categories?.join(', ')}</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                        {[
                          { label: t.licence_verified ? '✓ Licence' : '✗ Licence', ok: t.licence_verified },
                          { label: t.insurance_verified ? '✓ Insurance' : '✗ Insurance', ok: t.insurance_verified },
                          { label: t.subscription_active ? '✓ Active' : 'Inactive', ok: t.subscription_active },
                        ].map(badge => (
                          <span key={badge.label} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: badge.ok ? 'rgba(46,125,96,0.1)' : 'rgba(212,82,42,0.1)', color: badge.ok ? '#2E7D60' : '#D4522A', border: '1px solid ' + (badge.ok ? 'rgba(46,125,96,0.3)' : 'rgba(212,82,42,0.3)') }}>{badge.label}</span>
                        ))}
                        {t.dialogue_score_avg > 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(107,79,168,0.1)', color: '#6B4FA8', border: '1px solid rgba(107,79,168,0.3)' }}>Rating: {Number(t.dialogue_score_avg).toFixed(0)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, flexShrink: 0 }}>
                      <button type="button" onClick={e => { e.stopPropagation(); verifyTradie(t.id, 'licence_verified', !t.licence_verified) }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(28,43,50,0.2)', background: '#C8D5D2', cursor: 'pointer', color: '#1C2B32' }}>{t.licence_verified ? 'Unverify licence' : 'Verify licence'}</button>
                      <button type="button" onClick={e => { e.stopPropagation(); verifyTradie(t.id, 'insurance_verified', !t.insurance_verified) }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(28,43,50,0.2)', background: '#C8D5D2', cursor: 'pointer', color: '#1C2B32' }}>{t.insurance_verified ? 'Unverify insurance' : 'Verify insurance'}</button>
                      <button type="button" onClick={e => { e.stopPropagation(); activateTradie(t.id, !t.subscription_active) }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: 'none', background: t.subscription_active ? '#D4522A' : '#2E7D60', cursor: 'pointer', color: 'white' }}>{t.subscription_active ? 'Deactivate' : 'Activate'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {tradies.length > PAGE_SIZE && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'16px', padding:'10px 0' }}>
                <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ fontSize:'13px', color:'#1C2B32', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'7px 14px', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ fontSize:'12px', color:'#7A9098' }}>{page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, tradies.length)} of {tradies.length}</span>
                <button type="button" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= tradies.length}
                  style={{ fontSize:'13px', color:'#1C2B32', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'6px', padding:'7px 14px', cursor: (page + 1) * PAGE_SIZE >= tradies.length ? 'not-allowed' : 'pointer', opacity: (page + 1) * PAGE_SIZE >= tradies.length ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          )}
          {tab === 'clients' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {clients.map(c => (
                <div key={c.id} onClick={() => selectProfile(c, 'client')}
                  style={{ background: '#E8F0EE', border: selectedProfile?.id === c.id ? '1.5px solid #D4522A' : '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C2B32', marginBottom: '3px' }}>{c.full_name}</p>
                      <p style={{ fontSize: '12px', color: '#7A9098' }}>{c.email} · {c.suburb || 'No suburb'}</p>
                    </div>
                    <p style={{ fontSize: '11px', color: '#9AA5AA' }}>Joined {new Date(c.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'jobs' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
              {jobs.map(j => (
                <div key={j.id} style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32', marginBottom: '3px' }}>{j.title}</p>
                    <p style={{ fontSize: '12px', color: '#7A9098' }}>{j.trade_category} · {j.suburb} · {j.client?.full_name}{j.tradie?.business_name ? ' → ' + j.tradie.business_name : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: 'rgba(28,43,50,0.08)', color: '#4A5E64', textTransform: 'capitalize' as const }}>{j.status}</span>
                    <span style={{ fontSize: '11px', color: '#9AA5AA' }}>{new Date(j.created_at).toLocaleDateString('en-AU')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedProfile && (
          <div style={{ position: 'sticky' as const, top: '80px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#1C2B32', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(216,228,225,0.4)', letterSpacing: '0.5px', margin: '0 0 2px', textTransform: 'uppercase' as const }}>{selectedProfile.type}</p>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(216,228,225,0.9)', margin: 0 }}>{selectedProfile.business_name || selectedProfile.full_name}</p>
                </div>
                <button type="button" onClick={() => setSelectedProfile(null)} style={{ background: 'none', border: 'none', color: 'rgba(216,228,225,0.4)', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {selectedProfile.type === 'tradie' ? (
                  [
                    { label: 'Full name', value: selectedProfile.profile?.full_name },
                    { label: 'Email', value: selectedProfile.profile?.email },
                    { label: 'ABN', value: selectedProfile.abn || '—' },
                    { label: 'Licence', value: selectedProfile.licence_number || '—' },
                    { label: 'Categories', value: selectedProfile.trade_categories?.join(', ') || '—' },
                    { label: 'Service areas', value: selectedProfile.service_areas?.join(', ') || '—' },
                    { label: 'Rating', value: selectedProfile.rating_avg ? Number(selectedProfile.rating_avg).toFixed(1) + ' ⭐' : '—' },
                    { label: 'Jobs completed', value: String(selectedProfile.jobs_completed || 0) },
                    { label: 'Dialogue Rating', value: selectedProfile.dialogue_score_avg ? Number(selectedProfile.dialogue_score_avg).toFixed(0) : '—' },
                    { label: 'Trust score', value: selectedProfile.trust_score_composite ? Number(selectedProfile.trust_score_composite).toFixed(0) : '—' },
                    { label: 'Stripe Connect', value: selectedProfile.stripe_account_id ? '✓ Connected' : 'Not connected' },
                    { label: 'Joined', value: selectedProfile.profile?.created_at ? new Date(selectedProfile.profile.created_at).toLocaleDateString('en-AU') : '—' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(28,43,50,0.06)', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#7A9098', flexShrink: 0 }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32', textAlign: 'right' as const }}>{String(item.value)}</span>
                    </div>
                  ))
                ) : (
                  [
                    { label: 'Full name', value: selectedProfile.full_name || '—' },
                    { label: 'Email', value: selectedProfile.email },
                    { label: 'Suburb', value: selectedProfile.suburb || '—' },
                    { label: 'Phone', value: selectedProfile.phone || '—' },
                    { label: 'Org', value: selectedProfile.org_id ? 'Organisation member' : 'Individual' },
                    { label: 'Subscription', value: selectedProfile.subscription_plan || 'free' },
                    { label: 'Joined', value: new Date(selectedProfile.created_at).toLocaleDateString('en-AU') },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(28,43,50,0.06)', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#7A9098', flexShrink: 0 }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32' }}>{String(item.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {profileJobs.length > 0 && (
              <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(28,43,50,0.08)' }}>
                  <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '12px', color: '#1C2B32', letterSpacing: '0.5px', margin: 0 }}>JOB HISTORY ({profileJobs.length})</p>
                </div>
                <div style={{ padding: '10px 16px', maxHeight: '200px', overflowY: 'auto' as const }}>
                  {profileJobs.map(j => (
                    <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(28,43,50,0.06)', gap: '8px' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#1C2B32', margin: 0 }}>{j.title}</p>
                        <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>{j.trade_category} · {j.suburb}</p>
                      </div>
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(28,43,50,0.08)', color: '#4A5E64', flexShrink: 0, textTransform: 'capitalize' as const }}>{j.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '12px', color: '#1C2B32', letterSpacing: '0.5px', margin: 0 }}>ADMIN NOTES</p>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' as const }}>
                  {notes.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#9AA5AA', fontStyle: 'italic' }}>No notes yet.</p>
                  ) : notes.map(n => (
                    <div key={n.id} style={{ padding: '8px 10px', background: '#C8D5D2', borderRadius: '8px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#1C2B32', margin: '0 0 4px', lineHeight: '1.5' }}>{n.note}</p>
                      <p style={{ fontSize: '10px', color: '#7A9098', margin: 0 }}>{n.admin?.full_name} · {new Date(n.created_at).toLocaleDateString('en-AU')} {new Date(n.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." rows={2}
                    style={{ ...inp, resize: 'none' as const, flex: 1, fontSize: '12px' }} />
                  <button type="button" onClick={saveNote} disabled={savingNote || !newNote.trim()}
                    style={{ background: '#1C2B32', color: 'white', padding: '8px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, opacity: savingNote || !newNote.trim() ? 0.5 : 1, alignSelf: 'flex-end' as const, flexShrink: 0 }}>
                    {savingNote ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
