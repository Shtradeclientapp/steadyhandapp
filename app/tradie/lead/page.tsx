"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradieLead() {
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ client_name: '', client_email: '', job_title: '', job_description: '', trade_category: '', suburb: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const TRADES = ['Electrical','Plumbing & Gas','Carpentry & Joinery','Painting & Decorating','Tiling','Roofing','Concreting & Paving','Plastering','Air Conditioning & Refrigeration','Bricklaying','Landscaping & Gardening','Fencing','Glazing','Rendering','Waterproofing','Cabinetmaking','Flooring','Insulation','Solar & Batteries','Demolition','Excavation','Swimming Pool Construction','Underpinning','Other']

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name, id)').eq('id', session.user.id).single()
      setProfile(prof)
      const { data: existing } = await supabase.from('tradie_leads').select('*').eq('tradie_id', prof?.tradie?.id).order('created_at', { ascending: false })
      setLeads(existing || [])
    })
  }, [])

  const handleSend = async () => {
    if (!form.client_email || !form.job_title) return
    setSending(true)
    const supabase = createClient()
    const { data: lead } = await supabase.from('tradie_leads').insert({
      tradie_id: profile?.tradie?.id,
      client_name: form.client_name,
      client_email: form.client_email,
      job_title: form.job_title,
      job_description: form.job_description,
      trade_category: form.trade_category,
      suburb: form.suburb,
      status: 'invited',
    }).select().single()

    // Send invite email
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tradie_lead_invite',
        to: form.client_email,
        client_name: form.client_name,
        tradie_name: profile?.tradie?.business_name,
        job_title: form.job_title,
        job_description: form.job_description,
        lead_id: lead?.id,
      }),
    }).catch(() => {})

    setLeads(prev => [{ ...form, id: lead?.id, status: 'invited', created_at: new Date().toISOString() }, ...prev])
    setSent(true)
    setSending(false)
    setForm({ client_name: '', client_email: '', job_title: '', job_description: '', trade_category: '', suburb: '' })
  }

  const inp = { width:'100%', padding:'9px 12px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'rgba(255,255,255,0.06)', color:'rgba(216,228,225,0.9)', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }
  const label = { fontSize:'11px', color:'rgba(216,228,225,0.5)', display:'block', marginBottom:'4px', letterSpacing:'0.5px' }

  const statusColor: Record<string,string> = { invited:'#C07830', submitted:'#2E7D60', expired:'#7A9098' }

  return (
    <div style={{ minHeight:'100vh', background:'#1C2B32', fontFamily:'sans-serif' }}>
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'32px 24px' }}>
        <a href="/tradie/dashboard" style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', textDecoration:'none', display:'block', marginBottom:'24px' }}>← Dashboard</a>
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.35)', marginBottom:'6px' }}>Lead intake</p>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'4px' }}>INVITE A CLIENT</h1>
        <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', marginBottom:'28px' }}>Send a client a personalised invitation to submit a job request through Steadyhand. When they respond, it comes directly to you.</p>

        {sent && (
          <div style={{ background:'rgba(46,125,96,0.12)', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'10px', padding:'14px 18px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'18px' }}>✓</span>
            <p style={{ fontSize:'13px', color:'#2E7D60', margin:0, fontWeight:500 }}>Invitation sent. You'll be notified when they submit a request.</p>
          </div>
        )}

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'24px' }}>
          <p style={{ fontSize:'13px', fontWeight:500, color:'rgba(216,228,225,0.7)', marginBottom:'18px' }}>Client details</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={label}>Client name</label>
              <input type="text" placeholder="Jane Smith" value={form.client_name} onChange={set('client_name')} style={inp} />
            </div>
            <div>
              <label style={label}>Client email *</label>
              <input type="email" placeholder="jane@example.com" value={form.client_email} onChange={set('client_email')} style={inp} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={label}>Trade category</label>
              <select value={form.trade_category} onChange={set('trade_category')} style={inp}>
                <option value="">Select trade</option>
                {TRADES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Suburb</label>
              <input type="text" placeholder="e.g. Subiaco" value={form.suburb} onChange={set('suburb')} style={inp} />
            </div>
          </div>
          <p style={{ fontSize:'13px', fontWeight:500, color:'rgba(216,228,225,0.7)', margin:'16px 0 12px' }}>Job details (optional — helps the client write a better request)</p>
          <div style={{ marginBottom:'12px' }}>
            <label style={label}>Job title</label>
            <input type="text" placeholder="e.g. Kitchen renovation — Fremantle" value={form.job_title} onChange={set('job_title')} style={inp} />
          </div>
          <div style={{ marginBottom:'18px' }}>
            <label style={label}>Notes for client</label>
            <textarea placeholder="e.g. As discussed — please describe the scope as we talked about it on site." value={form.job_description} onChange={set('job_description')} style={{ ...inp, minHeight:'80px', resize:'vertical' as const }} />
          </div>
          <button type="button" onClick={handleSend} disabled={sending || !form.client_email}
            style={{ width:'100%', background: sending || !form.client_email ? 'rgba(46,125,96,0.4)' : '#2E7D60', color:'white', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
            {sending ? 'Sending...' : 'Send invitation →'}
          </button>
        </div>

        {leads.length > 0 && (
          <div>
            <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'rgba(216,228,225,0.35)', marginBottom:'12px' }}>Sent invitations</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {leads.map((l: any) => (
                <div key={l.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                  <div>
                    <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.85)', margin:'0 0 2px', fontWeight:500 }}>{l.client_name || l.client_email}</p>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:0 }}>{l.job_title || 'No job title'} · {new Date(l.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                  <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:(statusColor[l.status]||'#7A9098')+'18', border:'1px solid '+(statusColor[l.status]||'#7A9098')+'40', color:statusColor[l.status]||'#7A9098', fontWeight:500 }}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
