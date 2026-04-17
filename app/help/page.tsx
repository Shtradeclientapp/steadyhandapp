'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/ui/NavHeader'

const FAQS = [
  {
    category: 'Getting started',
    color: '#2E6A8F',
    items: [
      {
        q: 'How does Steadyhand work?',
        a: 'Steadyhand structures the relationship between a homeowner and a tradie through five stages: Consult → Quote → Agreement → Delivery → Warranty. Each stage creates a written record. Payments are held and released at milestones, and a warranty period begins after sign-off.',
      },
      {
        q: 'Who can use Steadyhand?',
        a: 'Homeowners post job requests and invite tradies to quote. Tradies receive verified jobs, submit quotes, and manage delivery. Organisations (property managers, body corporates) manage multiple properties. Each account type has a separate dashboard.',
      },
      {
        q: 'Is my information secure?',
        a: 'All data is stored in Supabase with row-level security — you can only access records tied to your account. Documents are stored in a private bucket and accessed via signed URLs that expire. Payments are handled by Stripe, which is PCI-DSS compliant.',
      },
    ],
  },
  {
    category: 'Consult stage',
    color: '#9B6B9B',
    items: [
      {
        q: 'What is the consult for?',
        a: 'The consult is a site visit where you and the tradie see the job together before any quote is submitted. Both parties write independent notes, then share and acknowledge them. This creates a tamper-proof record of what was discussed — protecting both parties if the scope is later disputed.',
      },
      {
        q: 'Can I edit my consult notes after sharing?',
        a: 'No. Once notes are shared, they are locked. This is intentional — the value of the consult record is that it reflects what was observed at the time, before quoting began. If something changes, it should be captured in the scope agreement.',
      },
      {
        q: 'What if we cannot agree on a consult time?',
        a: 'Use the job message thread to propose and confirm times. If the other party is unresponsive, contact Steadyhand via this help page and we can intervene.',
      },
    ],
  },
  {
    category: 'Quotes',
    color: '#C07830',
    items: [
      {
        q: 'How do I submit a quote?',
        a: 'Tradies access the quote builder from their job page. You can add line items, set a total, specify a start date and duration, and choose a quote style. The client is notified when you submit.',
      },
      {
        q: 'Can a client request changes to a quote?',
        a: 'Yes. Clients can request a revision from the quote page. The tradie is notified and can update and resubmit. There is no limit on revisions, but each revision clears any previous signatures on the scope.',
      },
      {
        q: 'What happens if my quote is declined?',
        a: 'You will be notified by email. The job remains in your dashboard history. Your Dialogue Rating reflects how you communicated throughout the process, regardless of outcome.',
      },
    ],
  },
  {
    category: 'Scope agreement',
    color: '#6B4FA8',
    items: [
      {
        q: 'Who drafts the scope agreement?',
        a: 'The tradie drafts the scope agreement first — they are in the best position to define what the work includes, excludes, and assumes. The client then reviews and can request changes before both parties sign.',
      },
      {
        q: 'Can the scope be changed after signing?',
        a: 'Not without both parties re-signing. Any edit to the scope clears all existing signatures and requires both parties to sign again. This protects both sides from unilateral changes.',
      },
      {
        q: 'What does signing the scope mean legally?',
        a: 'The signed scope is a written record of what was agreed. It is not a substitute for a formal contract reviewed by a lawyer, but it creates strong evidence of intent. We recommend having your own legal review for jobs over $50,000.',
      },
    ],
  },
  {
    category: 'Payments & milestones',
    color: '#2E7D60',
    items: [
      {
        q: 'How do milestone payments work?',
        a: 'The tradie sets milestones in the scope agreement (e.g. 30% on start, 40% on rough-in, 30% on completion). When a milestone is submitted, the client reviews it and can approve and pay, or approve and hold payment. Funds are released to the tradie via Stripe Connect.',
      },
      {
        q: 'What is "approve work, hold payment"?',
        a: 'This option lets you confirm the work is complete without releasing payment yet. Use it if more work is ongoing and you want to settle at the end, or if you need to raise a concern first. Payment stays held in Steadyhand — it is not released off-platform.',
      },
      {
        q: 'What if there is a dispute about a milestone?',
        a: 'Use the "Flag an issue" button on the delivery page. This opens a message thread with the other party. If you cannot resolve it, contact Steadyhand admin via this page and we will review the job record and intervene.',
      },
      {
        q: 'When does the tradie receive payment?',
        a: 'Stripe Connect typically transfers funds within 2 business days of approval. The tradie must have connected their bank account via the dashboard for payments to flow.',
      },
    ],
  },
  {
    category: 'Warranty',
    color: '#D4522A',
    items: [
      {
        q: 'How long is the warranty period?',
        a: 'The warranty period is set in the scope agreement. The default is 6 months from sign-off, but this can be adjusted in the scope. During the warranty period, the client can log issues directly through Steadyhand.',
      },
      {
        q: 'What happens when a warranty issue is raised?',
        a: 'The tradie is notified by email and has 5 business days to respond. Both parties communicate through the warranty thread. If the issue is not resolved, Steadyhand admin can be contacted to review.',
      },
      {
        q: 'Can a warranty issue affect the tradie\'s Dialogue Rating?',
        a: 'Yes. How a tradie responds to warranty issues — speed, transparency, resolution — contributes to their overall Dialogue Rating, which is visible to future clients.',
      },
    ],
  },
  {
    category: 'Account & subscription',
    color: '#7A9098',
    items: [
      {
        q: 'How do I connect my bank account as a tradie?',
        a: 'Go to your dashboard — the account status panel will show a "Connect bank account" option. This opens a Stripe Connect onboarding flow where you enter your BSB and account number. Milestone payments cannot be released until this is complete.',
      },
      {
        q: 'How do I cancel my subscription?',
        a: 'Go to your dashboard and click "Manage subscription" in the account status panel. This opens the Stripe billing portal where you can cancel or change your plan. Active jobs will continue until completion.',
      },
      {
        q: 'How do I connect Xero?',
        a: 'Go to the account status panel on your tradie dashboard and click "Connect Xero". You will be redirected to authorise the connection. Once connected, quotes and invoices sync automatically.',
      },
    ],
  },
]

export default function HelpPage() {
  const [profile, setProfile] = useState<any>(null)
  const [openItem, setOpenItem] = useState<string|null>(null)
  const [activeCategory, setActiveCategory] = useState<string|null>(null)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'general' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
    })
  }, [])

  const handleContact = async () => {
    if (!form.message.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile?.full_name || profile?.tradie?.business_name || 'Unknown user',
          email: profile?.email || 'No email',
          role: profile?.role || 'unknown',
          subject: form.subject || 'Help request',
          message: form.message,
          priority: form.priority,
        }),
      })
      if (res.ok) { setSent(true); setForm({ subject: '', message: '', priority: 'general' }) }
      else setError('Something went wrong. Please email support@steadyhandtrade.app directly.')
    } catch {
      setError('Something went wrong. Please email support@steadyhandtrade.app directly.')
    }
    setSending(false)
  }

  const filteredFAQs = activeCategory ? FAQS.filter(f => f.category === activeCategory) : FAQS
  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={profile?.role === 'tradie'} />

      {/* Hero */}
      <div style={{ background:'#0A0A0A', padding:'32px 24px' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'4px' }}>Support</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:'0 0 8px' }}>HELP & SUPPORT</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0, maxWidth:'520px', lineHeight:'1.7' }}>
            Answers to common questions about how Steadyhand works — and a direct line to our team when you need it.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', alignItems:'start' }}>

          {/* ── FAQ column ── */}
          <div style={{ gridColumn:'1 / -1' }}>

            {/* Category filter */}
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const, marginBottom:'20px' }}>
              <button type="button" onClick={() => setActiveCategory(null)}
                style={{ fontSize:'12px', padding:'5px 14px', borderRadius:'100px', border:'1px solid ' + (activeCategory === null ? '#0A0A0A' : 'rgba(28,43,50,0.2)'), background: activeCategory === null ? '#0A0A0A' : 'transparent', color: activeCategory === null ? 'white' : '#4A5E64', cursor:'pointer' }}>
                All topics
              </button>
              {FAQS.map(f => (
                <button key={f.category} type="button" onClick={() => setActiveCategory(activeCategory === f.category ? null : f.category)}
                  style={{ fontSize:'12px', padding:'5px 14px', borderRadius:'100px', border:'1px solid ' + (activeCategory === f.category ? f.color : 'rgba(28,43,50,0.2)'), background: activeCategory === f.category ? f.color + '15' : 'transparent', color: activeCategory === f.category ? f.color : '#4A5E64', cursor:'pointer' }}>
                  {f.category}
                </button>
              ))}
            </div>

            {/* FAQ items */}
            {filteredFAQs.map(section => (
              <div key={section.category} style={{ marginBottom:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <div style={{ width:'3px', height:'16px', background:section.color, borderRadius:'2px', flexShrink:0 }} />
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>{section.category.toUpperCase()}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px' }}>
                  {section.items.map((item, i) => {
                    const key = section.category + i
                    const isOpen = openItem === key
                    return (
                      <div key={key} style={{ background:'#E8F0EE', border:'1px solid ' + (isOpen ? section.color + '40' : 'rgba(28,43,50,0.1)'), borderRadius:'10px', overflow:'hidden' }}>
                        <button type="button" onClick={() => setOpenItem(isOpen ? null : key)}
                          style={{ width:'100%', padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' as const }}>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0, lineHeight:'1.4' }}>{item.q}</p>
                          <span style={{ fontSize:'16px', color:'#7A9098', flexShrink:0, transform: isOpen ? 'rotate(45deg)' : 'none', transition:'transform 0.2s' }}>+</span>
                        </button>
                        {isOpen && (
                          <div style={{ padding:'0 16px 14px', borderTop:'1px solid rgba(28,43,50,0.06)' }}>
                            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'12px 0 0' }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── Contact admin column ── */}
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ background:'#0A0A0A', padding:'18px 20px' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:'0 0 4px' }}>CONTACT STEADYHAND</p>
                <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:0 }}>Our team reviews every message and responds within one business day.</p>
              </div>
              <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'12px' }}>

                {/* Priority selector */}
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'6px' }}>Type of request</label>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const }}>
                    {[
                      { value:'general', label:'General question', color:'#7A9098' },
                      { value:'dispute', label:'Job dispute', color:'#D4522A' },
                      { value:'payment', label:'Payment issue', color:'#C07830' },
                      { value:'technical', label:'Technical error', color:'#2E6A8F' },
                      { value:'account', label:'Account issue', color:'#6B4FA8' },
                    ].map(p => (
                      <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                        style={{ fontSize:'12px', padding:'6px 14px', borderRadius:'100px', border:'1.5px solid ' + (form.priority === p.value ? p.color : 'rgba(28,43,50,0.2)'), background: form.priority === p.value ? p.color + '12' : 'transparent', color: form.priority === p.value ? p.color : '#4A5E64', cursor:'pointer', fontWeight: form.priority === p.value ? 600 : 400 }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief description of your issue" style={inp} />
                </div>

                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Describe what happened and what you need help with. Include any relevant job details."
                    rows={5} style={{ ...inp, resize:'vertical' as const }} />
                </div>

                {profile && (
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>
                    Sending as <strong>{profile.full_name || profile.tradie?.business_name}</strong> ({profile.email}) · {profile.role}
                  </p>
                )}

                {form.priority === 'dispute' && (
                  <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', padding:'12px 14px' }}>
                    <p style={{ fontSize:'12px', color:'#D4522A', margin:0, lineHeight:'1.6' }}>
                      <strong>Job disputes:</strong> Steadyhand can review the job record, consult notes, scope agreement and message history. We cannot force settlement, but we can intervene to ensure both parties have access to the written record and can facilitate resolution.
                    </p>
                  </div>
                )}

                {error && <p style={{ fontSize:'13px', color:'#D4522A', margin:0 }}>{error}</p>}

                {sent ? (
                  <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'8px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'18px' }}>✓</span>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#2E7D60', margin:'0 0 2px' }}>Message received</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>We will respond within one business day. Check your email for a confirmation.</p>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={handleContact} disabled={sending || !form.message.trim()}
                    style={{ background: sending || !form.message.trim() ? 'rgba(28,43,50,0.3)' : '#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                    {sending ? 'Sending...' : 'Send message to Steadyhand →'}
                  </button>
                )}

                <p style={{ fontSize:'11px', color:'#9AA5AA', margin:0, textAlign:'center' as const }}>
                  Or email us directly at <a href="mailto:support@steadyhandtrade.app" style={{ color:'#2E6A8F' }}>support@steadyhandtrade.app</a>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
