'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/ui/NavHeader'

const TRADES = ['Electrical','Plumbing & Gas','Carpentry & Joinery','Painting & Decorating','Tiling','Roofing','Concreting & Paving','Plastering','Air Conditioning & Refrigeration','Bricklaying','Landscaping & Gardening','Fencing','Glazing','Rendering','Waterproofing','Cabinetmaking','Flooring','Insulation','Solar & Batteries','Demolition','Excavation','Swimming Pool Construction','Underpinning','Other']

const SOURCES = [
  { value: 'simpro', label: 'Simpro', icon: '🔧' },
  { value: 'tradify', label: 'Tradify', icon: '📱' },
  { value: 'monday', label: 'Monday.com', icon: '📊' },
  { value: 'servicem8', label: 'ServiceM8', icon: '📋' },
  { value: 'paper', label: 'Paper / notebook', icon: '📝' },
  { value: 'phone', label: 'Phone call', icon: '📞' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'word_of_mouth', label: 'Word of mouth', icon: '🤝' },
  { value: 'other', label: 'Other / direct', icon: '📌' },
]

export default function TradieLead() {
  const [profile, setProfile] = useState<any>(null)
  const [mode, setMode] = useState<'invite'|'import'>('invite')
  const [leads, setLeads] = useState<any[]>([])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  // Invite form
  const [invite, setInvite] = useState({ client_name:'', client_email:'', trade_category:'', suburb:'', job_title:'', notes:'' })

  // Import form
  const [imp, setImp] = useState({
    client_name:'', client_email:'', client_phone:'', address:'', suburb:'',
    trade_category:'', job_title:'', job_description:'', source:'simpro',
    existing_quote_amount:'', preferred_start:'', internal_notes:'',
    invite_client: true,
  })

  const setI = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setInvite(f => ({ ...f, [k]: e.target.value }))
  const setM = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setImp(f => ({ ...f, [k]: e.target.value }))

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

  const handleInvite = async () => {
    if (!invite.client_email || !invite.job_title) return
    setSending(true)
    const supabase = createClient()
    const { data: lead } = await supabase.from('tradie_leads').insert({
      tradie_id: profile?.tradie?.id,
      client_name: invite.client_name,
      client_email: invite.client_email,
      job_title: invite.job_title,
      job_description: invite.notes,
      trade_category: invite.trade_category,
      suburb: invite.suburb,
      source: 'direct_invite',
      status: 'invited',
    }).select().single()
    await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_email: invite.client_email,
        client_name: invite.client_name,
        tradie_name: profile?.tradie?.business_name,
        job_title: invite.job_title,
        message: invite.notes,
        lead_id: lead?.id,
      }),
    }).catch(() => {})
    setLeads(prev => [{ ...invite, id: lead?.id, source:'direct_invite', status:'invited', created_at: new Date().toISOString() }, ...prev])
    setSent(true)
    setSending(false)
    setInvite({ client_name:'', client_email:'', trade_category:'', suburb:'', job_title:'', notes:'' })
  }

  const handleImport = async () => {
    if (!imp.client_name || !imp.job_title) return
    setSending(true)
    const supabase = createClient()
    const { data: lead } = await supabase.from('tradie_leads').insert({
      tradie_id: profile?.tradie?.id,
      client_name: imp.client_name,
      client_email: imp.client_email || null,
      client_phone: imp.client_phone || null,
      job_title: imp.job_title,
      job_description: imp.job_description,
      trade_category: imp.trade_category,
      suburb: imp.suburb,
      address: imp.address,
      source: imp.source,
      existing_quote_amount: imp.existing_quote_amount ? parseFloat(imp.existing_quote_amount) : null,
      preferred_start: imp.preferred_start || null,
      internal_notes: imp.internal_notes,
      status: imp.invite_client && imp.client_email ? 'invited' : 'imported',
    }).select().single()

    if (imp.invite_client && imp.client_email) {
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_email: imp.client_email,
          client_name: imp.client_name,
          tradie_name: profile?.tradie?.business_name,
          job_title: imp.job_title,
          message: imp.job_description,
          lead_id: lead?.id,
        }),
      }).catch(() => {})
    }

    setLeads(prev => [{ ...imp, id: lead?.id, status: imp.invite_client && imp.client_email ? 'invited' : 'imported', created_at: new Date().toISOString() }, ...prev])
    setSent(true)
    setSending(false)
    setImp({ client_name:'', client_email:'', client_phone:'', address:'', suburb:'', trade_category:'', job_title:'', job_description:'', source:'simpro', existing_quote_amount:'', preferred_start:'', internal_notes:'', invite_client: true })
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }
  const lbl = { fontSize:'12px', fontWeight:500 as const, color:'#0A0A0A', display:'block' as const, marginBottom:'4px' }
  const statusColor: Record<string,string> = { invited:'#C07830', imported:'#2E6A8F', submitted:'#2E7D60', expired:'#7A9098' }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={true} backLabel="← Dashboard" backHref="/tradie/dashboard" />

      <div style={{ background:'#0A0A0A', padding:'28px 24px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'4px' }}>Lead management</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:'0 0 4px' }}>CLIENTS & LEADS</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Invite a new client to Steadyhand, or import an existing lead from your CRM, paper records or phone calls.</p>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'24px' }}>

        {/* Mode tabs */}
        <div style={{ display:'flex', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', overflow:'hidden', marginBottom:'20px' }}>
          {[
            { key:'invite', label:'✉️  Invite a client', sub:'Send them a Steadyhand invitation' },
            { key:'import', label:'📥  Import a lead', sub:'From Simpro, Tradify, paper or phone' },
          ].map(t => (
            <button key={t.key} type="button" onClick={() => { setMode(t.key as any); setSent(false) }}
              style={{ flex:1, padding:'14px 16px', border:'none', background: mode === t.key ? '#0A0A0A' : 'transparent', cursor:'pointer', textAlign:'left' as const, transition:'background 0.15s' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color: mode === t.key ? 'rgba(216,228,225,0.9)' : '#0A0A0A', margin:'0 0 2px' }}>{t.label}</p>
              <p style={{ fontSize:'11px', color: mode === t.key ? 'rgba(216,228,225,0.45)' : '#7A9098', margin:0 }}>{t.sub}</p>
            </button>
          ))}
        </div>

        {sent && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'10px', padding:'14px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'18px' }}>✓</span>
            <p style={{ fontSize:'13px', color:'#2E7D60', margin:0, fontWeight:500 }}>
              {mode === 'invite' ? 'Invitation sent — you will be notified when they respond.' : 'Lead imported successfully.'}
            </p>
          </div>
        )}

        {/* ── Invite mode ── */}
        {mode === 'invite' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'14px 20px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>INVITE A CLIENT</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Send a personalised invitation. When they respond, the job comes directly to you.</p>
            </div>
            <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'12px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div><label style={lbl}>Client name</label><input type="text" placeholder="Jane Smith" value={invite.client_name} onChange={setI('client_name')} style={inp} /></div>
                <div><label style={lbl}>Client email *</label><input type="email" placeholder="jane@example.com" value={invite.client_email} onChange={setI('client_email')} style={inp} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div><label style={lbl}>Trade category</label>
                  <select value={invite.trade_category} onChange={setI('trade_category')} style={inp}>
                    <option value="">Select trade</option>
                    {TRADES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Suburb</label><input type="text" placeholder="e.g. Subiaco" value={invite.suburb} onChange={setI('suburb')} style={inp} /></div>
              </div>
              <div><label style={lbl}>Job title (optional — helps them write a better request)</label><input type="text" placeholder="e.g. Kitchen renovation — Fremantle" value={invite.job_title} onChange={setI('job_title')} style={inp} /></div>
              <div><label style={lbl}>Personal note to client</label><textarea placeholder="e.g. Great to meet you on site last week — please use this link to submit the job details as we discussed." value={invite.notes} onChange={setI('notes')} style={{ ...inp, minHeight:'80px', resize:'vertical' as const }} /></div>
              <button type="button" onClick={handleInvite} disabled={sending || !invite.client_email}
                style={{ background: sending || !invite.client_email ? 'rgba(28,43,50,0.3)' : '#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                {sending ? 'Sending...' : 'Send invitation →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Import mode ── */}
        {mode === 'import' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ padding:'14px 20px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>IMPORT A LEAD</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Transfer a lead from your existing system into Steadyhand. All fields are stored privately against your account.</p>
            </div>
            <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>

              {/* Source */}
              <div>
                <label style={lbl}>Where is this lead coming from?</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
                  {SOURCES.map(s => (
                    <button key={s.value} type="button" onClick={() => setImp(f => ({ ...f, source: s.value }))}
                      style={{ padding:'7px 14px', borderRadius:'100px', border:'1.5px solid ' + (imp.source === s.value ? '#0A0A0A' : 'rgba(28,43,50,0.2)'), background: imp.source === s.value ? '#0A0A0A' : 'transparent', color: imp.source === s.value ? 'white' : '#4A5E64', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client details */}
              <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Client details</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                  <div><label style={lbl}>Client name *</label><input type="text" placeholder="Jane Smith" value={imp.client_name} onChange={setM('client_name')} style={inp} /></div>
                  <div><label style={lbl}>Phone</label><input type="tel" placeholder="04xx xxx xxx" value={imp.client_phone} onChange={setM('client_phone')} style={inp} /></div>
                </div>
                <div style={{ marginBottom:'12px' }}><label style={lbl}>Email (required to invite client)</label><input type="email" placeholder="jane@example.com" value={imp.client_email} onChange={setM('client_email')} style={inp} /></div>
                <div className='form-2col' style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
                  <div><label style={lbl}>Street address</label><input type="text" placeholder="123 Example St" value={imp.address} onChange={setM('address')} style={inp} /></div>
                  <div><label style={lbl}>Suburb</label><input type="text" placeholder="Fremantle" value={imp.suburb} onChange={setM('suburb')} style={inp} /></div>
                </div>
              </div>

              {/* Job details */}
              <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Job details</p>
                <div style={{ marginBottom:'12px' }}><label style={lbl}>Job title *</label><input type="text" placeholder="e.g. Bathroom retile — Cottesloe" value={imp.job_title} onChange={setM('job_title')} style={inp} /></div>
                <div className='form-2col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                  <div><label style={lbl}>Trade category</label>
                    <select value={imp.trade_category} onChange={setM('trade_category')} style={inp}>
                      <option value="">Select trade</option>
                      {TRADES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Preferred start date</label><input type="date" value={imp.preferred_start} onChange={setM('preferred_start')} style={inp} /></div>
                </div>
                <div style={{ marginBottom:'12px' }}><label style={lbl}>Job description / scope notes</label><textarea placeholder="Describe what was discussed — scope, inclusions, any special conditions..." value={imp.job_description} onChange={setM('job_description')} style={{ ...inp, minHeight:'90px', resize:'vertical' as const }} /></div>
                <div><label style={lbl}>Existing quote / price indication (optional)</label>
                  <div style={{ display:'flex', alignItems:'center', background:'#F4F8F7', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', overflow:'hidden' }}>
                    <span style={{ padding:'10px 12px', fontSize:'13px', color:'#7A9098', borderRight:'1px solid rgba(28,43,50,0.1)', background:'rgba(28,43,50,0.03)' }}>$</span>
                    <input type="number" placeholder="0" value={imp.existing_quote_amount} onChange={setM('existing_quote_amount')} style={{ flex:1, padding:'10px 12px', border:'none', background:'transparent', fontSize:'14px', color:'#0A0A0A', outline:'none' }} />
                  </div>
                </div>
              </div>

              {/* Internal notes */}
              <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:0 }}>Internal notes</p>
                  <span style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'100px', padding:'2px 8px' }}>🔒 Private</span>
                </div>
                <textarea placeholder="e.g. Met at trade show. Has used 3 tradies in last 12 months. Wants fixed-price quote. Budget around $15k. Good client, referred by Mark." value={imp.internal_notes} onChange={setM('internal_notes')} style={{ ...inp, minHeight:'80px', resize:'vertical' as const }} />
              </div>

              {/* Invite toggle */}
              {imp.client_email && (
                <div style={{ background:'rgba(212,82,42,0.05)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
                  <input type="checkbox" checked={imp.invite_client} onChange={e => setImp(f => ({ ...f, invite_client: e.target.checked }))} style={{ marginTop:'2px', width:'16px', height:'16px', flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 3px' }}>Also send client a Steadyhand invitation</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>
                      An email will be sent to <strong>{imp.client_email}</strong> inviting them to confirm the job on Steadyhand. They will be shown the job details you have entered. Uncheck to import privately without notifying them yet.
                    </p>
                  </div>
                </div>
              )}

              <button type="button" onClick={handleImport} disabled={sending || !imp.client_name || !imp.job_title}
                style={{ background: sending || !imp.client_name || !imp.job_title ? 'rgba(28,43,50,0.3)' : '#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                {sending ? 'Importing...' : imp.invite_client && imp.client_email ? 'Import lead & send invitation →' : 'Import lead →'}
              </button>
            </div>
          </div>
        )}

        {/* Lead history */}
        {leads.length > 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>LEAD HISTORY</p>
            </div>
            <div style={{ padding:'8px' }}>
              {leads.map((l: any) => {
                const src = SOURCES.find(s => s.value === l.source)
                return (
                  <div key={l.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:'8px', gap:'12px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
                      <span style={{ fontSize:'16px', flexShrink:0 }}>{src?.icon || '📌'}</span>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{l.client_name || l.client_email}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{l.job_title || 'No job title'} · {src?.label || l.source} · {new Date(l.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:(statusColor[l.status]||'#7A9098')+'18', border:'1px solid '+(statusColor[l.status]||'#7A9098')+'40', color:statusColor[l.status]||'#7A9098', fontWeight:500, flexShrink:0 }}>{l.status}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
