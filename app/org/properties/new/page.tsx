'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewPropertyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ address:'', suburb:'', postcode:'', property_type:'residential', owner_name:'', owner_email:'', owner_phone:'', notes:'' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof?.org_id) { window.location.href = '/org/setup'; return }
      setProfile(prof)
    })
  }, [])

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }

  const save = async () => {
    if (!form.address) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('properties').insert({
      org_id: profile.org_id,
      address: form.address,
      suburb: form.suburb || null,
      postcode: form.postcode || null,
      property_type: form.property_type,
      owner_name: form.owner_name || null,
      owner_email: form.owner_email || null,
      owner_phone: form.owner_phone || null,
      notes: form.notes || null,
    })
    setSubmitting(false)
    window.location.href = '/org/dashboard'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
        <a href="/org/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>
      <div style={{ maxWidth:'600px', margin:'0 auto', padding:'40px 24px' }}>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'24px' }}>ADD PROPERTY</h1>
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px', display:'flex', flexDirection:'column' as const, gap:'16px' }}>
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Street address *</label>
            <input type="text" placeholder="e.g. 12/45 King Street" value={form.address} onChange={e => setF('address', e.target.value)} style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Suburb</label>
              <input type="text" placeholder="e.g. Subiaco" value={form.suburb} onChange={e => setF('suburb', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Postcode</label>
              <input type="text" placeholder="6008" value={form.postcode} onChange={e => setF('postcode', e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Property type</label>
            <select value={form.property_type} onChange={e => setF('property_type', e.target.value)} style={{ ...inp, padding:'10px 12px' }}>
              {['residential','commercial','strata_lot','strata_building','industrial'].map(t => (
                <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div style={{ paddingTop:'12px', borderTop:'1px solid rgba(28,43,50,0.08)' }}>
            <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'12px' }}>Owner details (optional)</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              <input type="text" placeholder="Owner name" value={form.owner_name} onChange={e => setF('owner_name', e.target.value)} style={inp} />
              <input type="email" placeholder="Owner email" value={form.owner_email} onChange={e => setF('owner_email', e.target.value)} style={inp} />
              <input type="tel" placeholder="Owner phone" value={form.owner_phone} onChange={e => setF('owner_phone', e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Notes</label>
            <textarea placeholder="Access instructions, key details..." value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3}
              style={{ ...inp, resize:'vertical' as const, lineHeight:'1.6', fontFamily:'sans-serif' }} />
          </div>
          <button type="button" onClick={save} disabled={!form.address || submitting}
            style={{ width:'100%', background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: !form.address || submitting ? 0.6 : 1 }}>
            {submitting ? 'Saving...' : 'Add property →'}
          </button>
        </div>
      </div>
    </div>
  )
}
