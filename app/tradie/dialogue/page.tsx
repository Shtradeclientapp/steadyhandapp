"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const DIMENSION_LABELS: Record<string,string> = {
  pricing_transparency: 'Pricing transparency',
  compliance: 'Compliance',
  risk_communication: 'Risk communication',
  timeline_clarity: 'Timeline clarity',
  professionalism: 'Professionalism',
  scope_clarity: 'Scope clarity',
}

function scoreColor(s: number) {
  if (s >= 75) return '#2E7D60'
  if (s >= 50) return '#C07830'
  return '#D4522A'
}

export default function DialogueHistory() {
  const [tradie, setTradie] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [expanded, setExpanded] = useState<number|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles!tradie_profiles_id_fkey(*)').eq('id', session.user.id).single()
      setTradie(prof?.tradie)
      const hist = Array.isArray(prof?.tradie?.dialogue_score_history) ? prof.tradie.dialogue_score_history : []
      setHistory([...hist].reverse())
      setLoading(false)
    })
  }, [])

  const avg = tradie?.dialogue_score_avg || 0
  const color = scoreColor(avg)

  if (loading) return <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'rgba(216,228,225,0.4)', fontSize:'14px' }}>Loading...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', fontFamily:'sans-serif' }}>
      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px' }}>
        <a href="/tradie/dashboard" style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', textDecoration:'none', display:'block', marginBottom:'24px' }}>← Dashboard</a>
        <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.35)', marginBottom:'6px' }}>Communication quality</p>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'24px' }}>DIALOGUE RATING</h1>

        {/* Score summary */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'24px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', border:'3px solid ' + color, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color, lineHeight:1 }}>{avg || '—'}</span>
            <span style={{ fontSize:'9px', color:'rgba(216,228,225,0.4)', marginTop:'2px' }}>/ 100</span>
          </div>
          <div>
            <p style={{ fontSize:'15px', fontWeight:500, color:'rgba(216,228,225,0.9)', margin:'0 0 4px' }}>
              {avg >= 80 ? 'Excellent communicator' : avg >= 60 ? 'Good communicator' : avg >= 40 ? 'Room to improve' : 'Getting started'}
            </p>
            <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:'0 0 8px' }}>Based on {history.length} scored stage{history.length !== 1 ? 's' : ''} across your jobs</p>
            <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', margin:'0 0 16px', lineHeight:1.5 }}>Your Dialogue Rating reflects how clearly and transparently you communicate with clients — on pricing, risk, timeline and scope. It improves with every job.</p>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'14px 16px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'rgba(216,228,225,0.5)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 10px' }}>How to improve your score</p>
              {[
                { stage: 'Consult', tip: 'Write detailed site assessment notes and share them with the client before submitting your quote. Cover access constraints, risk items, and any scope clarifications.' },
                { stage: 'Agreement', tip: 'Complete all four DialogueGuide dimensions before signing. Be specific about inclusions, exclusions, and assumptions. Clients who feel heard give higher scores.' },
                { stage: 'Delivery', tip: 'Upload photo evidence at each milestone before marking it complete. Add a brief note describing what was done. Proactive communication prevents disputes.' },
                { stage: 'Warranty', tip: 'Respond to warranty issues within 2 business days — before the 5-day deadline. A fast, clear response dramatically improves your protect stage score.' },
              ].map(({ stage, tip }) => (
                <div key={stage} style={{ display:'flex', gap:'10px', marginBottom:'8px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(216,228,225,0.5)', background:'rgba(255,255,255,0.06)', borderRadius:'4px', padding:'2px 6px', flexShrink:0, marginTop:'1px', textTransform:'uppercase' as const }}>{stage}</span>
                  <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', lineHeight:'1.55', margin:0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension averages */}
        {history.length > 0 && (() => {
          const dimKeys = Object.keys(DIMENSION_LABELS)
          const dimAvgs: Record<string,number> = {}
          dimKeys.forEach(k => {
            const vals = history.map((h: any) => h.dimensions?.[k]?.score).filter((v: any) => v != null)
            dimAvgs[k] = vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length * 10) / 10 : 0
          })
          return (
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px', marginBottom:'20px' }}>
              <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'rgba(216,228,225,0.35)', marginBottom:'16px' }}>Dimension averages</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {dimKeys.map(k => {
                  const val = dimAvgs[k]
                  const c = val >= 4 ? '#2E7D60' : val >= 3 ? '#C07830' : '#D4522A'
                  return (
                    <div key={k}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.7)' }}>{DIMENSION_LABELS[k]}</span>
                        <span style={{ fontSize:'12px', color:c, fontWeight:500 }}>{val}/5</span>
                      </div>
                      <div style={{ height:'4px', background:'rgba(255,255,255,0.08)', borderRadius:'2px' }}>
                        <div style={{ height:'100%', background:c, width:(val/5*100)+'%', borderRadius:'2px', transition:'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* History list */}
        <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'rgba(216,228,225,0.35)', marginBottom:'12px' }}>Score history</p>

        {history.length === 0 && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
            <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.4)', margin:0 }}>No scores yet — your Dialogue Rating builds as you complete job stages.</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {history.map((h: any, i: number) => {
            const c = scoreColor(h.score)
            const isOpen = expanded === i
            return (
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', overflow:'hidden' }}>
                <button type="button" onClick={() => setExpanded(isOpen ? null : i)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', gap:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1 }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'2px solid '+c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'13px', color:c, fontWeight:600 }}>{h.score}</span>
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.85)', margin:'0 0 2px', fontWeight:500, textTransform:'capitalize' }}>{h.stage} stage</p>
                      <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:0 }}>{new Date(h.scored_at).toLocaleDateString('en-AU')}</p>
                    </div>
                  </div>
                  <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)' }}>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && h.dimensions && (
                  <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px', paddingTop:'14px' }}>
                      {Object.entries(DIMENSION_LABELS).map(([k, lbl]) => {
                        const dim = h.dimensions[k]
                        if (!dim) return null
                        const dc = dim.score >= 4 ? '#2E7D60' : dim.score >= 3 ? '#C07830' : '#D4522A'
                        return (
                          <div key={k}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                              <span style={{ fontSize:'12px', color:'rgba(216,228,225,0.6)' }}>{lbl}</span>
                              <span style={{ fontSize:'12px', color:dc, fontWeight:500 }}>{dim.score}/5</span>
                            </div>
                            <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', marginBottom:'3px' }}>
                              <div style={{ height:'100%', background:dc, width:(dim.score/5*100)+'%', borderRadius:'2px' }} />
                            </div>
                            {dim.summary && <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:0 }}>{dim.summary}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
