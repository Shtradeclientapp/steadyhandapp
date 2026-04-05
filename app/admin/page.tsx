'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'anthony.coxeter@gmail.com'

export default function AdminPage() {
  const [tab, setTab] = useState<'tradies'|'clients'|'jobs'>('tradies')
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

      const { data: tradieData } = await supabase
        .from('tradie_profiles')
        .select('*, profile:profiles(id, full_name, email, suburb, created_at)')
        .order('created_at', { ascending: false })
      setTradies(tradieData || [])

      const { data: clientData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })
      setClients(clientData || [])

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(full_name, email), tradie:tradie_profiles(business_name)')
        .order('created_at', { ascending: false })
        .limit(50)
      setJobs(jobData || [])
      setLoading(false)
    })
  }, [])

  const loadProfileDetail = async (profileId: string, type: 'tradie'|'client') => {
    const supabase = createClient()
    const { data: jobData } = await supabase
      .from('jobs')
      .select('id, title, status, trade_category, suburb, created_at')
      .or(type === 'tradie' ? 'tradie_id.eq.' + profileId : 'client_id.eq.' + profileId)
      .order('created_at', { ascending: false })
    setProfileJobs(jobData || [])

    const { data: noteData } = await supabase
      .from('admin_notes')
      .select('*, admin:profiles(full_name)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
    setNotes(noteData || [])
  }

  const selectProfile = async (profile: any, type: 'tradie'|'client') => {
    setSelectedProfile({ ...profile, type })
    await loadProfileDetail(profile.id || profile.profile?.id, type)
  }

  const saveNote = async () => {
    if (!newNote.trim() || !selectedProfile) return
    setSavingNote(true)
    const supabase = createClient()
    const profileId = selectedProfile.profile?.id || selectedProfile.id
    await supabase.from('admin_notes').insert({
      profile_id: profileId,
      admin_id: adminId,
      note: newNote.trim(),
    })
    const { data: noteData } = await supabase
      .from('admin_notes')
      .select('*, admin:profiles(full_name)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
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
              <div key={s.label} style={{