'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const QUESTIONS = [
  {
    num: 1,
    dimension: 'Pricing Transparency',
    color: '#2E7D60',
    posed_to: 'tradie',
    question: 'Please explain how you arrived at your quoted price, including any materials, labour and GST considerations.',
    placeholder: 'e.g. Labour: $1,200 (2 days @ $600/day), Materials: $800 (itemised in quote breakdown), GST: $200. Total: $2,200 inc GST.',
    client_prompt: 'Does this pricing explanation make sense to you? Do you have any questions about the breakdown?',
    client_placeholder: 'e.g. Thanks — happy with the breakdown. Can you confirm the door hardware is included in the materials cost?',
  },
  {
    num: 2,
    dimension: 'Scope Clarity',
    color: '#2E6A8F',
    posed_to: 'both',
    question: 'Are there any items you expected to be included or excluded that are not reflected in the current scope? Please confirm or raise them now.',
    placeholder: 'e.g. I want to confirm that removal of the old door and disposal of waste is included, and that painting of the surrounding wall is excluded.',
    client_prompt: 'From your side — are there any scope items you expected to see that are missing?',
    client_placeholder: 'e.g. I expected the door frame to be included if it needs repair. Can we clarify that?',
  },
  {
    num: 3,
    dimension: 'Compliance & Standards',
    color: '#6B4FA8',
    posed_to: 'tradie',
    question: 'What permits, licences or Australian Standards apply to this job, and how will you ensure compliance?',
    placeholder: 'e.g. This job requires a licensed carpenter (Lic #12345). No building permit required for a like-for-like door replacement. Work will comply with AS 1905.1 for fire-rated doors if applicable.',
    client_prompt: 'Are you satisfied with the compliance information provided?',
    client_placeholder: 'e.g. Yes, happy with that. Please bring your licence documentation on the day.',
  },
  {
    num: 4,
    dimension: 'Risk & Difficulty',
    color: '#C07830',
    posed_to: 'tradie',
    question: 'Are there any site conditions, access issues or material uncertainties that could affect the timeline or price?',
    placeholder: 'e.g. I will need to inspect the door frame on arrival. If structural damage is found beyond what was described, I will issue a variation before proceeding. Access via side gate — please ensure it is unlocked.',
    client_prompt: 'Are you aware of any site conditions we should flag before work begins?',
    client_placeholder: 'e.g. The side gate will be open. There is a step down to the door area — about 20cm. Let me know if that affects anything.',
  },
  {
    num: 5,
    dimension: 'Timeline & Expectations',
    color: '#D4522A',
    posed_to: 'both',
    question: 'Confirm your expected start date and duration. What factors might cause a delay, and how would you communicate this?',
    placeholder: 'e.g. I plan to start on 15 April and expect to complete in one day. If materials are delayed I will notify you at least 48 hours in advance via the Steadyhand message thread.',
    client_prompt: 'Does that timeline work for you? Are there any dates that do not work?',
    client_placeholder: 'e.g. 15 April works. I will be home all day. Please let me know if you are running more than 30 minutes late.',
  },
  {
    num: 6,
    dimension: 'Post-job & Warranty',
    color: '#1A6B5A',
    posed_to: 'tradie',
    question: 'If a defect is identified after completion, what is your process for rectification within the warranty period?',
    placeholder: 'e.g. I offer a 90-day warranty on all workmanship. If you identify a defect, log it via Steadyhand and I will respond within 5 business days to arrange a return visit at no charge. Material defects are subject to manufacturer warranty.',
    client_prompt: 'Are you satisfied with the warranty and rectification process described?',
    client_placeholder: 'e.g. Yes, that sounds fair. I will log any issues through the app as discussed.',
  },
]

export function DialogueGuide({
  jobId,
  userRole,
  userId,
  onComplete,
}: {
  jobId: string
  userRole: string
  userId: string
  onComplete: () => void
}) {
  const [responses, setResponses] = useState<any[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [tradieText, setTradieText] = useState('')
  const [clientText, setClientText] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('dialogue_responses').select('*').eq('job_id', jobId).order('question_num', { ascending: true }).then(({ data }) => {
      setResponses(data || [])
      const firstIncomplete = (data || []).findIndex(r => !r.completed)
      if (firstIncomplete >= 0) setCurrentQ(firstIncomplete)
      else if ((data || []).length < QUESTIONS.length) setCurrentQ((data || []).length)
      setLoading(false)
    })
  }, [jobId])

  const getResponse = (num: number) => responses.find(r => r.question_num === num)
  const completedCount = responses.filter(r => r.completed).length
  const allComplete = completedCount === QUESTIONS.length

  const saveResponse = async (qNum: number, field: 'tradie_response' | 'client_response') => {
    if (!tradieText && field === 'tradie_response') return
    if (!clientText && field === 'client_response') return
    setSaving(true)
    const supabase = createClient()
    const q = QUESTIONS[qNum]
    const existing = getResponse(q.num)
    const updates: any = {
      job_id: jobId,
      question_num: q.num,
      question: q.question,
      posed_to: q.posed_to,
      updated_at: new Date().toISOString(),
    }
    if (field === 'tradie_response') updates.tradie_response = tradieText
    if (field === 'client_response') updates.client_response = clientText
    const tradieResp = field === 'tradie_response' ? tradieText : existing?.tradie_response
    const clientResp = field === 'client_response' ? clientText : existing?.client_response
    updates.completed = !!(tradieResp && clientResp)
    const { data } = await supabase.from('dialogue_responses').upsert(updates, { onConflict: 'job_id,question_num' }).select().single()
    if (data) {
      setResponses(prev => {
        const idx = prev.findIndex(r => r.question_num === q.num)
        if (idx >= 0) { const updated = [...prev]; updated[idx] = data; return updated }
        return [...prev, data]
      })
      if (updates.completed && qNum < QUESTIONS.length - 1) {
        setCurrentQ(qNum + 1)
        setTradieText('')
        setClientText('')
      }
      if (updates.completed && qNum === QUESTIONS.length - 1) onComplete()
    }
    setSaving(false)
  }

  const isTradie = userRole === 'tradie'

  if (loading) return null

  return (
    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom: expanded ? '1px solid rgba(28,43,50,0.08)' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'16px' }}>🤝</span>
          <div>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'2px' }}>PRE-SIGNING DIALOGUE</p>
            <p style={{ fontSize:'12px', color:'#7A9098' }}>{completedCount}/{QUESTIONS.length} questions completed</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {allComplete && <span style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500 }}>✓ Complete</span>}
          {!allComplete && <span style={{ fontSize:'12px', color:'#C07830', fontWeight:500 }}>In progress</span>}
          <span style={{ fontSize:'12px', color:'#7A9098' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:'4px', marginBottom:'20px' }}>
            {QUESTIONS.map((q, i) => {
              const resp = getResponse(q.num)
              const isActive = i === currentQ
              const isDone = resp?.completed
              return (
                <div key={q.num} onClick={() => setCurrentQ(i)} style={{ flex:1, height:'4px', borderRadius:'2px', background: isDone ? q.color : isActive ? q.color + '60' : 'rgba(28,43,50,0.1)', cursor:'pointer', transition:'all 0.2s' }} />
              )
            })}
          </div>

          {QUESTIONS.map((q, i) => {
            if (i !== currentQ) return null
            const resp = getResponse(q.num)
            const isDone = resp?.completed
            const canAnswerTradie = !isTradie === false || isTradie
            const canAnswerClient = isTradie === false

            return (
              <div key={q.num}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                  <div style={{ width:'24px', height:'24px', borderRadius:'50%', background: q.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'white', flexShrink:0 }}>{q.num}</div>
                  <div>
                    <span style={{ fontSize:'11px', fontWeight:600, color: q.color, textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{q.dimension}</span>
                    {q.posed_to === 'tradie' && <span style={{ fontSize:'10px', color:'#7A9098', marginLeft:'8px' }}>· Tradie to answer</span>}
                    {q.posed_to === 'both' && <span style={{ fontSize:'10px', color:'#7A9098', marginLeft:'8px' }}>· Both parties</span>}
                  </div>
                </div>

                <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'14px', marginBottom:'14px' }}>
                  <p style={{ fontSize:'13px', color:'#1C2B32', lineHeight:'1.6', margin:0 }}>{q.question}</p>
                </div>

                {resp?.tradie_response && (
                  <div style={{ marginBottom:'10px' }}>
                    <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'5px', fontWeight:500 }}>Tradie response</p>
                    <div style={{ background:'#1C2B32', borderRadius:'10px', padding:'12px 14px', borderBottomLeftRadius:'3px' }}>
                      <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.85)', lineHeight:'1.55', margin:0 }}>{resp.tradie_response}</p>
                    </div>
                  </div>
                )}

                {!resp?.tradie_response && isTradie && (
                  <div style={{ marginBottom:'12px' }}>
                    <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'5px', fontWeight:500 }}>Your response</p>
                    <textarea
                      value={tradieText}
                      onChange={e => setTradieText(e.target.value)}
                      placeholder={q.placeholder}
                      rows={4}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'10px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', lineHeight:'1.5' }}
                    />
                    <button type="button" onClick={() => saveResponse(i, 'tradie_response')} disabled={saving || !tradieText.trim()}
                      style={{ marginTop:'8px', background:'#1C2B32', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: saving || !tradieText.trim() ? 0.5 : 1 }}>
                      {saving ? 'Saving...' : 'Submit response →'}
                    </button>
                  </div>
                )}

                {!resp?.tradie_response && !isTradie && (
                  <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px' }}>
                    <p style={{ fontSize:'13px', color:'#C07830', margin:0 }}>⏳ Waiting for the tradie to respond to this question.</p>
                  </div>
                )}

                {resp?.tradie_response && resp?.client_response && (
                  <div style={{ marginBottom:'10px' }}>
                    <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'5px', fontWeight:500 }}>Client response</p>
                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 14px', borderBottomRightRadius:'3px' }}>
                      <p style={{ fontSize:'13px', color:'#1C2B32', lineHeight:'1.55', margin:0 }}>{resp.client_response}</p>
                    </div>
                  </div>
                )}

                {resp?.tradie_response && !resp?.client_response && !isTradie && (
                  <div style={{ marginBottom:'12px' }}>
                    <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'5px', fontWeight:500 }}>{q.client_prompt}</p>
                    <textarea
                      value={clientText}
                      onChange={e => setClientText(e.target.value)}
                      placeholder={q.client_placeholder}
                      rows={3}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'10px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', lineHeight:'1.5' }}
                    />
                    <button type="button" onClick={() => saveResponse(i, 'client_response')} disabled={saving || !clientText.trim()}
                      style={{ marginTop:'8px', background:'#1C2B32', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: saving || !clientText.trim() ? 0.5 : 1 }}>
                      {saving ? 'Saving...' : 'Submit response →'}
                    </button>
                  </div>
                )}

                {resp?.tradie_response && !resp?.client_response && isTradie && (
                  <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px' }}>
                    <p style={{ fontSize:'13px', color:'#2E7D60', margin:0 }}>✓ Your response submitted. Waiting for the client to acknowledge.</p>
                  </div>
                )}

                {isDone && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', marginBottom:'12px' }}>
                    <span style={{ fontSize:'13px', color:'#2E7D60' }}>✓ This question is complete</span>
                  </div>
                )}

                <div style={{ display:'flex', gap:'8px', justifyContent:'space-between' }}>
                  <button type="button" onClick={() => setCurrentQ(Math.max(0, i - 1))} disabled={i === 0}
                    style={{ background:'transparent', color:'#7A9098', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.2)', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}>
                    ← Previous
                  </button>
                  <button type="button" onClick={() => setCurrentQ(Math.min(QUESTIONS.length - 1, i + 1))} disabled={i === QUESTIONS.length - 1}
                    style={{ background:'transparent', color:'#7A9098', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.2)', cursor: i === QUESTIONS.length - 1 ? 'not-allowed' : 'pointer', opacity: i === QUESTIONS.length - 1 ? 0.4 : 1 }}>
                    Next →
                  </button>
                </div>
              </div>
            )
          })}

          {allComplete && (
            <div style={{ marginTop:'16px', padding:'14px', background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'10px', textAlign:'center' as const }}>
              <p style={{ fontSize:'14px', color:'#2E7D60', fontWeight:500, marginBottom:'4px' }}>All questions complete</p>
              <p style={{ fontSize:'12px', color:'#4A5E64' }}>Both parties have addressed all trust dimensions. You can now score the dialogue and proceed to signing.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
