'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGE_INFO = [
  {
    stage: 'request',
    label: 'Request',
    weight: 5,
    color: '#2E7D60',
    description: 'How clearly you describe your job affects how well tradies can quote. A complete request leads to more accurate quotes and fewer surprises.',
    tips: [
      'Write a detailed description — more than 150 characters scores higher',
      'Include your budget range',
      'Specify your property type and preferred start date',
      'Describe any access or site conditions upfront',
    ],
  },
  {
    stage: 'assess',
    label: 'Assess',
    weight: 25,
    color: '#9B6B9B',
    description: 'The site assessment exchange is the most important trust moment. Both parties documenting and sharing their notes before quoting begins builds a strong foundation.',
    tips: [
      'Complete all five assessment prompts thoroughly',
      'Share your notes within 24 hours of the site visit',
      'Acknowledge the tradie\'s notes promptly',
      'Be specific about your expectations before quoting begins',
    ],
  },
  {
    stage: 'quote',
    label: 'Quote',
    weight: 15,
    color: '#C07830',
    description: 'How you engage with quotes matters. Declining with specific feedback helps tradies improve and contributes to a healthier trades market.',
    tips: [
      'Review all quotes thoroughly before deciding',
      'When declining, select a specific reason',
      'Add written feedback when declining — even a sentence helps',
      'Respond to quotes within 48 hours where possible',
    ],
  },
  {
    stage: 'confirm',
    label: 'Confirm',
    weight: 20,
    color: '#6B4FA8',
    description: 'A well-negotiated scope protects both parties. Taking time to review and discuss the scope before signing demonstrates good faith.',
    tips: [
      'Read the full scope before signing',
      'Use the message thread to discuss any questions',
      'Don\'t rush — a scope signed too quickly may miss important details',
      'Make sure inclusions and exclusions match what was discussed',
    ],
  },
  {
    stage: 'build',
    label: 'Build',
    weight: 15,
    color: '#C07830',
    description: 'How quickly you respond to milestone submissions affects your score. Prompt approvals keep the job moving and show respect for the tradie\'s work.',
    tips: [
      'Approve milestones within 24 hours where possible',
      'If you have questions about a milestone, use messages',
      'Don\'t withhold approval without communicating why',
    ],
  },
  {
    stage: 'complete',
    label: 'Complete',
    weight: 10,
    color: '#D4522A',
    description: 'A thoughtful sign-off and written review helps tradies improve and builds the evidence base for the Steadyhand platform.',
    tips: [
      'Complete the sign-off checklist item by item',
      'Write a review — even a short paragraph is valuable',
      'Be honest — both positive and constructive feedback helps',
    ],
  },
  {
    stage: 'protect',
    label: 'Protect',
    weight: 5,
    color: '#1A6B5A',
    description: 'How warranty issues are handled reflects on both parties. Accepting a genuine resolution promptly contributes positively to your score.',
    tips: [
      'Log warranty issues with clear descriptions',
      'Respond to tradie responses promptly',
      'Accept genuine resolutions — escalate only when necessary',
    ],
  },
]

export default function TrustPage() {
  const [profile, setProfile] = useState<any>(null)
  const [tradie, setTradie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isTradie, setIsTradie] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles!tradie_profiles_id_fkey(*)').eq('id', session.user.id).single()
      setProfile(prof)
      setIsTradie(prof?.role === 'tradie')
      if (prof?.role === 'tradie') setTradie(prof.tradie)
      setLoading(false)
    })
  }, [])

  const score = isTradie ? tradie?.trust_score_composite : profile?.client_trust_score
  const breakdown = isTradie ? tradie?.trust_score_breakdown : profile?.client_trust_breakdown

  const getScoreColor = (s: number) => s >= 70 ? '#2E7D60' : s >= 40 ? '#C07830' : '#D4522A'
  const getScoreBand = (s: number) => {
    if (s >= 85) return { label: 'Excellent', message: 'You consistently communicate with clarity and respect throughout the trade relationship.' }
    if (s >= 70) return { label: 'Good', message: 'You engage well with the process. A few areas where more thoroughness would help.' }
    if (s >= 50) return { label: 'Developing', message: 'You\'re building good habits. Focus on the assessment and confirm stages for the biggest improvement.' }
    return { label: 'Early', message: 'Complete more jobs on Steadyhand to build your Dialogue Rating.' }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64' }}>Loading...</p>
    </div>
  )

  const band = score ? getScoreBand(score) : null

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false}   />

      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'32px 24px' }}>

        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1.5px', marginBottom:'6px' }}>TRUST SCORE</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:300, marginBottom:'32px', lineHeight:'1.6' }}>
          Your Dialogue Rating reflects the quality of your communication across the full request-to-warranty cycle. It is built from behavioural signals at each stage — not self-assessment.
        </p>

        {/* SCORE CARD */}
        {score ? (
          <div style={{ background:'#0A0A0A', borderRadius:'16px', padding:'28px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 50%, rgba(107,79,168,0.2), transparent 60%)' }} />
            <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:'24px', flexWrap:'wrap' as const }}>
              <div>
                <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:'4px' }}>Trust score</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'56px', color:getScoreColor(score), margin:0, lineHeight:1 }}>{Number(score).toFixed(0)}</p>
                  <p style={{ fontSize:'18px', color:'rgba(216,228,225,0.4)', margin:0 }}>/100</p>
                </div>
              </div>
              {band && (
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'18px', fontWeight:600, color:'rgba(216,228,225,0.9)', marginBottom:'6px' }}>{band.label}</p>
                  <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', lineHeight:'1.6', margin:0 }}>{band.message}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'32px', textAlign:'center' as const, marginBottom:'24px' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.4 }}>📊</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No score yet</p>
            <p style={{ fontSize:'13px', color:'#7A9098' }}>Complete your first job on Steadyhand to start building your Dialogue Rating.</p>
          </div>
        )}

        {/* STAGE BREAKDOWN */}
        {breakdown && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'24px' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#0A0A0A' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>SCORE BY STAGE</p>
            </div>
            <div style={{ padding:'20px', display:'flex', flexDirection:'column' as const, gap:'12px' }}>
              {STAGE_INFO.map(info => {
                const stageScore = breakdown[info.stage]
                if (stageScore === undefined) return null
                return (
                  <div key={info.stage}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:info.color, flexShrink:0 }} />
                        <span style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A' }}>{info.label}</span>
                        <span style={{ fontSize:'11px', color:'#7A9098' }}>{info.weight}% weight</span>
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:600, color:getScoreColor(stageScore) }}>{stageScore}/100</span>
                    </div>
                    <div style={{ height:'6px', background:'rgba(28,43,50,0.1)', borderRadius:'100px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:stageScore + '%', background:getScoreColor(stageScore), borderRadius:'100px', transition:'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* HOW TO IMPROVE */}
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'16px' }}>HOW YOUR SCORE IS BUILT</h2>
        <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
          {STAGE_INFO.map(info => (
            <div key={info.stage} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:info.color, flexShrink:0 }} />
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.3px', margin:0 }}>{info.label.toUpperCase()} — {info.weight}%</p>
              </div>
              <div style={{ padding:'14px 18px' }}>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'10px' }}>{info.description}</p>
                <ul style={{ margin:0, paddingLeft:'16px' }}>
                  {info.tips.map((tip, i) => (
                    <li key={i} style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'4px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:'24px', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px 20px' }}>
          <p style={{ fontSize:'13px', color:'#7A9098', lineHeight:'1.6', margin:0 }}>
            Your Dialogue Rating is calculated automatically from your behaviour across each stage. It is never based on self-assessment. Scores improve over multiple completed jobs as Steadyhand builds a richer picture of how you engage in trade relationships.
          </p>
        </div>

      </div>
    </div>
  )
}
