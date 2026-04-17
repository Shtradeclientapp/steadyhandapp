'use client'
import { useState } from 'react'

const DIMENSION_LABELS: Record<string, string> = {
  pricing_transparency: 'Pricing transparency',
  scope_clarity: 'Scope clarity',
  compliance: 'Compliance & standards',
  risk_difficulty: 'Risk & difficulty',
  timeline: 'Timeline & expectations',
  post_job: 'Post-job & warranty',
}

const SCORE_COLOR = (score: number) => {
  if (score >= 85) return '#2E7D60'
  if (score >= 70) return '#2E6A8F'
  if (score >= 55) return '#C07830'
  if (score >= 40) return '#D4522A'
  return '#8B2A1A'
}

const BAND_BG = (score: number) => {
  if (score >= 85) return 'rgba(46,125,96,0.08)'
  if (score >= 70) return 'rgba(46,106,143,0.08)'
  if (score >= 55) return 'rgba(192,120,48,0.08)'
  return 'rgba(212,82,42,0.08)'
}

const BAND_BORDER = (score: number) => {
  if (score >= 85) return 'rgba(46,125,96,0.25)'
  if (score >= 70) return 'rgba(46,106,143,0.25)'
  if (score >= 55) return 'rgba(192,120,48,0.25)'
  return 'rgba(212,82,42,0.25)'
}

export function DialogueScore({
  score,
  dimensions,
  suggestions,
  band,
  bandMessage,
  loading,
  onRefresh,
}: {
  score: number
  dimensions: any
  suggestions: string[]
  band: string
  bandMessage: string
  loading: boolean
  onRefresh: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const color = SCORE_COLOR(score)

  return (
    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
      <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
          <div>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'2px' }}>DIALOGUE TRUST SCORE</p>
            <p style={{ fontSize:'12px', color:'#7A9098' }}>Powered by Steadyhand</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ position:'relative', width:'70px', height:'70px' }}>
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(28,43,50,0.1)" strokeWidth="6" />
                <circle cx="35" cy="35" r="30" fill="none" stroke={color} strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 * (1 - score / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 35 35)"
                  style={{ transition:'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' as const }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color, lineHeight:1 }}>{score}</span>
                <span style={{ fontSize:'9px', color:'#7A9098', marginTop:'1px' }}>/ 100</span>
              </div>
            </div>
            <button type="button" onClick={onRefresh} disabled={loading}
              style={{ fontSize:'12px', color:'#6B4FA8', background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Scoring...' : '↻ Rescore'}
            </button>
          </div>
        </div>

        <div style={{ marginTop:'14px', background: BAND_BG(score), border:'1px solid ' + BAND_BORDER(score), borderRadius:'8px', padding:'10px 14px' }}>
          <span style={{ fontSize:'12px', fontWeight:600, color, marginRight:'8px' }}>{band}</span>
          <span style={{ fontSize:'12px', color:'#4A5E64' }}>{bandMessage}</span>
        </div>
      </div>

      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
        <button type="button" onClick={() => setShowDetails(!showDetails)}
          style={{ fontSize:'12px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          {showDetails ? '▲ Hide breakdown' : '▼ Show breakdown'}
        </button>

        {showDetails && dimensions && (
          <div style={{ marginTop:'14px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
              const dim = dimensions[key]
              if (!dim) return null
              const dimColor = SCORE_COLOR(dim.score * 20)
              return (
                <div key={key}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'12px', color:'#0A0A0A', fontWeight:500 }}>{label}</span>
                    <span style={{ fontSize:'12px', color: dimColor, fontWeight:600 }}>{dim.score}/5</span>
                  </div>
                  <div style={{ height:'4px', background:'rgba(28,43,50,0.08)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background: dimColor, width: (dim.score / 5 * 100) + '%', borderRadius:'2px', transition:'width 0.4s' }} />
                  </div>
                  {dim.summary && <p style={{ fontSize:'11px', color:'#7A9098', marginTop:'3px' }}>{dim.summary}</p>}
                </div>
              )
            })}
            {dimensions.variation_process && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background: dimensions.variation_process.present ? 'rgba(46,125,96,0.06)' : 'rgba(212,82,42,0.06)', borderRadius:'8px', border:'1px solid ' + (dimensions.variation_process.present ? 'rgba(46,125,96,0.2)' : 'rgba(212,82,42,0.2)') }}>
                <span style={{ fontSize:'13px' }}>{dimensions.variation_process.present ? '✓' : '×'}</span>
                <span style={{ fontSize:'12px', color: dimensions.variation_process.present ? '#2E7D60' : '#D4522A' }}>
                  Variation process {dimensions.variation_process.present ? 'discussed (+5 points)' : 'not discussed'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div style={{ padding:'14px 20px' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500, marginBottom:'10px' }}>Suggested conversation starters</p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'10px 12px', background:'rgba(107,79,168,0.04)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'8px' }}>
                <span style={{ fontSize:'12px', color:'#6B4FA8', flexShrink:0, marginTop:'1px' }}>💬</span>
                <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.5', margin:0 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
