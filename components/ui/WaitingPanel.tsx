'use client'

interface WaitingPanelProps {
  role: 'tradie' | 'client'
  stage: 'match' | 'consult' | 'compare' | 'agreement' | 'delivery' | 'signoff' | 'warranty'
  otherPartyName?: string
  jobId?: string
  stats?: { label: string; value: string | number }[]
}

const MESSAGES = {
  tradie: {
    match: {
      heading: 'The client is reviewing their options',
      body: 'Your invitation is being processed. While you wait, make sure your profile is complete — business name, bio, trade categories and service areas. This is what the client is looking at right now.',
      reflection: "Tradies who win more work aren't necessarily cheaper — they're clearer. A well-written bio and accurate service areas signal professionalism before you've said a word.",
      cta: { label: 'Review your profile →', href: (_?: string) => '/tradie/profile' },
    },
    consult: {
      heading: 'Waiting for the client to acknowledge',
      body: 'You have shared your consult notes. The client will review and acknowledge them before quotes are requested. This is a good moment to prepare your quote draft.',
      reflection: 'Clients who receive well-structured consult notes — observations, concerns, proposed approach — are more likely to proceed. Notes are a selling tool, not just a record.',
      cta: { label: 'Review your profile →', href: (_?: string) => '/tradie/profile' },
    },
    agreement: {
      heading: 'Waiting for the client to sign',
      body: 'You have submitted the scope agreement. The client is reviewing the inclusions, milestones and warranty terms. You will be notified by email when they sign.',
      reflection: 'A scope agreement that mirrors exactly what was discussed in the consult builds trust. Any gaps between the consult record and the scope are the most common source of late disputes.',
      cta: undefined,
    },
    compare: {
      heading: 'The client is comparing quotes',
      body: 'Your quote has been received and is being reviewed. This is a good moment to check that everything you promised in your consult notes is reflected in your quote — clients notice alignment.',
      reflection: 'The best tradies treat the quote stage as a communication exercise, not just a pricing exercise. A clear breakdown of what\'s included — and what\'s not — reduces scope disputes later.',
      cta: { label: 'Review your quote →', href: (jobId?: string) => '/consult?job_id=' + jobId },
    },
    signoff: {
      heading: 'Waiting for client sign-off',
      body: "You've requested practical completion. The client is reviewing the finished work before signing off. Stay available for any final questions.",
      reflection: 'Sign-off disputes are almost always about expectations set at the scope stage. If everything was documented clearly in the agreement, this should be straightforward.',
      cta: undefined,
    },
  },
  client: {
    consult: {
      heading: 'Your tradie is completing their site assessment',
      body: "Both of you write independent notes from the site visit before sharing them. You'll be notified when their notes are ready to review and acknowledge.",
      reflection: 'The consult record is one of the most important documents in the job file. It creates a shared baseline — what was seen, said and agreed — before any money changes hands.',
      cta: undefined,
    },
    delivery: {
      heading: 'Work is underway',
      body: "Your tradie is delivering the agreed scope. You'll be asked to review and approve each milestone as it's completed. Payments release automatically when you approve.",
      reflection: 'If anything looks different from what was agreed in the scope, raise it now through the message thread — not at sign-off. Early communication prevents late disputes.',
      cta: { label: 'View scope agreement →', href: (jobId?: string) => '/agreement?job_id=' + jobId },
    },
    warranty: {
      heading: 'Your warranty period is active',
      body: 'The job is complete and your warranty is running. If you notice any defects or issues related to the work, raise them here and your tradie will be notified.',
      reflection: "A warranty isn't just protection — it's the final signal of a well-managed job. Both parties should have a complete paper trail from request to completion.",
      cta: undefined,
    },
  },
} as const

export function WaitingPanel({ role, stage, otherPartyName, jobId, stats }: WaitingPanelProps) {
  const msg = (MESSAGES[role] as any)[stage]
  if (!msg) return null

  return (
    <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderLeft:'3px solid #2E6A8F', borderRadius:'12px', padding:'24px 28px', marginBottom:'28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2E6A8F', flexShrink:0 }} />
        <p style={{ fontSize:'13px', fontWeight:600, color:'#2E6A8F', margin:0 }}>
          {otherPartyName ? otherPartyName + ' — ' : ''}{msg.heading}
        </p>
      </div>
      <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 14px' }}>{msg.body}</p>
      {msg.reflection && (
        <div style={{ background:'rgba(46,106,143,0.04)', borderRadius:'8px', padding:'12px 16px', marginBottom: msg.cta ? '16px' : 0 }}>
          <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.7', margin:0, fontStyle:'italic' }}>
            💡 {msg.reflection}
          </p>
        </div>
      )}
      {stats && stats.length > 0 && (
        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom: msg.cta ? '16px' : 0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background:'rgba(46,106,143,0.06)', borderRadius:'8px', padding:'8px 14px', minWidth:'80px' }}>
              <p style={{ fontSize:'18px', fontWeight:600, color:'#2E6A8F', margin:'0 0 2px' }}>{s.value}</p>
              <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {msg.cta && (
        <a href={msg.cta.href(jobId)} style={{ fontSize:'13px', color:'#2E6A8F', fontWeight:500, textDecoration:'none' }}>
          {msg.cta.label}
        </a>
      )}
    </div>
  )
}
