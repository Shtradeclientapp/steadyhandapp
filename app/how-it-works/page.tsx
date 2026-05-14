'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const DOCS = [
  {
    stage: 'Request', stageColor: '#185FA5', stageBg: 'rgba(46,106,143,0.1)',
    icon: '📋', title: 'Job record', sub: 'Created when the job is posted',
    fields: [
      { label: 'Trade category', value: 'e.g. Electrical' },
      { label: 'Suburb', value: 'e.g. Subiaco WA' },
      { label: 'Status', value: 'Tracks all stage changes' },
      { label: 'Created at', value: 'ISO timestamp' },
    ],
    why: 'The job record is the anchor for every subsequent document. Every quote, scope, milestone, payment, and warranty issue is linked to this record. In a dispute, it establishes what was requested, where, and when.'
  },
  {
    stage: 'Consult', stageColor: '#534AB7', stageBg: 'rgba(107,79,168,0.1)',
    icon: '📍', title: 'Site assessment', sub: 'Created by the tradie, shared with the client',
    fields: [
      { label: 'Access notes', value: 'Constraints observed on site' },
      { label: 'Scope observations', value: 'What the tradie found' },
      { label: 'Risk items', value: 'Flagged concerns' },
      { label: 'Photos', value: 'Timestamped site photos' },
    ],
    why: 'The site assessment records what both parties knew before work began. If a defect claim later hinges on "the tradie should have noticed that" — the assessment either confirms or refutes it. Downloadable as a timestamped PDF.'
  },
  {
    stage: 'Quote', stageColor: '#854F0B', stageBg: 'rgba(192,120,48,0.1)',
    icon: '💰', title: 'Quote record (all versions)', sub: 'Every revision preserved — not just the accepted version',
    fields: [
      { label: 'Line items', value: 'Description + amount each' },
      { label: 'Total price', value: 'Explicit figure' },
      { label: 'GST status', value: 'Included or excluded' },
      { label: 'Warranty period', value: 'Days, from quote' },
      { label: 'Version number', value: 'Auto-incremented' },
      { label: 'Conditions', value: 'Tradie-specified terms' },
    ],
    why: 'The accepted quote establishes the agreed price. All revisions are preserved — if a dispute arises about what was included in the original price, the revision history shows exactly what changed between versions and why.'
  },
  {
    stage: 'Agreement', stageColor: '#534AB7', stageBg: 'rgba(107,79,168,0.1)',
    icon: '✍️', title: 'Signed scope agreement', sub: 'The most legally significant document in the archive',
    fields: [
      { label: 'Inclusions', value: 'What is covered' },
      { label: 'Exclusions', value: 'What is explicitly not covered' },
      { label: 'Assumptions', value: 'Conditions relied upon' },
      { label: 'Milestone plan', value: 'Staged payment schedule' },
      { label: 'Warranty period', value: 'Contractual period (days)' },
      { label: 'Total price', value: 'Agreed at signing' },
    ],
    why: 'This is the document that determines who is right at a tribunal. It cites the Home Building Contracts Act 1991 (WA) and Home Building Act 1989 (NSW) directly. Without a signed scope agreement, a dispute is one person\'s word against another\'s.'
  },
  {
    stage: 'Agreement', stageColor: '#534AB7', stageBg: 'rgba(107,79,168,0.1)',
    icon: '🔒', title: 'Signing snapshot', sub: 'Party details captured at the moment of signing',
    fields: [
      { label: 'Tradie business name', value: 'At signing — not live profile' },
      { label: 'Licence number', value: 'At signing — not live profile' },
      { label: 'Client full name', value: 'At signing — not live profile' },
    ],
    why: 'The snapshot captures who signed, not who they are now. If a tradie later changes their business name or licence number, the document still reflects the party who actually signed. Permanent and unalterable after signing.'
  },
  {
    stage: 'Agreement', stageColor: '#534AB7', stageBg: 'rgba(107,79,168,0.1)',
    icon: '📜', title: 'Signature audit trail', sub: 'ETA-compliant signing record',
    fields: [
      { label: 'Email', value: 'Signer email address' },
      { label: 'IP address', value: 'At time of signing' },
      { label: 'Timestamp', value: 'AWST, ISO format' },
      { label: 'User agent', value: 'Browser / device string' },
      { label: 'Event type', value: 'Client signed / tradie signed' },
    ],
    why: 'Electronic signatures are legally valid under the Electronic Transactions Act 1999 (Cth) when the signatory\'s identity can be reliably established. The IP address, timestamp, and user agent together satisfy this requirement. The audit trail is append-only.'
  },
  {
    stage: 'Delivery', stageColor: '#854F0B', stageBg: 'rgba(192,120,48,0.1)',
    icon: '📸', title: 'Milestone records', sub: 'One record per milestone, with photo evidence',
    fields: [
      { label: 'Milestone label', value: 'As per scope agreement' },
      { label: 'Photo evidence', value: 'Uploaded by tradie' },
      { label: 'Completed at', value: 'Timestamp' },
      { label: 'Approved at', value: 'Client approval timestamp' },
      { label: 'Payment held', value: 'Stripe payment intent ID' },
    ],
    why: 'Milestone records answer the question "was the work actually done?". The client approval timestamp means there\'s a record of when the client confirmed the work was satisfactory at each stage — not just at the end.'
  },
  {
    stage: 'Delivery', stageColor: '#854F0B', stageBg: 'rgba(192,120,48,0.1)',
    icon: '↔️', title: 'Variation log', sub: 'Every scope change, written and approved',
    fields: [
      { label: 'Title', value: 'What changed' },
      { label: 'Cost impact', value: '$, approved into final total' },
      { label: 'Time impact', value: 'Additional days' },
      { label: 'Status', value: 'Approved / rejected' },
      { label: 'Client response', value: 'Written note if provided' },
    ],
    why: 'Every variation is requested in writing, responded to in writing, and either approved — with cost added to the payment total — or rejected, with a permanent record either way. No undocumented cost increases.'
  },
  {
    stage: 'Payment', stageColor: '#993C1D', stageBg: 'rgba(212,82,42,0.1)',
    icon: '💳', title: 'Payment audit trail', sub: 'Every payment event with Stripe event IDs',
    fields: [
      { label: 'Stripe event ID', value: 'Idempotency key' },
      { label: 'Amount', value: 'Quote + variations + GST' },
      { label: 'Platform fee', value: '3.5% (0% founding member)' },
      { label: 'Transfer ID', value: 'To tradie bank account' },
      { label: 'Paid at', value: 'Timestamp of transfer' },
    ],
    why: 'The payment trail shows exactly when money moved, how much, to whom, and under which Stripe event. Idempotent processing means the same payment cannot be triggered twice.'
  },
  {
    stage: 'Sign-off', stageColor: '#993C1D', stageBg: 'rgba(212,82,42,0.1)',
    icon: '⭐', title: 'Sign-off record', sub: 'Formal completion — starts the warranty period',
    fields: [
      { label: 'Signed off at', value: 'Timestamp' },
      { label: 'Star rating', value: '1–5, feeds Dialogue Rating' },
      { label: 'Warranty start', value: 'Derived from sign-off date' },
      { label: 'Warranty expiry', value: 'Contractual period end date' },
    ],
    why: 'Sign-off is the formal dividing line between "in progress" and "complete". The warranty period starts here — from the date the client confirmed satisfaction. The star rating feeds the tradie\'s Dialogue Rating and is a permanent part of the record.'
  },
  {
    stage: 'Warranty', stageColor: '#0F6E56', stageBg: 'rgba(46,125,96,0.1)',
    icon: '🛡', title: 'Warranty certificate', sub: 'Statutory rights made visible and actionable',
    fields: [
      { label: 'Issue date', value: 'Sign-off date' },
      { label: 'Expiry date', value: 'Contractual end' },
      { label: 'Days remaining', value: 'Live countdown' },
      { label: 'Statutory minimum (WA)', value: '6yr structural / 1yr other' },
      { label: 'Statutory minimum (NSW)', value: '6yr structural / 2yr other' },
      { label: 'Legislation cited', value: 'HBC Act 1991 / HB Act 1989' },
    ],
    why: 'Your contractual warranty period is what the tradie has agreed to. Your statutory rights under the Home Building Contracts Act 1991 (WA) run for 6 years for structural defects regardless — the contract cannot reduce them. The certificate makes both visible.'
  },
  {
    stage: 'Warranty', stageColor: '#0F6E56', stageBg: 'rgba(46,125,96,0.1)',
    icon: '📋', title: 'Issues log', sub: 'Timestamped record of every warranty claim',
    fields: [
      { label: 'Issue title', value: 'Reported by client' },
      { label: 'Severity', value: 'Low / medium / high' },
      { label: 'Logged at', value: 'Timestamp' },
      { label: 'Response due', value: '5 business days' },
      { label: 'Tradie response', value: 'Written' },
      { label: 'Resolution status', value: 'Open / resolved / escalated' },
    ],
    why: 'Every issue is timestamped when logged, has a visible response deadline, and preserves the tradie\'s written response. Auto-escalated and auto-closed issues are both flagged — nothing is lost from the record.'
  },
]

export default function HowItWorksPage() {
  const [profile, setProfile] = useState<any>(null)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(data)
    })
  }, [])

  const dashHref = profile?.role === 'tradie' ? '/tradie/dashboard' : profile?.org_id ? '/org/dashboard' : '/dashboard'
  const toggle = (i: number) => setOpen(open === i ? null : i)

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>

      {/* Nav */}
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', textDecoration: 'none' }}>STEADYHAND</Link>
        <div style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: '#0A0A0A', letterSpacing: '1px' }}>THE LEGAL RECORD</div>
        {profile ? (
          <Link href={dashHref} style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Dashboard</Link>
        ) : (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>Log in</Link>
            <Link href="/signup" style={{ background: '#D4522A', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>Get started</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{ background: '#0A0A0A', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '11px', color: 'rgba(216,228,225,0.4)', letterSpacing: '2px', marginBottom: '16px' }}>STEADYHAND</p>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: 'rgba(216,228,225,0.9)', letterSpacing: '1px', marginBottom: '16px', lineHeight: 1.3 }}>The legal record</h1>
          <p style={{ fontSize: '15px', color: 'rgba(216,228,225,0.5)', lineHeight: '1.75', maxWidth: '560px', marginBottom: '28px' }}>
            Every Steadyhand job builds a compliance archive automatically — one document at a time, as the job moves forward. No manual paperwork. Each document is timestamped, tamper-evident, and admissible at SAT, NCAT, and VCAT.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {['Electronic Transactions Act 1999', 'Home Building Contracts Act 1991 (WA)', 'Home Building Act 1989 (NSW)'].map(l => (
              <span key={l} style={{ fontSize: '11px', color: 'rgba(216,228,225,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px', padding: '4px 12px' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 64px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#7A9098', marginBottom: '20px' }}>12 documents — click any to expand</p>

        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '1px', background: 'rgba(28,43,50,0.12)' }} />

          {DOCS.map((doc, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: '6px', cursor: 'pointer' }} onClick={() => toggle(i)}>
              <div style={{ position: 'absolute', left: '-26px', top: '14px', width: '10px', height: '10px', borderRadius: '50%', background: open === i ? doc.stageColor : 'rgba(28,43,50,0.2)', border: '2px solid #C8D5D2', transition: 'background 0.15s' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: open === i ? '10px 10px 0 0' : '10px', border: `0.5px solid ${open === i ? 'rgba(28,43,50,0.2)' : 'rgba(28,43,50,0.1)'}`, background: open === i ? 'white' : '#E8F0EE', transition: 'all 0.15s' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: doc.stageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{doc.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A', marginBottom: '1px' }}>{doc.title}</div>
                  <div style={{ fontSize: '11px', color: '#7A9098' }}>{doc.sub}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '100px', background: doc.stageBg, color: doc.stageColor, flexShrink: 0 }}>{doc.stage}</span>
                <span style={{ fontSize: '13px', color: '#9AA5AA', transition: 'transform 0.2s', transform: open === i ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>↓</span>
              </div>
              {open === i && (
                <div style={{ padding: '16px', border: '0.5px solid rgba(28,43,50,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px', background: '#F4F8F7' }}>
                  <p style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#7A9098', marginBottom: '10px' }}>What it captures</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    {doc.fields.map((f, fi) => (
                      <div key={fi} style={{ background: 'white', borderRadius: '8px', padding: '8px 10px', border: '0.5px solid rgba(28,43,50,0.1)' }}>
                        <div style={{ fontSize: '10px', color: '#9AA5AA', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '2px' }}>{f.label}</div>
                        <div style={{ fontSize: '12px', color: '#0A0A0A', fontWeight: 500 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderLeft: `3px solid ${doc.stageColor}`, borderRadius: '0 8px 8px 0', background: 'white', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: doc.stageColor, marginBottom: '5px' }}>Why it matters</p>
                    <p style={{ fontSize: '12px', color: '#4A5E64', lineHeight: '1.65', margin: 0 }}>{doc.why}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: '40px', background: '#0A0A0A', borderRadius: '14px', padding: '28px', textAlign: 'center' as const }}>
          <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '13px', color: 'rgba(216,228,225,0.4)', letterSpacing: '1px', marginBottom: '12px' }}>STEADYHAND</p>
          <p style={{ fontSize: '15px', color: 'rgba(216,228,225,0.75)', lineHeight: '1.7', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px' }}>
            Every document is generated from the live job data — always reflecting the actual signed record. The archive is your permanent copy.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {!profile && (
              <>
                <Link href="/signup" style={{ background: '#D4522A', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Get started →</Link>
                <Link href="/trust" style={{ background: 'transparent', color: 'rgba(216,228,225,0.6)', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>Read about trust →</Link>
              </>
            )}
            {profile && (
              <Link href={dashHref} style={{ background: '#D4522A', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Go to your dashboard →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
