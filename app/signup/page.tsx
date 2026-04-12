'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
const TRADES = ['Plumbing & Gas','Electrical','Carpentry & Joinery','Tiling','Painting & Decorating','Roofing','Landscaping','Air Conditioning','General Handyman']
const SUBURBS = [
  'Perth CBD', 'Subiaco', 'Leederville', 'Mount Lawley', 'Northbridge',
  'Fremantle', 'Cottesloe', 'Claremont', 'Nedlands', 'Crawley',
  'Victoria Park', 'South Perth', 'Como', 'Applecross', 'Melville',
  'Canning Vale', 'Willetton', 'Booragoon', 'Karrinyup', 'Scarborough',
  'Innaloo', 'Stirling', 'Balga', 'Mirrabooka', 'Morley',
  'Bayswater', 'Maylands', 'Bassendean', 'Guildford', 'Midland',
  'Armadale', 'Gosnells', 'Maddington', 'Kenwick', 'Bentley',
  'Joondalup', 'Wanneroo', 'Kingsley', 'Duncraig', 'Hillarys',
  'Rockingham', 'Baldivis', 'Secret Harbour', 'Mandurah', 'Pinjarra',
  'Murray', 'Serpentine', 'Mundijong',
  'Bunbury', 'Busselton', 'Dunsborough', 'Margaret River', 'Augusta',
  'Collie', 'Harvey', 'Donnybrook', 'Bridgetown', 'Manjimup',
  'Geraldton', 'Carnarvon', 'Exmouth', 'Karratha', 'Port Hedland',
  'Broome', 'Kununurra', 'Derby',
  'Albany', 'Denmark', 'Mount Barker', 'Esperance',
  'Kalgoorlie', 'Boulder', 'Merredin', 'Northam', 'York',
  'Narrogin', 'Katanning', 'Wagin',
]
const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', display:'block' }
const lbl: React.CSSProperties = { display:'block', fontSize:'13px', fontWeight:500, color:'#1C2B32', marginBottom:'6px', fontFamily:'sans-serif' }
export default function SignupPage() {
  const [role, setRole] = useState<'client'|'tradie'|'org'>('client')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName:'', email:'', password:'', suburb:'', businessName:'', tradeCategory:'', serviceArea:'', licenceNumber:'', abn:'' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const supabase = createClient()
  const handleSignup = async () => {
    setLoading(true); setError('')
    const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr || !data.user) { setError(authErr?.message ?? 'Signup failed'); setLoading(false); return }
    const uid = data.user.id
    await supabase.from('profiles').insert({ id: uid, role, full_name: form.fullName, email: form.email, suburb: form.suburb })
    if (role === 'tradie') {
      await supabase.from('tradie_profiles').insert({ id: uid, business_name: form.businessName, trade_categories: [form.tradeCategory], service_areas: [form.serviceArea], licence_number: form.licenceNumber, abn: form.abn, subscription_active: false })
    }
    window.location.href = role === 'tradie' ? '/tradie/dashboard' : role === 'org' ? '/org/setup' : '/dashboard'
  }
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', flexDirection:'column' }}>
      <style>{`.sr { display: none; } @media (min-width: 769px) { .sr { display: flex !important; } } @media (max-width: 768px) { .sg { grid-template-columns: 1fr !important; } .rb { grid-template-columns: 1fr 1fr !important; } .sl { padding: 32px 20px !important; } }`}</style>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <a href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/login" style={{ border:'1px solid rgba(28,43,50,0.25)', color:'#1C2B32', padding:'8px 18px', borderRadius:'6px', fontSize:'13px', textDecoration:'none' }}>Log in</a>
      </nav>
      <div className="sg" style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        <div className="sl" style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px', overflowY:'auto' }}>
          <div style={{ maxWidth:'420px', width:'100%', margin:'0 auto' }}>
            {step === 1 && <>
              <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>CREATE ACCOUNT</h1>
              <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>What best describes you?</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'24px' }}>
                {([
                  { id:'client', icon:'🏠', label:'HOMEOWNER', sub:'Post job requests' },
                  { id:'tradie', icon:'🔧', label:'TRADE BUSINESS', sub:'Receive verified jobs' },
                  { id:'org', icon:'🏢', label:'ORGANISATION', sub:'Manage properties' },
                ] as const).map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    style={{ padding:'14px 8px', border:'1.5px solid ' + (role===r.id ? (r.id==='org' ? '#6B4FA8' : '#D4522A') : 'rgba(28,43,50,0.15)'), borderRadius:'12px', background: role===r.id ? (r.id==='org' ? 'rgba(107,79,168,0.06)' : 'rgba(212,82,42,0.05)') : '#E8F0EE', cursor:'pointer', textAlign:'center' as const }}>
                    <div style={{ fontSize:'22px', marginBottom:'6px' }}>{r.icon}</div>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'10px', color:'#1C2B32', letterSpacing:'0.5px' }}>{r.label}</div>
                    <div style={{ fontSize:'10px', color:'#7A9098', marginTop:'3px' }}>{r.sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'11px 14px', marginBottom:'20px' }}>
                <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>Steadyhand is built to support you — not just through this job, but in how you approach every one that follows.</p>
              </div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Full name</label><input style={inp} placeholder="Sarah Mitchell" value={form.fullName} onChange={set('fullName')} /></div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Email</label><input style={inp} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} /></div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Password</label><input style={inp} type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} /></div>
              <div style={{ marginBottom:'20px' }}><label style={lbl}>Suburb</label><select style={inp} value={form.suburb} onChange={set('suburb')}><option value="">Select...</option>{SUBURBS.map(s => <option key={s}>{s}</option>)}</select></div>
              {role === 'tradie' ? (
                <button type="button" onClick={() => setStep(2)} disabled={!form.fullName||!form.email||!form.password} style={{ width:'100%', background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer', opacity: !form.fullName||!form.email||!form.password ? 0.5 : 1 }}>Continue — trade details →</button>
              ) : role === 'org' ? (
                <button type="button" onClick={handleSignup} disabled={loading||!form.fullName||!form.email||!form.password} style={{ width:'100%', background:'#6B4FA8', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer', opacity: loading||!form.fullName||!form.email||!form.password ? 0.5 : 1 }}>{loading ? 'Creating...' : 'Create account — set up organisation →'}</button>
              ) : (
                <button type="button" onClick={handleSignup} disabled={loading||!form.fullName||!form.email||!form.password} style={{ width:'100%', background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer', opacity: loading||!form.fullName||!form.email||!form.password ? 0.5 : 1 }}>{loading ? 'Creating...' : 'Create account →'}</button>
              )}
              {error && <p style={{ marginTop:'12px', fontSize:'13px', color:'#D4522A', textAlign:'center' }}>{error}</p>}
              <p style={{ marginTop:'16px', fontSize:'13px', color:'#4A5E64', textAlign:'center' }}>Already have an account? <a href="/login" style={{ color:'#D4522A', fontWeight:500 }}>Sign in</a></p>
            </>}
            {step === 2 && <>
              <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>TRADE DETAILS</h1>
              <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>Your business and credentials</p>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Business name</label><input style={inp} placeholder="Walsh Plumbing & Gas" value={form.businessName} onChange={set('businessName')} /></div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Trade category</label><select style={inp} value={form.tradeCategory} onChange={set('tradeCategory')}><option value="">Select...</option>{TRADES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Service area</label><select style={inp} value={form.serviceArea} onChange={set('serviceArea')}><option value="">Select...</option>{SUBURBS.map(s => <option key={s}>{s}</option>)}</select></div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Licence number</label><input style={inp} placeholder="PL12345" value={form.licenceNumber} onChange={set('licenceNumber')} /></div>
              <div style={{ marginBottom:'16px' }}><label style={lbl}>ABN</label><input style={inp} placeholder="12 345 678 901" value={form.abn} onChange={set('abn')} /></div>
              <div style={{ padding:'12px', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', fontSize:'12px', color:'#D4522A', marginBottom:'16px' }}>Licence and insurance verified before profile goes live.</div>
              {error && <p style={{ marginBottom:'12px', fontSize:'13px', color:'#D4522A' }}>{error}</p>}
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ background:'transparent', color:'#1C2B32', padding:'13px 20px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>Back</button>
                <button type="button" onClick={handleSignup} disabled={loading||!form.businessName||!form.tradeCategory} style={{ flex:1, background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer', opacity: loading||!form.businessName||!form.tradeCategory ? 0.5 : 1 }}>{loading ? 'Creating...' : 'Create account →'}</button>
              </div>
            </>}
          </div>
        </div>
        <div className="sr" style={{ background:'#1C2B32', alignItems:'center', justifyContent:'center', padding:'60px 48px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 30%, rgba(46,125,96,0.25), transparent 55%)' }} />
          <blockquote style={{ position:'relative', zIndex:1, maxWidth:'360px' }}>
            <p style={{ fontFamily:'sans-serif', fontSize:'18px', fontStyle:'italic', fontWeight:300, lineHeight:1.7, color:'rgba(216,228,225,0.85)', marginBottom:'20px' }}>"The scope agreement meant there were no surprises. Both sides knew exactly what was happening and when."</p>
            <cite style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', fontStyle:'normal', fontFamily:'sans-serif' }}>— Emma, Homeowner, Subiaco WA</cite>
          </blockquote>
        </div>
      </div>
      <p style={{ textAlign:'center', fontSize:'11px', color:'#9AA5AA', marginTop:'24px' }}>
        By creating an account you agree to our{' '}
        <a href="/terms" style={{ color:'#7A9098', textDecoration:'underline' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color:'#7A9098', textDecoration:'underline' }}>Privacy Policy</a>
      </p>
    </div>
  )
}
