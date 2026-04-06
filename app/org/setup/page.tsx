'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ORG_TYPES = [
  { value: 'strata', label: 'Strata manager', desc: 'Managing common property and lot owners' },
  { value: 'property_manager', label: 'Property manager', desc: 'Managing residential or commercial rentals' },
  { value: 'commercial', label: 'Commercial owner', desc: 'Owning and managing commercial property' },
  { value: 'other', label: 'Other organisation', desc: 'Council, developer, or other entity' },
]

export default function OrgSetupPage() {
  const [profile, setProfile] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name:'', type:'', abn:'', phone:'', website:'', billing_email:'' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      if (prof?.org_id) window.location.href = '/org/dashboard'
    })
  }, [])

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const createOrg = async () => {
    if (!form.name || !form.type) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: org } = await supabase.from('organisations').insert({
      name: form.name,
      type: form.type,
      abn: form.abn || null,
      phone: form.phone || null,
      website: form.website || null,
      billing_email: form.billing_email || profile?.email,
    }).select().single()
    if (org) {
      await supabase.from('org_memberships').insert({ org_id: org.id, user_id: profile.id, role: 'admin' })
      await supabase.from('profiles').update({ org_id: org.id }).eq('id', profile.id)
      window.location.href = '/org/dashboard'
    }
    setSubmitting(false)
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
      </nav>
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'48px 24px' }}>
        <div style={{ background:'#1C2B32', borderRadius:'14px', padding:'28px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Organisation setup</p>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'8px' }}>SET UP YOUR ORGANISATION</h1>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', lineHeight:'1.6' }}>
              Manage multiple properties and jobs from one place. Invite your team and set permissions.
            </p>
          </div>
        </div>

        {step === 1 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'16px' }}>WHAT TYPE OF ORGANISATION?</h2>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'20px' }}>
              {ORG_TYPES.map(t => (
                <div key={t.value} onClick={() => setF('type', t.value)}
                  style={{ padding:'14px 16px', borderRadius:'10px', border:'2px solid '+(form.type === t.value ? '#D4522A' : 'rgba(28,43,50,0.1)'), background: form.type === t.value ? 'rgba(212,82,42,0.06)' : '#F4F8F7', cursor:'pointer' }}>
                  <p style={{ fontSize:'14px', fontWeight:500, color: form.type === t.value ? '#D4522A' : '#1C2B32', margin:'0 0 3px' }}>{t.label}</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{t.desc}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setStep(2)} disabled={!form.type}
              style={{ width:'100%', background:'#1C2B32', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: !form.type ? 0.5 : 1 }}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'16px' }}>ORGANISATION DETAILS</h2>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Organisation name *</label>
                <input type="text" placeholder="e.g. Coastal Strata Management" value={form.name} onChange={e => setF('name', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>ABN</label>
                <input type="text" placeholder="12 345 678 901" value={form.abn} onChange={e => setF('abn', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Phone</label>
                <input type="tel" placeholder="08 9000 0000" value={form.phone} onChange={e => setF('phone', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Billing email</label>
                <input type="email" placeholder={profile?.email || 'billing@yourorg.com.au'} value={form.billing_email} onChange={e => setF('billing_email', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'5px' }}>Website (optional)</label>
                <input type="url" placeholder="https://yourcompany.com.au" value={form.website} onChange={e => setF('website', e.target.value)} style={inp} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" onClick={() => setStep(1)}
                style={{ background:'transparent', color:'#1C2B32', padding:'12px 20px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>
                Back
              </button>
              <button type="button" onClick={createOrg} disabled={!form.name || submitting}
                style={{ flex:1, background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: !form.name || submitting ? 0.6 : 1 }}>
                {submitting ? 'Creating...' : 'Create organisation →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
