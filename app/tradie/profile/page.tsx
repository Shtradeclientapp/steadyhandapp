'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ALL_CATEGORIES = ['Electrical', 'Plumbing & Gas', 'Carpentry & Joinery', 'Painting', 'Tiling', 'Landscaping', 'Building', 'HVAC', 'Air Conditioning', 'Roofing', 'Concreting', 'Fencing', 'Plastering', 'Waterproofing', 'Solar', 'Security', 'Pest Control', 'Cleaning', 'Other']
const ALL_AREAS = ['Perth CBD', 'Fremantle', 'Subiaco', 'Nedlands', 'Cottesloe', 'Joondalup', 'Rockingham', 'Mandurah', 'Bunbury', 'Busselton', 'Margaret River', 'Augusta', 'Dunsborough', 'Harvey', 'Collie']
const AVAILABILITY = [
  { value: 'available', label: 'Available now', color: '#2E7D60' },
  { value: 'enquiries', label: 'Taking enquiries', color: '#C07830' },
  { value: 'booked', label: 'Fully booked', color: '#D4522A' },
]
const CONTACT_PREFS = ['Email', 'Phone call', 'SMS']

export default function TradieProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [tradie, setTradie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [required, setRequired] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('required') === 'true') setRequired(true)
  }, [])
  const [saveError, setSaveError] = useState<string|null>(null)
  const [form, setForm] = useState<any>({})
  const [activeTab, setActiveTab] = useState<'profile'|'business'|'availability'>('profile')
  const [logoUrl, setLogoUrl] = useState<string|null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      const { data: trad } = await supabase.from('tradie_profiles').select('*').eq('id', session.user.id).single()
      if (prof) setProfile(prof)
      if (trad) { setTradie(trad); setForm({ ...prof, ...trad }); setLogoUrl(trad.logo_url || null) }
      setLoading(false)
    })
  }, [])

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const toggleCategory = (cat: string) => {
    const current = form.trade_categories || []
    if (current.includes(cat)) {
      setF('trade_categories', current.filter((c: string) => c !== cat))
    } else {
      setF('trade_categories', [...current, cat])
    }
  }

  const toggleArea = (area: string) => {
    const current = form.service_areas || []
    if (current.includes(area)) {
      setF('service_areas', current.filter((a: string) => a !== area))
    } else {
      setF('service_areas', [...current, area])
    }
  }

  const addProduct = () => {
    const current = (form.preferred_products || []) as any[]
    setF('preferred_products', [...current, { name: '', brand: '', warranty_years: '', notes: '' }])
  }
  const updateProduct = (idx: number, key: string, val: string) => {
    const current = [...((form.preferred_products || []) as any[])]
    current[idx] = { ...current[idx], [key]: val }
    setF('preferred_products', current)
  }
  const removeProduct = (idx: number) => {
    const current = [...((form.preferred_products || []) as any[])]
    current.splice(idx, 1)
    setF('preferred_products', current)
  }

  const uploadLogo = async (file: File) => {
    if (!profile) return
    setUploadingLogo(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `logos/${profile.id}.${ext}`
    const { error } = await supabase.storage.from('Job Photos').upload(path, file, { upsert: true })
    if (error) {
      console.error('Logo upload failed:', error.message)
      setUploadingLogo(false)
      return
    }
    const { data } = supabase.storage.from('Job Photos').getPublicUrl(path)
    const url = data.publicUrl
    setLogoUrl(url)
    await supabase.from('tradie_profiles').update({ logo_url: url }).eq('id', profile.id)
    setUploadingLogo(false)
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { error: profileErr } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
    }).eq('id', profile.id)
    if (profileErr) { setSaveError('Save failed — please check your connection and try again.'); setSaving(false); return }
    const { error: tradieErr } = await supabase.from('tradie_profiles').update({
      business_name: form.business_name,
      bio: form.bio,
      trade_categories: form.trade_categories,
      service_areas: form.service_areas,
      abn: form.abn,
      licence_number: form.licence_number,
      licence_type: form.licence_type,
      years_experience: form.years_experience ? Number(form.years_experience) : null,
      website: form.website,
      phone: form.phone,
      preferred_contact: form.preferred_contact,
      availability_status: form.availability_status,
      preferred_products: form.preferred_products,
    }).eq('id', profile.id)
    if (tradieErr) { setSaveError('Save failed — please check your connection and try again.'); setSaving(false); return }
    setSaving(false)
    setSaved(true)
    setSaveError(null)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '8px', fontSize: '14px', background: '#F4F8F7', color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'sans-serif' }
  const lbl = (text: string, sub?: string) => (
    <div style={{ marginBottom: '6px' }}>
      <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A', margin: 0 }}>{text}</p>
      {sub && <p style={{ fontSize: '11px', color: '#7A9098', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64' }}>Loading...</p>
    </div>
  )

  const availability = AVAILABILITY.find(a => a.value === form.availability_status) || AVAILABILITY[0]

  const completionItems = [
    { label: 'Business name', done: !!form.business_name },
    { label: 'Bio (50+ chars)', done: !!form.bio && form.bio.length > 50 },
    { label: 'Trade categories', done: (form.trade_categories || []).length > 0 },
    { label: 'Service areas', done: (form.service_areas || []).length > 0 },
    { label: 'ABN', done: !!form.abn },
    { label: 'Licence number', done: !!form.licence_number },
    { label: 'Logo', done: !!logoUrl },
  ]
  const completionPct = Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      {completionPct < 100 && (
        <div style={{ background: completionPct < 60 ? 'rgba(212,82,42,0.06)' : 'rgba(192,120,48,0.06)', borderBottom: '1px solid ' + (completionPct < 60 ? 'rgba(212,82,42,0.2)' : 'rgba(192,120,48,0.2)'), padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '80px', height: '6px', background: 'rgba(28,43,50,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: completionPct + '%', background: completionPct < 60 ? '#D4522A' : '#C07830', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '12px', color: completionPct < 60 ? '#D4522A' : '#C07830', fontWeight: 500 }}>{completionPct}% profile complete</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {completionItems.filter(i => !i.done).slice(0, 3).map(i => (
              <span key={i.label} style={{ fontSize: '11px', color: '#7A9098', background: 'rgba(28,43,50,0.06)', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '4px', padding: '2px 8px' }}>Missing: {i.label}</span>
            ))}
          </div>
        </div>
      )}
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', textDecoration: 'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Back to dashboard</a>
      </nav>

      {/* PROFILE HEADER CARD */}
      <div style={{ background: '#0A0A0A', padding: '32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(212,82,42,0.15), transparent 60%)' }} />
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {required && (
          <div style={{ background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.25)', borderRadius:'8px', padding:'14px 16px', marginBottom:'20px', marginTop:'16px' }}>
            <p style={{ fontSize:'14px', fontWeight:600, color:'#D4522A', margin:'0 0 4px' }}>Profile setup required</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>Your tradie profile needs to be completed before you can access your dashboard. Please fill in your business name, trade category and licence number below.</p>
          </div>
        )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' as const }}>
            <label style={{ width: '72px', height: '72px', borderRadius: '14px', background: 'rgba(216,228,225,0.1)', border: '1.5px solid rgba(216,228,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative' as const }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]) }} />
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: 'rgba(216,228,225,0.7)' }}>{form.business_name?.charAt(0) || '?'}</span>
              )}
              {uploadingLogo && (
                <div style={{ position: 'absolute' as const, inset: 0, background: 'rgba(28,43,50,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'white' }}>...</span>
                </div>
              )}
              <div style={{ position: 'absolute' as const, bottom: 0, left: 0, right: 0, background: 'rgba(28,43,50,0.5)', padding: '3px 0', textAlign: 'center' as const }}>
                <span style={{ fontSize: '9px', color: 'white', letterSpacing: '0.5px' }}>LOGO</span>
              </div>
            </label>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
                <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: 'rgba(216,228,225,0.9)', letterSpacing: '1px', margin: 0 }}>{form.business_name || 'Your Business'}</h1>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: availability.color + '22', border: '1px solid ' + availability.color + '44', color: availability.color, fontWeight: 500 }}>
                  {availability.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '10px' }}>
                {(form.trade_categories || []).map((cat: string) => (
                  <span key={cat} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: 'rgba(216,228,225,0.08)', border: '1px solid rgba(216,228,225,0.15)', color: 'rgba(216,228,225,0.6)' }}>{cat}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
                {tradie?.licence_verified ? (
                  <span style={{ fontSize: '12px', color: '#2E7D60', display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Licence verified</span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#9AA5AA', display: 'flex', alignItems: 'center', gap: '4px' }}>⏳ Licence verification pending</span>
                )}
                {tradie?.insurance_verified ? (
                  <span style={{ fontSize: '12px', color: '#2E7D60', display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Insurance verified</span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#9AA5AA', display: 'flex', alignItems: 'center', gap: '4px' }}>⏳ Insurance verification pending</span>
                )}
                {tradie?.rating_avg > 0 && (
                  <span style={{ fontSize: '12px', color: 'rgba(216,228,225,0.6)' }}>⭐ {Number(tradie.rating_avg).toFixed(1)} · {tradie.jobs_completed} jobs</span>
                )}
                {tradie?.dialogue_score_avg > 0 && (
                  <span style={{ fontSize: '12px', color: 'rgba(107,79,168,0.8)' }}>Dialogue Rating: {Number(tradie.dialogue_score_avg).toFixed(0)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 24px' }}>

        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(28,43,50,0.1)', marginBottom: '24px' }}>
          {([
            { id: 'profile', label: 'Public profile' },
            { id: 'business', label: 'Business details' },
            { id: 'availability', label: 'Availability' },
          ] as const).map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === t.id ? '2px solid #D4522A' : '2px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#0A0A0A' : '#7A9098' }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>YOUR BIO</p>
              </div>
              <div style={{ padding: '20px' }}>
                {lbl('About your business', 'Shown to clients on the shortlist — 2-3 sentences about your experience and approach')}
                <textarea value={form.bio || ''} onChange={e => setF('bio', e.target.value)}
                  rows={4} placeholder="e.g. Licensed electrician with 12 years experience across residential and commercial projects in Perth Metro. We specialise in switchboard upgrades, solar installations and new builds."
                  style={{ ...inp, resize: 'vertical' as const, lineHeight: '1.6' }} />
              </div>
            </div>

            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>TRADE CATEGORIES</p>
              </div>
              <div style={{ padding: '20px' }}>
                {lbl('What trades do you offer?', 'Select all that apply — used to match you with relevant jobs')}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginTop: '8px' }}>
                  {ALL_CATEGORIES.map(cat => {
                    const selected = (form.trade_categories || []).includes(cat)
                    return (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                        style={{ padding: '7px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, border: '1.5px solid ' + (selected ? '#D4522A' : 'rgba(28,43,50,0.15)'), background: selected ? 'rgba(212,82,42,0.08)' : '#F4F8F7', color: selected ? '#D4522A' : '#4A5E64', cursor: 'pointer' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>SERVICE AREAS</p>
              </div>
              <div style={{ padding: '20px' }}>
                {lbl('Where do you work?', 'Select all areas you service')}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginTop: '8px' }}>
                  {ALL_AREAS.map(area => {
                    const selected = (form.service_areas || []).includes(area)
                    return (
                      <button key={area} type="button" onClick={() => toggleArea(area)}
                        style={{ padding: '7px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, border: '1.5px solid ' + (selected ? '#2E6A8F' : 'rgba(28,43,50,0.15)'), background: selected ? 'rgba(46,106,143,0.08)' : '#F4F8F7', color: selected ? '#2E6A8F' : '#4A5E64', cursor: 'pointer' }}>
                        {area}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>BUSINESS DETAILS</p>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  {lbl('Business name')}
                  <input type="text" value={form.business_name || ''} onChange={e => setF('business_name', e.target.value)} style={inp} placeholder="Your business name" />
                </div>
                <div>
                  {lbl('ABN')}
                  <input type="text" value={form.abn || ''} onChange={e => setF('abn', e.target.value)} style={inp} placeholder="12 345 678 901" />
                </div>
                <div>
                  {lbl('Years in business')}
                  <input type="number" value={form.years_experience || ''} onChange={e => setF('years_experience', e.target.value)} style={inp} placeholder="e.g. 8" min="0" max="50" />
                </div>
                <div>
                  {lbl('Licence number')}
                  <input type="text" value={form.licence_number || ''} onChange={e => setF('licence_number', e.target.value)} style={inp} placeholder="e.g. EC-12345" />
                </div>
                <div>
                  {lbl('Licence type')}
                  <input type="text" value={form.licence_type || ''} onChange={e => setF('licence_type', e.target.value)} style={inp} placeholder="e.g. Electrical contractor" />
                </div>
                <div>
                  {lbl('Phone')}
                  <input type="tel" value={form.phone || ''} onChange={e => setF('phone', e.target.value)} style={inp} placeholder="0400 000 000" />
                </div>
                <div>
                  {lbl('Website')}
                  <input type="url" value={form.website || ''} onChange={e => setF('website', e.target.value)} style={inp} placeholder="https://yourbusiness.com.au" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  {lbl('Preferred contact method')}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {CONTACT_PREFS.map(c => (
                      <button key={c} type="button" onClick={() => setF('preferred_contact', c.toLowerCase())}
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1.5px solid ' + (form.preferred_contact === c.toLowerCase() ? '#2E7D60' : 'rgba(28,43,50,0.15)'), background: form.preferred_contact === c.toLowerCase() ? 'rgba(46,125,96,0.08)' : '#F4F8F7', color: form.preferred_contact === c.toLowerCase() ? '#2E7D60' : '#0A0A0A', cursor: 'pointer' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>VERIFICATION STATUS</p>
              </div>
              <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                {[
                  { label: 'Licence', verified: tradie?.licence_verified },
                  { label: 'Insurance', verified: tradie?.insurance_verified },
                  { label: 'Subscription', verified: tradie?.subscription_active },
                ].map(item => (
                  <div key={item.label} style={{ flex: 1, minWidth: '120px', padding: '14px', background: item.verified ? 'rgba(46,125,96,0.06)' : 'rgba(212,82,42,0.06)', border: '1px solid ' + (item.verified ? 'rgba(46,125,96,0.2)' : 'rgba(212,82,42,0.2)'), borderRadius: '10px', textAlign: 'center' as const }}>
                    <p style={{ fontSize: '20px', margin: '0 0 4px' }}>{item.verified ? '✓' : '✗'}</p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: item.verified ? '#2E7D60' : '#D4522A', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '11px', color: '#7A9098', margin: '2px 0 0' }}>{item.verified ? 'Verified' : 'Pending'}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 20px 16px' }}>
                <p style={{ fontSize: '12px', color: '#7A9098' }}>Verification is managed by the Steadyhand team. Contact us at support@steadyhanddigital.com to update your credentials.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
            <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(28,43,50,0.08)', background: '#0A0A0A' }}>
                <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.85)', letterSpacing: '0.5px', margin: 0 }}>AVAILABILITY STATUS</p>
              </div>
              <div style={{ padding: '20px' }}>
                {lbl('Current availability', 'Shown to clients on your shortlist card')}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginTop: '8px' }}>
                  {AVAILABILITY.map(a => (
                    <button key={a.value} type="button" onClick={() => setF('availability_status', a.value)}
                      style={{ padding: '14px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, border: '1.5px solid ' + (form.availability_status === a.value ? a.color : 'rgba(28,43,50,0.15)'), background: form.availability_status === a.value ? a.color + '11' : '#F4F8F7', color: form.availability_status === a.value ? a.color : '#4A5E64', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: form.availability_status === a.value ? a.color : 'rgba(28,43,50,0.2)', flexShrink: 0 }} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(46,125,96,0.06)', border: '1px solid rgba(46,125,96,0.2)', borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#2E7D60', marginBottom: '6px' }}>Your Steadyhand stats</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                {[
                  { label: 'Jobs completed', value: tradie?.jobs_completed || 0 },
                  { label: 'Rating', value: tradie?.rating_avg ? Number(tradie.rating_avg).toFixed(1) + ' ⭐' : '—' },
                  { label: 'Dialogue Rating', value: tradie?.dialogue_score_avg ? Number(tradie.dialogue_score_avg).toFixed(0) : '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: '8px', padding: '12px', textAlign: 'center' as const }}>
                    <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#0A0A0A', margin: '0 0 4px' }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferred Products & Materials */}
        <div style={{ marginTop:'28px', background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 3px' }}>Preferred Products & Materials</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Products you regularly use — these can be referenced in scope agreements and warranty certificates.</p>
            </div>
            <button type="button" onClick={addProduct}
              style={{ background:'#2E7D60', color:'white', border:'none', borderRadius:'7px', padding:'7px 14px', fontSize:'12px', fontWeight:500, cursor:'pointer', flexShrink:0, marginLeft:'12px' }}>
              + Add product
            </button>
          </div>
          {((form.preferred_products || []) as any[]).length === 0 && (
            <p style={{ fontSize:'12px', color:'#9AA5AA', fontStyle:'italic', margin:0 }}>No products added yet. Add the brands and materials you most commonly install.</p>
          )}
          {((form.preferred_products || []) as any[]).map((p: any, idx: number) => (
            <div key={idx} style={{ background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px', marginBottom:'10px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Product / material name</p>
                  <input value={p.name || ''} onChange={e => updateProduct(idx, 'name', e.target.value)}
                    placeholder="e.g. Hot water system, Roof tiles"
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Brand / manufacturer</p>
                  <input value={p.brand || ''} onChange={e => updateProduct(idx, 'brand', e.target.value)}
                    placeholder="e.g. Rheem, Colorbond, James Hardie"
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'10px' }}>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Manufacturer warranty</p>
                  <select value={p.warranty_years || ''} onChange={e => updateProduct(idx, 'warranty_years', e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none' }}>
                    <option value="">Not specified</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="5">5 years</option>
                    <option value="7">7 years</option>
                    <option value="10">10 years</option>
                    <option value="12">12 years</option>
                    <option value="15">15 years</option>
                    <option value="20">20 years</option>
                    <option value="25">25 years</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 4px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Notes (optional)</p>
                  <input value={p.notes || ''} onChange={e => updateProduct(idx, 'notes', e.target.value)}
                    placeholder="e.g. Requires annual service to maintain warranty"
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                </div>
              </div>
              <button type="button" onClick={() => removeProduct(idx)}
                style={{ marginTop:'10px', fontSize:'11px', color:'#9AA5AA', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '28px' }}>
          {saveError && (
            <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'8px' }}>⚠ {saveError}</p>
          )}
          <button type="button" onClick={save} disabled={saving}
            style={{ width: '100%', background: '#0A0A0A', color: 'white', padding: '15px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : saved ? '✓ Profile saved' : 'Save profile →'}
          </button>
          {saved && (
            <p style={{ textAlign: 'center' as const, fontSize: '13px', color: '#2E7D60', marginTop: '12px' }}>✓ Your profile has been updated</p>
          )}
        </div>

      </div>
    </div>
  )
}
