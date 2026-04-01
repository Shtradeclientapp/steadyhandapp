
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TRADES = [
  'Plumbing & Gas', 'Electrical', 'Carpentry & Joinery', 'Tiling',
  'Painting & Decorating', 'Roofing', 'Landscaping', 'Air Conditioning', 'General Handyman'
]

const SUBURBS = [
  'Perth CBD', 'Fremantle', 'Subiaco', 'Cottesloe', 'Leederville',
  'Northbridge', 'Mount Lawley', 'Mandurah', 'Bunbury', 'Geraldton',
  'Albany', 'Broome', 'Kalgoorlie', 'Margaret River'
]

const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid rgba(28,43,50,0.18)',
  borderRadius: '8px', fontSize: '14px',
  background: '#F4F8F7', color: '#1C2B32',
  outline: 'none', fontFamily: 'sans-serif',
  display: 'block', marginTop: '4px'
}

const labelStyle = {
  display: 'block', fontSize: '13px',
  fontWeight: '500' as const, color: '#1C2B32',
  marginBottom: '14px', fontFamily: 'sans-serif'
}

export default function RequestPage() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [form, setForm] = useState({
    trade_category: '', title: '', description: '',
    suburb: '', property_type: 'Residential house',
    urgency: 'Within 2 weeks', budget_range: '',
    warranty_period: '90', preferred_start: ''
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submitJob = async () => {
    setSubmitting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, warranty_period: Number(form.warranty_period) }),
    })
    const { job, error } = await res.json()
    if (error) { alert(error); setSubmitting(false); return }
    setJobId(job.id)
    setStep(3)
    setSubmitting(false)
  }

  const nav = (
    <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
      <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
      <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
    </nav>
  )

  const dots = (
    <div style={{ display:'flex', gap:'6px', marginBottom:'28px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ height:'8px', borderRadius:'4px', background: i < step ? '#2E7D60' : i === step ? '#2E7D60' : 'rgba(28,43,50,0.15)', width: i === step ? '24px' : '8px', transition:'all 0.3s' }} />
      ))}
    </div>
  )

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'32px', marginBottom:'20px' }}>
      {children}
    </div>
  )

  const btn = (label: string, onClick: () => void, variant: 'primary'|'ghost' = 'primary', disabled = false) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: variant === 'primary' ? '#1C2B32' : 'transparent',
      color: variant === 'primary' ? 'white' : '#1C2B32',
      border: variant === 'ghost' ? '1px solid rgba(28,43,50,0.25)' : 'none',
      padding:'13px 24px', borderRadius:'8px', fontSize:'14px',
      fontWeight:'500', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, fontFamily:'sans-serif'
    }}>{label}</button>
  )

  if (step === 3) return (
    <>
      {nav}
      <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ maxWidth:'520px', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'56px', marginBottom:'16px' }}>✅</div>
          <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'12px' }}>REQUEST SUBMITTED</h2>
          <p style={{ fontSize:'15px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'32px', fontFamily:'sans-serif' }}>
            Our AI is matching your job to verified local tradies right now. You'll be notified when your shortlist is ready — usually within a few minutes.
          </p>
          <div style={{ background:'#1C2B32', borderRadius:'12px', padding:'20px', marginBottom:'28px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.2), transparent 50%)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(216,228,225,0.1)', border:'1px solid rgba(216,228,225,0.2)', borderRadius:'100px', padding:'3px 10px', marginBottom:'10px' }}>
                <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
                <span style={{ fontSize:'10px', color:'rgba(216,228,225,0.7)', letterSpacing:'0.8px', textTransform:'uppercase' }}>AI matching in progress</span>
              </div>
              <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.65)', lineHeight:'1.6', fontFamily:'sans-serif' }}>
                Claude is reviewing your request and ranking verified tradies by category fit, location, track record, and verification status.
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/dashboard">
              <button style={{ background:'#1C2B32', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer', fontFamily:'sans-serif' }}>
                Go to dashboard →
              </button>
            </a>
            <button onClick={() => { setStep(0); setForm({ trade_category:'', title:'', description:'', suburb:'', property_type:'Residential house', urgency:'Within 2 weeks', budget_range:'', warranty_period:'90', preferred_start:'' }) }}
              style={{ background:'transparent', color:'#1C2B32', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer', fontFamily:'sans-serif' }}>
              Post another job
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {nav}
      <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
        <div style={{ maxWidth:'600px', margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#2E7D60', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Stage 1</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>DEFINE YOUR REQUEST</h1>
          <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6', fontFamily:'sans-serif' }}>
            You set the brief. The more detail you give, the better your AI-matched shortlist.
          </p>
          {dots}

          {step === 0 && card(
            <>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'20px', fontWeight:'500' }}>What do you need done?</p>
              <label style={labelStyle}>
                Trade category
                <select value={form.trade_category} onChange={set('trade_category')} style={inputStyle}>
                  <option value="">Select trade...</option>
                  {TRADES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                Request title
                <input type="text" placeholder="e.g. Full bathroom renovation — Subiaco" value={form.title} onChange={set('title')} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Describe what you need
                <textarea
                  placeholder="What needs doing? Include property age, access issues, materials preference, anything the tradie should know upfront."
                  value={form.description} onChange={set('description')}
                  style={{ ...inputStyle, minHeight:'100px', resize:'vertical' as const }}
                />
                <span style={{ fontSize:'11px', color:'#7A9098', marginTop:'4px', display:'block' }}>Tip: mention your home's age and any access constraints</span>
              </label>
              <button
                onClick={() => setStep(1)}
                disabled={!form.trade_category || !form.title || !form.description}
                style={{ width:'100%', background:'#2E7D60', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity:(!form.trade_category || !form.title || !form.description) ? 0.5 : 1, fontFamily:'sans-serif' }}>
                Continue — location & timing →
              </button>
            </>
          )}

          {step === 1 && card(
            <>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'20px', fontWeight:'500' }}>Location & timing</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <label style={labelStyle}>
                  Suburb
                  <select value={form.suburb} onChange={set('suburb')} style={inputStyle}>
                    <option value="">Select suburb...</option>
                    {SUBURBS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>
                  Property type
                  <select value={form.property_type} onChange={set('property_type')} style={inputStyle}>
                    <option>Residential house</option>
                    <option>Unit / apartment</option>
                    <option>Commercial</option>
                    <option>Rural / farm</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Preferred start
                  <select value={form.preferred_start} onChange={set('preferred_start')} style={inputStyle}>
                    <option value="">As soon as possible</option>
                    <option>Within 2 weeks</option>
                    <option>Within a month</option>
                    <option>Flexible — no rush</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Budget range
                  <select value={form.budget_range} onChange={set('budget_range')} style={inputStyle}>
                    <option value="">Not sure — need quotes</option>
                    <option>Under $1,000</option>
                    <option>$1,000–$5,000</option>
                    <option>$5,000–$15,000</option>
                    <option>$15,000+</option>
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Warranty period
                <select value={form.warranty_period} onChange={set('warranty_period')} style={inputStyle}>
                  <option value="90">Standard — 90 days</option>
                  <option value="180">Extended — 6 months</option>
                  <option value="365">Full — 12 months</option>
                </select>
                <span style={{ fontSize:'11px', color:'#7A9098', marginTop:'4px', display:'block' }}>Written into the scope agreement — the tradie's obligation after completion</span>
              </label>
              <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
                {btn('← Back', () => setStep(0), 'ghost')}
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.suburb}
                  style={{ flex:1, background:'#2E7D60', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity:!form.suburb ? 0.5 : 1, fontFamily:'sans-serif' }}>
                  Continue — review & submit →
                </button>
              </div>
            </>
          )}

          {step === 2 && card(
            <>
              <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', color:'#7A9098', marginBottom:'20px', fontWeight:'500' }}>Review your request</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'0' }}>
                {[
                  { label:'Trade', value:form.trade_category },
                  { label:'Title', value:form.title },
                  { label:'Description', value:form.description },
                  { label:'Suburb', value:form.suburb },
                  { label:'Property', value:form.property_type },
                  { label:'Urgency', value:form.urgency },
                  { label:'Budget', value:form.budget_range || 'Not specified' },
                  { label:'Warranty', value:form.warranty_period === '90' ? '90 days' : form.warranty_period === '180' ? '6 months' : '12 months' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                    <span style={{ fontSize:'13px', color:'#7A9098', minWidth:'90px', flexShrink:0, fontFamily:'sans-serif' }}>{item.label}</span>
                    <span style={{ fontSize:'13px', fontWeight:'500', color:'#1C2B32', fontFamily:'sans-serif' }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'20px', padding:'14px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'9px' }}>
                <p style={{ fontSize:'11px', fontWeight:'500', textTransform:'uppercase' as const, letterSpacing:'0.8px', color:'#2E7D60', marginBottom:'6px' }}>What happens next</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', fontFamily:'sans-serif' }}>
                  Claude will review your request and build a shortlist of 3–5 verified tradies matched to your trade, suburb, and job complexity.
                </p>
              </div>
              <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
                {btn('← Back', () => setStep(1), 'ghost')}
                <button
                  onClick={submitJob}
                  disabled={submitting}
                  style={{ flex:1, background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity:submitting ? 0.6 : 1, fontFamily:'sans-serif' }}>
                  {submitting ? 'Submitting...' : 'Submit request & build shortlist →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}