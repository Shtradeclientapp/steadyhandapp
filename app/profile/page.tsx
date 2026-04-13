'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PROPERTY_TYPES = ['Residential house', 'Unit / Apartment', 'Townhouse', 'Rural property', 'Commercial', 'Other']
const OWNERSHIP = ['Owner-occupier', 'Landlord / Investor', 'Tenant', 'Other']
const CONTACT_PREFS = ['Email', 'Phone call', 'SMS']

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [required, setRequired] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('required') === 'true') setRequired(true)
  }, [])
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (prof) { setProfile(prof); setForm(prof) }
      setLoading(false)
    })
  }, [])

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      suburb: form.suburb,
      address: form.address,
      property_type: form.property_type,
      year_built: form.year_built ? Number(form.year_built) : null,
      ownership_status: form.ownership_status,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      tradie_notes: form.tradie_notes,
      preferred_contact: form.preferred_contact,
    }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '14px', background: '#F4F8F7', color: '#1C2B32', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'sans-serif' }
  const sel = { ...inp, cursor: 'pointer' }
  const lbl = (text: string, sub?: string) => (
    <div style={{ marginBottom: '6px' }}>
      <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C2B32', margin: 0 }}>{text}</p>
      {sub && <p style={{ fontSize: '11px', color: '#7A9098', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', textDecoration: 'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Back to dashboard</a>
      </nav>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46,125,96,0.08)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#2E7D60', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Your profile</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#1C2B32', letterSpacing: '1.5px', marginBottom: '6px' }}>HOME PROFILE</h1>
        {required && (
          <div style={{ background:'rgba(212,82,42,0.06)', border:'2px solid rgba(212,82,42,0.25)', borderRadius:'10px', padding:'14px 18px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'20px' }}>📋</span>
            <p style={{ fontSize:'13px', color:'#D4522A', fontWeight:500, margin:0 }}>Please complete your profile before posting a job request — your address and contact details are needed for tradies to quote accurately.</p>
          </div>
        )}
        <p style={{ fontSize: '15px', color: '#4A5E64', fontWeight: 300, marginBottom: '32px', lineHeight: '1.6' }}>Your profile helps Steadyhand match you with the right tradies and pre-fills job details automatically. Your address is kept private and only shared with a tradie after the scope is signed.</p>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#1C2B32' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>PERSONAL DETAILS</p>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Full name')}
              <input type="text" value={form.full_name || ''} onChange={e => setF('full_name', e.target.value)} style={inp} placeholder="Your full name" />
            </div>
            <div>
              {lbl('Email')}
              <input type="email" value={form.email || ''} disabled style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div>
              {lbl('Phone')}
              <input type="tel" value={form.phone || ''} onChange={e => setF('phone', e.target.value)} style={inp} placeholder="0400 000 000" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Preferred contact method')}
              <div style={{ display: 'flex', gap: '8px' }}>
                {CONTACT_PREFS.map(c => (
                  <button key={c} type="button" onClick={() => setF('preferred_contact', c.toLowerCase())}
                    style={{ flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1.5px solid ' + (form.preferred_contact === c.toLowerCase() ? '#2E7D60' : 'rgba(28,43,50,0.15)'), background: form.preferred_contact === c.toLowerCase() ? 'rgba(46,125,96,0.08)' : '#F4F8F7', color: form.preferred_contact === c.toLowerCase() ? '#2E7D60' : '#1C2B32', cursor: 'pointer' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#1C2B32' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>PROPERTY DETAILS</p>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Street address', 'Kept private — only shared with your tradie after the scope is signed')}
              <input type="text" value={form.address || ''} onChange={e => setF('address', e.target.value)} style={inp} placeholder="123 Example Street" />
            </div>
            <div>
              {lbl('Suburb')}
              <input type="text" value={form.suburb || ''} onChange={e => setF('suburb', e.target.value)} style={inp} placeholder="Perth CBD" />
            </div>
            <div>
              {lbl('State')}
              <input type="text" value={form.state || 'WA'} onChange={e => setF('state', e.target.value)} style={inp} placeholder="WA" />
            </div>
            <div>
              {lbl('Property type')}
              <select value={form.property_type || ''} onChange={e => setF('property_type', e.target.value)} style={sel}>
                <option value="">Select type</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              {lbl('Ownership status')}
              <select value={form.ownership_status || ''} onChange={e => setF('ownership_status', e.target.value)} style={sel}>
                <option value="">Select status</option>
                {OWNERSHIP.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              {lbl('Year built', 'Approximate is fine')}
              <input type="number" value={form.year_built || ''} onChange={e => setF('year_built', e.target.value)} style={inp} placeholder="e.g. 1985" />
            </div>
            <div>
              {lbl('Bedrooms')}
              <input type="number" value={form.bedrooms || ''} onChange={e => setF('bedrooms', e.target.value)} style={inp} placeholder="3" min="0" max="20" />
            </div>
            <div>
              {lbl('Bathrooms')}
              <input type="number" value={form.bathrooms || ''} onChange={e => setF('bathrooms', e.target.value)} style={inp} placeholder="2" min="0" max="10" />
            </div>
          </div>
        </div>

        <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#1C2B32' }}>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>NOTES FOR TRADIES</p>
          </div>
          <div style={{ padding: '20px' }}>
            {lbl('Property access and other notes', 'Shown to tradies after the scope is signed — e.g. dog on property, access via side gate, parking restrictions')}
            <textarea value={form.tradie_notes || ''} onChange={e => setF('tradie_notes', e.target.value)}
              rows={4} placeholder="e.g. Dog on property — please close the gate. Access via the side lane. Street parking only."
              style={{ ...inp, resize: 'vertical' as const, lineHeight: '1.6' }} />
          </div>
        </div>

        <button type="button" onClick={save} disabled={saving}
          style={{ width: '100%', background: '#1C2B32', color: 'white', padding: '15px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : saved ? '✓ Profile saved' : 'Save profile →'}
        </button>

        {saved && (
          <p style={{ textAlign: 'center' as const, fontSize: '13px', color: '#2E7D60', marginTop: '12px' }}>✓ Your profile has been updated</p>
        )}
      </div>
    </div>
  )
}
