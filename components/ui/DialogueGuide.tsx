'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const DIMENSIONS = [
  {
    num: 1, id: 'price', dimension: 'Price & payment', color: '#2E7D60', icon: '$',
    tradie: {
      prompt: 'How is your quoted price structured?',
      options: [
        'Itemised breakdown provided in the quote — labour, materials and GST listed separately',
        'Fixed price inclusive of all labour and materials — variations will be quoted separately',
        'Time and materials — rate and estimated hours included in the quote',
      ],
      note_label: 'Anything specific the client should know about the pricing?',
      note_placeholder: 'e.g. Tile allowance based on standard range — upgrades at cost difference',
    },
    client: {
      prompt: 'Are you comfortable with the pricing structure?',
      options: [
        "Yes — I've reviewed the breakdown and it makes sense",
        "Yes — I understand it's a fixed price and variations will be quoted separately",
        "Yes — I understand the rate and have reviewed the estimate",
      ],
      note_label: 'Any questions or conditions on price? (optional)',
      note_placeholder: 'e.g. Please confirm the door hardware allowance is included',
    },
    why: 'Confirming price structure now prevents the most common dispute trigger — ambiguity about what was included. Your scope agreement and audit trail will reference this confirmation.',
  },
  {
    num: 2, id: 'scope', dimension: 'Scope & inclusions', color: '#2E6A8F', icon: '✓',
    tradie: {
      prompt: 'What is explicitly included and excluded in this job?',
      options: [
        'Inclusions and exclusions are fully listed in the scope agreement — nothing additional is implied',
        'Scope covers the work described in the job request — any additions will require a variation',
        'I have reviewed the job description and my quote covers all items listed',
      ],
      note_label: 'Any scope items the client needs to be aware of?',
      note_placeholder: 'e.g. Wall patching after tile removal is excluded — can be quoted separately',
    },
    client: {
      prompt: 'Does the scope match what you were expecting?',
      options: [
        'Yes — the inclusions and exclusions in the scope agreement match my expectations',
        'Yes — I understand that items not listed will require a variation',
        "Yes — I've reviewed the scope and it covers what was discussed",
      ],
      note_label: 'Any scope items you want confirmed? (optional)',
      note_placeholder: 'e.g. Please confirm removal and disposal of old tiles is included',
    },
    why: 'A confirmed scope record protects both parties from scope creep. It becomes part of your signed agreement and is referenced in any variation or dispute.',
  },
  {
    num: 3, id: 'compliance', dimension: 'Licence & compliance', color: '#6B4FA8', icon: '⚡',
    tradie: {
      prompt: 'What licence, compliance or permit requirements apply to this job?',
      options: [
        'Licensed trade work — my licence number is on my Steadyhand profile and will be on the scope agreement',
        'No permit required for this scope — like-for-like replacement or below permit threshold',
        'Permit required — I will obtain or confirm permit before work commences',
      ],
      note_label: 'Any compliance conditions the client should know about?',
      note_placeholder: 'e.g. Electrical compliance certificate will be issued on completion',
    },
    client: {
      prompt: 'Are you satisfied with the compliance information provided?',
      options: [
        "Yes — I've confirmed the tradie is licensed and the work is compliant",
        'Yes — I understand no permit is required for this scope',
        'Yes — I understand a permit is required and the tradie will manage this',
      ],
      note_label: 'Any compliance questions? (optional)',
      note_placeholder: 'e.g. Please provide the compliance certificate once work is complete',
    },
    why: 'Confirming licence and compliance now protects your warranty coverage. Some manufacturer warranties require licensed installation. This record is included in your warranty certificate.',
  },
  {
    num: 4, id: 'warranty', dimension: 'Warranty & defects', color: '#C07830', icon: '🛡',
    tradie: {
      prompt: 'What is your process if a defect is identified after completion?',
      options: [
        '90-day Steadyhand workmanship warranty — defects logged via the platform, responded to within 5 business days',
        'I stand behind my work — any defect within the warranty period will be rectified at no charge',
        'Workmanship warranty applies to all labour — product defects are subject to manufacturer warranty',
      ],
      note_label: 'Any warranty conditions the client should know?',
      note_placeholder: 'e.g. Hot water system warranty requires annual anode inspection — I can arrange this',
    },
    client: {
      prompt: 'Are you satisfied with the warranty and rectification process?',
      options: [
        'Yes — I understand the 90-day warranty and will log any issues via Steadyhand',
        "Yes — I'm comfortable with the warranty terms as described",
        'Yes — I understand the difference between workmanship and product warranty',
      ],
      note_label: 'Any warranty conditions you want on record? (optional)',
      note_placeholder: "e.g. I'll need the manufacturer warranty cards for the products installed",
    },
    why: 'Confirming warranty terms now creates a clear record of what was agreed. This feeds directly into your warranty certificate and post-warranty log.',
  },
]

interface Props { jobId: string; userRole: 'tradie' | 'client'; userId: string; onComplete?: () => void }

export function DialogueGuide({ jobId, userRole, userId, onComplete }: Props) {
  const [responses, setResponses] = useState<Record<number, any>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const isTradie = userRole === 'tradie'

  useEffect(() => {
    createClient().from('dialogue_responses').select('*').eq('job_id', jobId).then(({ data }) => {
      const map: Record<number, any> = {}
      ;(data || []).forEach((r: any) => { map[r.question_num] = r })
      setResponses(map)
      setLoading(false)
    })
  }, [jobId])

  const completedCount = DIMENSIONS.filter(d => {
    const r = responses[d.num] || {}
    return isTradie ? r.tradie_selection : r.client_selection
  }).length
  const allComplete = completedCount === DIMENSIONS.length

  const saveSelection = async (num: number, selection: string, note: string) => {
    setSaving(num)
    const supabase = createClient()
    const existing = responses[num] || {}
    const updates: any = { job_id: jobId, question_num: num, updated_at: new Date().toISOString() }
    if (isTradie) {
      updates.tradie_selection = selection
      updates.tradie_note = note || null
      updates.tradie_response = selection + (note ? '\n\n' + note : '')
    } else {
      updates.client_selection = selection
      updates.client_note = note || null
      updates.client_response = selection + (note ? '\n\n' + note : '')
    }
    updates.completed = !!(
      (isTradie ? selection : existing.tradie_selection) &&
      (isTradie ? existing.client_selection : selection)
    )
    const { data } = await supabase.from('dialogue_responses')
      .upsert(updates, { onConflict: 'job_id,question_num' }).select().single()
    if (data) {
      const updated = { ...responses, [num]: { ...existing, ...data } }
      setResponses(updated)
      const nowComplete = DIMENSIONS.every(d => {
        const r = updated[d.num] || {}
        return isTradie ? r.tradie_selection : r.client_selection
      })
      if (nowComplete && onComplete) onComplete()
    }
    setSaving(null)
  }

  if (loading) return null

  return (
    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom: expanded ? '1px solid rgba(28,43,50,0.08)' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'8px', background: allComplete ? '#2E7D60' : '#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
            {allComplete ? '✓' : '🤝'}
          </div>
          <div>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>PRE-SIGNING DIALOGUE</p>
            <p style={{ fontSize:'12px', color: allComplete ? '#2E7D60' : '#7A9098', margin:0 }}>
              {allComplete ? '✓ Complete — documentation and warranty coverage confirmed' : `${completedCount} of 4 dimensions confirmed`}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', gap:'4px' }}>
            {DIMENSIONS.map(d => {
              const r = responses[d.num] || {}
              const done = isTradie ? !!r.tradie_selection : !!r.client_selection
              return <div key={d.num} style={{ width:'8px', height:'8px', borderRadius:'50%', background: done ? d.color : 'rgba(28,43,50,0.15)' }} />
            })}
          </div>
          <span style={{ fontSize:'11px', color:'#7A9098' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding:'20px' }}>
          <div style={{ background:'#0A0A0A', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
            <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.9)', lineHeight:'1.65', margin:0 }}>
              {isTradie
                ? '✦ Completing these four confirmations strengthens your scope documentation, locks in your warranty terms, and puts your expertise on record before signing. It takes two minutes and protects you from the most common post-job disputes.'
                : '✦ Completing these four confirmations ensures the tradie has explicitly committed to price, scope, compliance and warranty before a dollar changes hands. Your answers are locked and become part of your signed agreement and warranty certificate.'}
            </p>
          </div>

          {DIMENSIONS.map(dim => {
            const r = responses[dim.num] || {}
            const mySelection = isTradie ? r.tradie_selection : r.client_selection
            const myNote = isTradie ? r.tradie_note : r.client_note
            const otherSelection = isTradie ? r.client_selection : r.tradie_selection
            const dimConfig = isTradie ? dim.tradie : dim.client
            return (
              <DimCard key={dim.num} dim={dim} dimConfig={dimConfig}
                mySelection={mySelection || ''} myNote={myNote || ''}
                otherSelection={otherSelection || ''} isTradie={isTradie}
                isSaving={saving === dim.num}
                onSave={(sel, note) => saveSelection(dim.num, sel, note)} />
            )
          })}

          {allComplete && (
            <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'10px', padding:'14px 16px', textAlign:'center' as const, marginTop:'8px' }}>
              <p style={{ fontSize:'14px', color:'#2E7D60', fontWeight:600, margin:'0 0 4px' }}>✓ All four dimensions confirmed</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>This dialogue record is now part of your scope agreement, warranty certificate and audit trail.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DimCard({ dim, dimConfig, mySelection, myNote, otherSelection, isTradie, isSaving, onSave }: {
  dim: typeof DIMENSIONS[0]; dimConfig: typeof DIMENSIONS[0]['tradie']
  mySelection: string; myNote: string; otherSelection: string
  isTradie: boolean; isSaving: boolean; onSave: (s: string, n: string) => void
}) {
  const [sel, setSel] = useState(mySelection)
  const [note, setNote] = useState(myNote)
  const [open, setOpen] = useState(!mySelection)
  const done = !!mySelection

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ marginBottom:'10px', border:`1.5px solid ${done ? dim.color + '40' : 'rgba(28,43,50,0.1)'}`, borderRadius:'12px', overflow:'hidden', background: done ? dim.color + '06' : 'white' }}>
      <div onClick={() => setOpen(!open)} style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'6px', background: done ? dim.color : 'rgba(28,43,50,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color: done ? 'white' : '#0A0A0A', flexShrink:0 }}>
            {done ? '✓' : dim.icon}
          </div>
          <div>
            <p style={{ fontSize:'13px', fontWeight:600, color: done ? dim.color : '#0A0A0A', margin:0 }}>{dim.dimension}</p>
            {done && <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{mySelection.substring(0, 55)}…</p>}
          </div>
        </div>
        <span style={{ fontSize:'11px', color:'#9AA5AA', flexShrink:0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px' }}>
            <p style={{ fontSize:'11px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
              <span style={{ fontWeight:600, color: dim.color }}>Why this matters: </span>{dim.why}
            </p>
          </div>

          {otherSelection && (
            <div style={{ marginBottom:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 6px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{isTradie ? 'Client confirmed' : 'Tradie confirmed'}</p>
              <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'8px', padding:'10px 12px' }}>
                <p style={{ fontSize:'12px', color:'#0A0A0A', lineHeight:'1.55', margin:0 }}>{otherSelection}</p>
              </div>
            </div>
          )}

          {done ? (
            <div>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', margin:'0 0 6px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Your confirmation</p>
              <div style={{ background: dim.color + '10', border:`1px solid ${dim.color}30`, borderRadius:'8px', padding:'10px 12px', marginBottom:'8px' }}>
                <p style={{ fontSize:'12px', color:'#0A0A0A', lineHeight:'1.55', margin:0 }}>{mySelection}</p>
                {myNote && <p style={{ fontSize:'11px', color:'#4A5E64', margin:'6px 0 0', fontStyle:'italic' }}>{myNote}</p>}
              </div>
              <button type="button" onClick={() => { setSel(mySelection); setNote(myNote) }}
                style={{ fontSize:'11px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:0 }}>Edit response</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize:'12px', fontWeight:600, color:'#0A0A0A', margin:'0 0 10px' }}>{dimConfig.prompt}</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'12px' }}>
                {dimConfig.options.map((opt, i) => (
                  <label key={i} onClick={() => setSel(opt)} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'10px 12px', border:`1.5px solid ${sel === opt ? dim.color : 'rgba(28,43,50,0.12)'}`, borderRadius:'8px', cursor:'pointer', background: sel === opt ? dim.color + '08' : 'white', transition:'all 0.15s' }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid ${sel === opt ? dim.color : 'rgba(28,43,50,0.2)'}`, background: sel === opt ? dim.color : 'white', flexShrink:0, marginTop:'1px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {sel === opt && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'white' }} />}
                    </div>
                    <span style={{ fontSize:'12px', color:'#0A0A0A', lineHeight:'1.55' }}>{opt}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginBottom:'12px' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 5px' }}>{dimConfig.note_label}</p>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={dimConfig.note_placeholder} rows={2}
                  style={{ ...inp, resize:'vertical' as const, minHeight:'52px' }} />
              </div>
              <button type="button" onClick={() => { if (sel) { onSave(sel, note); setOpen(false) } }} disabled={!sel || isSaving}
                style={{ background: sel ? dim.color : 'rgba(28,43,50,0.15)', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', cursor: sel ? 'pointer' : 'not-allowed', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving...' : `Confirm ${dim.dimension} →`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
