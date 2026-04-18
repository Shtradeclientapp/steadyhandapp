"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradieAvailability() {
  const [profile, setProfile] = useState<any>(null)
  const [tradie, setTradie] = useState<any>(null)
  const [form, setForm] = useState({ status_message: '', audience: 'all', visible: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles!tradie_profiles_id_fkey(*)').eq('id', session.user.id).single()
      setProfile(prof)
      setTradie(prof?.tradie)
      if (prof?.tradie) {
        setForm({
          status_message: prof.tradie.availability_message || '',
          audience: prof.tradie.availability_audience || 'all',
          visible: prof.tradie.availability_visible !== false,
        })
      }
      // Load active jobs for selective broadcast
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, status, client:profiles!jobs_client_id_fkey(full_name)')
        .eq('tradie_id', prof?.tradie?.id)
        .not('status', 'in', '("complete","cancelled")')
      setJobs(jobData || [])
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('tradie_profiles').update({
      availability_message: form.status_message,
      availability_audience: form.audience,
      availability_visible: form.visible,
      availability_job_ids: form.audience === 'selected' ? selectedJobs : null,
      availability_updated_at: new Date().toISOString(),
    }).eq('id', tradie?.id)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = { width:'100%', padding:'9px 12px', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'7px', fontSize:'13px', background:'rgba(255,255,255,0.06)', color:'rgba(216,228,225,0.9)', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }
  const label = { fontSize:'11px', color:'rgba(216,228,225,0.5)', display:'block', marginBottom:'4px', letterSpacing:'0.5px' }

  const PRESETS = [
    'Currently 3–4 week lead time on new jobs.',
    'Available to start new jobs from next month.',
    'Fully booked until end of month — happy to quote for future work.',
    'Lead times may vary — contact us to discuss your timeline.',
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', fontFamily:'sans-serif' }}>
      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px' }}>
        <a href="/tradie/dashboard" style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', textDecoration:'none', display:'block', marginBottom:'24px' }}>← Dashboard</a>
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.35)', marginBottom:'6px' }}>Status broadcast</p>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'4px' }}>AVAILABILITY</h1>
        <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', marginBottom:'28px' }}>Set a status message that appears on your active job pages. Use this to communicate delays, lead times, or scheduling changes.</p>

        {saved && (
          <div style={{ background:'rgba(46,125,96,0.12)', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px' }}>
            <p style={{ fontSize:'13px', color:'#2E7D60', margin:0, fontWeight:500 }}>✓ Availability status saved</p>
          </div>
        )}

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'20px' }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'rgba(216,228,225,0.85)', margin:'0 0 2px' }}>Show availability status</p>
              <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:0 }}>Turn off to hide your status from all clients</p>
            </div>
            <button type="button" onClick={() => set('visible', !form.visible)}
              style={{ width:'44px', height:'24px', borderRadius:'12px', background: form.visible ? '#2E7D60' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left: form.visible ? '23px' : '3px', transition:'left 0.2s' }} />
            </button>
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={label}>Status message</label>
            <textarea value={form.status_message} onChange={e => set('status_message', e.target.value)}
              placeholder="e.g. Currently 3–4 week lead time on new jobs."
              style={{ ...inp, minHeight:'80px', resize:'vertical' as const }} />
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={label}>Quick presets</label>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {PRESETS.map((p, i) => (
                <button key={i} type="button" onClick={() => set('status_message', p)}
                  style={{ textAlign:'left', padding:'8px 12px', borderRadius:'7px', border:'1px solid rgba(255,255,255,0.08)', background: form.status_message === p ? 'rgba(46,125,96,0.15)' : 'rgba(255,255,255,0.03)', cursor:'pointer', fontSize:'12px', color:'rgba(216,228,225,0.7)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: form.audience === 'selected' ? '16px' : '0' }}>
            <label style={label}>Who sees this</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {(['all','active','selected'] as const).map(a => (
                <button key={a} type="button" onClick={() => set('audience', a)}
                  style={{ flex:1, padding:'8px', borderRadius:'7px', border:'1px solid ' + (form.audience === a ? 'rgba(46,125,96,0.5)' : 'rgba(255,255,255,0.1)'), background: form.audience === a ? 'rgba(46,125,96,0.15)' : 'transparent', cursor:'pointer', fontSize:'12px', color: form.audience === a ? '#2E7D60' : 'rgba(216,228,225,0.5)', fontWeight: form.audience === a ? 500 : 400 }}>
                  {a === 'all' ? 'All clients' : a === 'active' ? 'Active jobs only' : 'Selected jobs'}
                </button>
              ))}
            </div>
          </div>

          {form.audience === 'selected' && jobs.length > 0 && (
            <div style={{ marginTop:'12px' }}>
              <label style={label}>Select jobs</label>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {jobs.map((j: any) => (
                  <label key={j.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', borderRadius:'7px', border:'1px solid rgba(255,255,255,0.08)', background: selectedJobs.includes(j.id) ? 'rgba(46,125,96,0.1)' : 'rgba(255,255,255,0.03)', cursor:'pointer' }}>
                    <input type="checkbox" checked={selectedJobs.includes(j.id)} onChange={e => setSelectedJobs(prev => e.target.checked ? [...prev, j.id] : prev.filter(id => id !== j.id))} style={{ accentColor:'#2E7D60' }} />
                    <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.75)' }}>{j.title} <span style={{ color:'rgba(216,228,225,0.35)' }}>· {j.client?.full_name}</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="button" onClick={handleSave} disabled={saving}
          style={{ width:'100%', background: saving ? 'rgba(46,125,96,0.4)' : '#2E7D60', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Save availability status →'}
        </button>

        {tradie?.availability_message && tradie?.availability_visible && (
          <div style={{ marginTop:'20px', padding:'14px 18px', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'10px' }}>
            <p style={{ fontSize:'11px', color:'#C07830', fontWeight:500, margin:'0 0 4px' }}>Currently visible to clients</p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.75)', margin:0 }}>{tradie.availability_message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
