'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TRADES = ['Plumbing & Gas','Electrical','Carpentry & Joinery','Tiling','Painting & Decorating','Roofing','Landscaping','Air Conditioning','General Handyman']
const SUBURBS = ['Perth Metro','Fremantle','Subiaco','Cottesloe','Leederville','Mandurah','Bunbury','Geraldton','Albany','Broome','Kalgoorlie','Margaret River']

const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', display:'block' as const }
const lbl = { display:'block' as const, fontSize:'13px', fontWeight:'500' as const, color:'#1C2B32', marginBottom:'6px', fontFamily:'sans-serif' }

export default function SignupPage() {
  const [role, setRole] = useState<'client'|'tradie'>('client')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName:'', email:'', password:'', suburb:'', businessName:'', tradeCategory:'', serviceArea:'', licenceNumber:'', abn:'' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const supabase = createClient()

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr || !data.user) { setError(authErr?.message ?? 'Signup failed'); setLoading(false); return }
    const uid = data.user.id
    await supabase.from('profiles').insert({ id: uid, role, full_name: form.fullName,
cat > ~/Downloads/steadyhand-app/app/signup/page.tsx << 'ENDOFFILE'
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TRADES = ['Plumbing & Gas','Electrical','Carpentry & Joinery','Tiling','Painting & Decorating','Roofing','Landscaping','Air Conditioning','General Handyman']
const SUBURBS = ['Perth Metro','Fremantle','Subiaco','Cottesloe','Leederville','Mandurah','Bunbury','Geraldton','Albany','Broome','Kalgoorlie','Margaret River']

const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', display:'block' as const }
const lbl = { display:'block' as const, fontSize:'13px', fontWeight:'500' as const, color:'#1C2B32', marginBottom:'6px', fontFamily:'sans-serif' }

export default function SignupPage() {
  const [role, setRole] = useState<'client'|'tradie'>('client')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName:'', email:'', password:'', suburb:'', businessName:'', tradeCategory:'', serviceArea:'', licenceNumber:'', abn:'' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const supabase = createClient()

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr || !data.user) { setError(authErr?.message ?? 'Signup failed'); setLoading(false); return }
    const uid = data.user.id
    await supabase.from('profiles').insert({ id: uid, role, full_name: form.fullName, email: form.email, suburb: form.suburb })
    if (role === 'tradie') {
      await supabase.from('tradie_profiles').insert({ id: uid, business_name: form.businessName, trade_categories: [form.tradeCategory], service_areas: [form.serviceArea], licence_number: form.licenceNumber, abn: form.abn, subscription_active: false })
    }
    window.location.href = '/dashboard'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', flexDirection:'column' }}>
      <style>{`
        @media (max-width: 768px) {
          .signup-grid { grid-template-columns: 1fr !important; }
          .signup-right { display: none !important; }
          .signup-left { padding: 32px 20px !important; }
          .role-btns { grid-template-columns: 1fr 1fr !important; }
          .form-row-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <a href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/login" style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.25)', color:'#1C2B32', padding:'8px 18px', borderRadius:'6px', fontSize:'13px', textDecoration:'none' }}>Log in</a>
      </nav>

      <div className="signup-grid" style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        <div className="signup-left" style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px', overflowY:'auto' }}>
          <div style={{ maxWidth:'420px', width:'100%', margin:'0 auto' }}>

            {step === 1 && (
              <>
                <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>CREATE ACCOUNT</h1>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>What best describes you?</p>

                <div className="role-btns" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
                  {(['client','tradie'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      style={{ padding:'16px 12px', border:'1.5px solid ' + (role === r ? '#D4522A' : 'rgba(28,43,50,0.15)'), borderRadius:'12px', background: role === r ? 'rgba(212,82,42,0.05)' : '#E8F0EE', cursor:'pointer', textAlign:'center' as const }}>
                      <div style={{ fontSize:'24px', marginBottom:'8px' }}>{r === 'client' ? '🏠' : '🔧'}</div>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px' }}>{r === 'client' ? 'HOMEOWNER / CLIENT' : 'TRADE BUSINESS'}</div>
                      <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'4px' }}>{r === 'client' ? 'Post jobs, manage projects' : 'Receive leads, quote jobs'}</div>
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom:'14px' }}><label style={lbl}>Full name</label><input style={inp} placeholder="Sarah Mitchell" value={form.fullName} onChange={set('fullName')} /></div>
                <div style={{ marginBottom:'14px' }}><label style={lbl}>Email address</label><input style={inp} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} /></div>
                <div style={{ marginBottom:'14px' }}><label style={lbl}>Password</label><input style={inp} type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} /></div>
                <div style={{ marginBottom:'20px' }}>
                  <label style={lbl}>Your suburb</label>
                  <select style={inp} value={form.suburb} onChange={set('suburb')}>
                    <option value="">Select suburb...</option>
                    {SUBURBS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {role === 'tradie' ? (
                  <button type="button" onClick={() => setStep(2)} disabled={!form.fullName || !form.email || !form.password}
                    style={{ width:'100%', background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity: !form.fullName || !form.email || !form.password ? 0.5 : 1 }}>
                    Continue — trade details →
                  </button>
                ) : (
                  <button type="button" onClick={handleSignup} disabled={loading || !form.fullName || !form.email || !form.password}
                    style={{ width:'100%', background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity: loading || !form.fullName || !form.email || !form.password ? 0.5 : 1 }}>
                    {loading ? 'Creating account...' : 'Create account →'}
                  </button>
                )}

                {error && <p style={{ marginTop:'12px', fontSize:'13px', color:'#D4522A', textAlign:'center' }}>{error}</p>}
                <p style={{ marginTop:'16px', fontSize:'13px', color:'#4A5E64', textAlign:'center' }}>Already have an account? <a href="/login" style={{ color:'#D4522A', fontWeight:'500' }}>Sign in</a></p>
              </>
            )}

            {step === 2 && (
              <>
                <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>TRADE DETAILS</h1>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>Your business and credentials</p>

                <div style={{ marginBottom:'14px' }}><label style={lbl}>Business name</label><input style={inp} placeholder="Walsh Plumbing & Gas" value={form.businessName} onChange={set('businessName')} /></div>
                <div style={{ marginBottom:'14px' }}>
                  <label style={lbl}>Trade category</label>
                  <select style={inp} value={form.tradeCategory} onChange={set('tradeCategory')}>
                    <option value="">Select trade...</option>
                    {TRADES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:'14px' }}>
                  <label style={lbl}>Primary service area</label>
                  <select style={inp} value={form.serviceArea} onChange={set('serviceArea')}>
                    <option value="">Select area...</option>
                    {SUBURBS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:'14px' }}><label style={lbl}>WA Licence number</label><input style={inp} placeholder="PL12345" value={form.licenceNumber} onChange={set('licenceNumber')} /></div>
                <div style={{ marginBottom:'20px' }}><label style={lbl}>ABN</label><input style={inp} placeholder="12 345 678 901" value={form.abn} onChange={set('abn')} /></div>

                <div style={{ padding:'12px 14px', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', fontSize:'12px', color:'#D4522A', marginBottom:'16px' }}>
                  Your licence and insurance will be verified before your profile goes live (usually 1 business day).
                </div>

                {error && <p style={{ marginBottom:'12px', fontSize:'13px', color:'#D4522A' }}>{error}</p>}

                <div style={{ display:'flex', gap:'10px' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ background:'transparent', color:'#1C2B32', padding:'13px 20px', borderRadius:'8px', fontSize:'14px', border:'1px solid rgba(28,43,50,0.25)', cursor:'pointer' }}>← Back</button>
                  <button type="button" onClick={handleSignup} disabled={loading || !form.businessName || !form.tradeCategory}
                    style={{ flex:1, background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor:'pointer', opacity: loading || !form.businessName || !form.tradeCategory ? 0.5 : 1 }}>
                    {loading ? 'Creating account...' : 'Create account →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="signup-right" style={{ background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 48px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 30%, rgba(46,125,96,0.25), transparent 55%)' }} />
          <blockquote style={{ position:'relative', zIndex:1, maxWidth:'360px' }}>
            <p style={{ fontFamily:'sans-serif', fontSize:'18px', fontStyle:'italic', fontWeight:'300', lineHeight:'1.7', color:'rgba(216,228,225,0.85)', marginBottom:'20px' }}>
              "The scope agreement meant there were no surprises. Both sides knew exactly what was happening and when."
            </p>
            <cite style={{ fontSize:'12px', color:'rgba(216,228,225,0.45)', fontStyle:'normal', fontFamily:'sans-serif' }}>
              — Emma, Homeowner, Subiaco WA
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
