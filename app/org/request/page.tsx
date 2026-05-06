'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TRADES = ['Electrical','Plumbing','Carpentry','Painting','Roofing','Tiling','Concreting','Landscaping','Airconditioning','Pest control','Cleaning','Other']

export default function OrgRequestPage() {
  const [profile, setProfile] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [form, setForm] = useState({ title:'', description:'', trade_category:'Electrical', urgency:'Within 2 weeks', warranty_period:'90' })
  const [step, setStep] = useState<'select'|'details'|'confirm'>('select')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof?.org_id) { window.location.href = '/org/setup'; return }
      setProfile(prof)
      const { data: orgData } = await supabase.from('organisations').select('*').eq('id', prof.org_id).single()
      setOrg(orgData)
      const { data: props } = await supabase.from('properties').select('*').eq('org_id', prof.org_id).order('suburb').order('address')
      setProperties(props || [])
      setLoading(false)
    })
  }, [])

  const toggleProperty = (id: string) => {
    setSelectedProperties(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const submitJobs = async () => {
    if (!form.title || selectedProperties.length === 0) return
    setSubmitting(true)
    setSubmitError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSubmitError('Not logged in'); setSubmitting(false); return }
    let created = 0
    for (const propId of selectedProperties) {
      const prop = properties.find(p => p.id === propId)
      const { data: newJob, error } = await supabase.from('jobs').insert({
        client_id: session.user.id,
        org_id: org.id,
        property_id: propId,
        title: form.title,
        description: form.description,
        trade_category: form.trade_category,
        urgency: form.urgency,
        property_type: prop?.property_type || 'Residential house',
        suburb: prop?.suburb || '',
        warranty_period: Number(form.warranty_period),
        status: 'matching',
      })
      if (!error) created++
    }
    setSubmitting(false)
    if (created > 0) { window.location.href = '/shortlist' }
    else setSubmitError('Failed to create jobs — please try again')
  }

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box', fontFamily:'sans-serif' }

  const suburbs = Array.from(new Set(properties.map(p => p.suburb || 'Other'))).sort()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', maxWidth:'480px', width:'100%', margin:'0 24px' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>✓</div>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#0A0A0A', marginBottom:'8px' }}>Jobs created</h2>
        <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>
          {selectedProperties.length} job request{selectedProperties.length !== 1 ? 's' : ''} created across {selectedProperties.length} {selectedProperties.length !== 1 ? 'properties' : 'property'}.
        </p>
        <a href="/org/dashboard" style={{ background:'#0A0A0A', color:'white', padding:'12px 28px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>Back to dashboard →</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
        <a href="/org/dashboard" style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background:'#0A0A0A', padding:'32px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,82,42,0.12), transparent 55%)' }} />
        <div style={{ maxWidth:'860px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Portfolio Job Request</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'26px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>NEW JOB REQUEST</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)' }}>{org?.name} · {properties.length} properties</p>
        </div>
      </div>

      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px 24px' }}>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'28px', alignItems:'center' }}>
          {(['select','details','confirm'] as const).map((s, i) => {
            const labels: Record<string, string> = { select:'Select properties', details:'Job details', confirm:'Confirm & submit' }
            return (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                {i > 0 && <div style={{ width:'24px', height:'1px', background:'rgba(28,43,50,0.2)' }} />}
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, background: step === s ? '#0A0A0A' : 'rgba(28,43,50,0.15)', color: step === s ? 'white' : '#7A9098' }}>{i+1}</div>
                  <span style={{ fontSize:'12px', color: step === s ? '#0A0A0A' : '#7A9098', fontWeight: step === s ? 600 : 400 }}>{labels[s]}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* STEP 1 — Select properties */}
        {step === 'select' && (
          <div>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>SELECT PROPERTIES</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button type="button" onClick={() => setSelectedProperties(properties.map(p => p.id))} style={{ fontSize:'12px', color:'#2E6A8F', background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>Select all</button>
                  <button type="button" onClick={() => setSelectedProperties([])} style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>Clear</button>
                </div>
              </div>
              {properties.length === 0 ? (
                <div style={{ padding:'32px', textAlign:'center' }}>
                  <p style={{ fontSize:'14px', color:'#4A5E64' }}>No properties yet. <a href="/org/properties/new" style={{ color:'#D4522A' }}>Add a property</a> first.</p>
                </div>
              ) : (
                <div style={{ padding:'16px 20px' }}>
                  {suburbs.map(suburb => {
                    const suburbProps = properties.filter(p => (p.suburb || 'Other') === suburb)
                    return (
                      <div key={suburb} style={{ marginBottom:'16px' }}>
                        <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'8px' }}>{suburb}</p>
                        <div className='property-select-grid' style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'8px' }}>
                          {suburbProps.map(p => (
                            <div key={p.id} onClick={() => toggleProperty(p.id)}
                              style={{ padding:'12px 14px', border:'1.5px solid ' + (selectedProperties.includes(p.id) ? '#2E6A8F' : 'rgba(28,43,50,0.1)'), borderRadius:'10px', cursor:'pointer', background: selectedProperties.includes(p.id) ? 'rgba(46,106,143,0.06)' : 'white', display:'flex', alignItems:'center', gap:'10px' }}>
                              <div style={{ width:'18px', height:'18px', borderRadius:'4px', border:'1.5px solid ' + (selectedProperties.includes(p.id) ? '#2E6A8F' : 'rgba(28,43,50,0.2)'), background: selectedProperties.includes(p.id) ? '#2E6A8F' : 'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                {selectedProperties.includes(p.id) && <span style={{ color:'white', fontSize:'10px', fontWeight:700 }}>✓</span>}
                              </div>
                              <div>
                                <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{p.address}</p>
                                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{p.property_type}</p>
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
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button type="button" onClick={() => setStep('details')} disabled={selectedProperties.length === 0}
                style={{ background: selectedProperties.length > 0 ? '#0A0A0A' : 'rgba(28,43,50,0.2)', color:'white', padding:'12px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor: selectedProperties.length > 0 ? 'pointer' : 'not-allowed' }}>
                Continue with {selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Job details */}
        {step === 'details' && (
          <div>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px', marginBottom:'20px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'20px' }}>JOB DETAILS</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div>
                  <p style={{ fontSize:'12px', fontWeight:500, color:'#4A5E64', marginBottom:'6px' }}>Job title *</p>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Annual gutter clean and inspection" style={inp} />
                </div>
                <div>
                  <p style={{ fontSize:'12px', fontWeight:500, color:'#4A5E64', marginBottom:'6px' }}>Trade category</p>
                  <select value={form.trade_category} onChange={e => setForm(f => ({...f, trade_category: e.target.value}))} style={inp}>
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:'12px', fontWeight:500, color:'#4A5E64', marginBottom:'6px' }}>Description</p>
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    placeholder="Describe the work required across these properties..."
                    style={{ ...inp, minHeight:'96px', resize:'vertical' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:500, color:'#4A5E64', marginBottom:'6px' }}>Urgency</p>
                    <select value={form.urgency} onChange={e => setForm(f => ({...f, urgency: e.target.value}))} style={inp}>
                      {['ASAP','Within 1 week','Within 2 weeks','Within a month','Flexible'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:500, color:'#4A5E64', marginBottom:'6px' }}>Warranty period</p>
                    <select value={form.warranty_period} onChange={e => setForm(f => ({...f, warranty_period: e.target.value}))} style={inp}>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">12 months</option>
                      <option value="730">24 months (custom)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button type="button" onClick={() => setStep('select')} style={{ background:'transparent', color:'#4A5E64', padding:'12px 20px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>← Back</button>
              <button type="button" onClick={() => setStep('confirm')} disabled={!form.title}
                style={{ background: form.title ? '#0A0A0A' : 'rgba(28,43,50,0.2)', color:'white', padding:'12px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor: form.title ? 'pointer' : 'not-allowed' }}>
                Review & confirm →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 'confirm' && (
          <div>
            <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#C07830', marginBottom:'6px' }}>⚠ Multi-property posting</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6' }}>
                You are about to post <strong>{selectedProperties.length} separate job request{selectedProperties.length !== 1 ? 's' : ''}</strong> — one per property.
                Each job is independently managed through the full Steadyhand flow.
                Please ensure tradies you invite have capacity to service each property before committing.
              </p>
            </div>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'20px', marginBottom:'20px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'14px' }}>JOB SUMMARY</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                {[
                  { label:'Title', value: form.title },
                  { label:'Trade', value: form.trade_category },
                  { label:'Urgency', value: form.urgency },
                  { label:'Warranty', value: form.warranty_period + ' days' },
                  { label:'Properties', value: selectedProperties.length + ' selected' },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'2px', textTransform:'uppercase' }}>{item.label}</p>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'10px', color:'#7A9098', letterSpacing:'0.5px', marginBottom:'8px', textTransform:'uppercase' }}>Properties ({selectedProperties.length})</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {selectedProperties.map(id => {
                  const p = properties.find(prop => prop.id === id)
                  return <p key={id} style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>• {p?.address}{p?.suburb ? ', ' + p.suburb : ''}</p>
                })}
              </div>
            </div>
            {submitError && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px' }}>{submitError}</p>}
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button type="button" onClick={() => setStep('details')} style={{ background:'transparent', color:'#4A5E64', padding:'12px 20px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>← Back</button>
              <button type="button" onClick={submitJobs} disabled={submitting}
                style={{ background:'#D4522A', color:'white', padding:'12px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Creating jobs...' : 'Confirm & post ' + selectedProperties.length + ' job' + (selectedProperties.length !== 1 ? 's' : '') + ' →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
