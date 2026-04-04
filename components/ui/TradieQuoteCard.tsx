'use client'
import { useState } from 'react'

export function TradieQuoteCard({ quote: q, history, isAccepted, isLowest, hasAccepted, acceptingQuote, onAccept }: any) {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div style={{ border:'1.5px solid ' + (isAccepted ? '#2E7D60' : isLowest ? '#2E6A8F' : 'rgba(28,43,50,0.12)'), borderRadius:'10px', overflow:'hidden', background: isAccepted ? 'rgba(46,125,96,0.04)' : '#C8D5D2', position:'relative' }}>
      {isLowest && <div style={{ position:'absolute', top:'-9px', left:'12px', background:'#2E6A8F', color:'white', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'100px' }}>LOWEST</div>}
      {isAccepted && <div style={{ position:'absolute', top:'-9px', left:'12px', background:'#2E7D60', color:'white', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'100px' }}>✓ SELECTED</div>}

      <div style={{ padding:'14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', margin:0 }}>{q.tradie?.business_name}</p>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'10px', color:'#7A9098', background:'rgba(28,43,50,0.06)', padding:'2px 6px', borderRadius:'4px' }}>v{q.version}</span>
            {history.length > 0 && (
              <button type="button" onClick={() => setShowHistory(!showHistory)}
                style={{ fontSize:'10px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'4px', padding:'2px 6px', cursor:'pointer' }}>
                {showHistory ? 'Hide' : history.length + ' revision' + (history.length > 1 ? 's' : '')}
              </button>
            )}
          </div>
        </div>

        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#1C2B32', margin:'0 0 6px' }}>${Number(q.total_price).toLocaleString()}</p>
        {q.estimated_days && <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 2px' }}>{q.estimated_days} days</p>}
        {q.estimated_start && <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 8px' }}>From {new Date(q.estimated_start).toLocaleDateString('en-AU')}</p>}

        {q.breakdown?.length > 0 && (
          <div style={{ borderTop:'1px solid rgba(28,43,50,0.08)', paddingTop:'8px', marginBottom:'8px' }}>
            {q.breakdown.map((b: any, i: number) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#4A5E64', padding:'2px 0' }}>
                <span>{b.category ? b.category + ' — ' : ''}{b.label}</span>
                <span>${Number(b.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {!isAccepted && !hasAccepted && (
          <button type="button" onClick={onAccept} disabled={acceptingQuote}
            style={{ width:'100%', background:'#1C2B32', color:'white', padding:'9px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', opacity: acceptingQuote ? 0.7 : 1 }}>
            Accept this quote →
          </button>
        )}

        <p style={{ fontSize:'10px', color:'#9AA5AA', marginTop:'6px', textAlign:'center' }}>
          Submitted {new Date(q.created_at).toLocaleDateString('en-AU')}
        </p>
      </div>

      {showHistory && history.length > 0 && (
        <div style={{ borderTop:'1px solid rgba(28,43,50,0.1)', background:'rgba(28,43,50,0.03)' }}>
          <p style={{ fontSize:'10px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase', padding:'8px 14px 4px', margin:0 }}>Revision history</p>
          {history.map((prev: any, i: number) => {
            const diff = Number(q.total_price) - Number(prev.total_price)
            return (
              <div key={prev.id} style={{ padding:'8px 14px', borderTop:'1px solid rgba(28,43,50,0.06)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
                <div>
                  <p style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>v{prev.version} — ${Number(prev.total_price).toLocaleString()}</p>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{new Date(prev.created_at).toLocaleDateString('en-AU')}</p>
                  {prev.breakdown?.length > 0 && (
                    <div style={{ marginTop:'4px' }}>
                      {prev.breakdown.map((b: any, bi: number) => (
                        <p key={bi} style={{ fontSize:'10px', color:'#9AA5AA', margin:'1px 0' }}>{b.label} — ${Number(b.amount).toLocaleString()}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <span style={{ fontSize:'11px', fontWeight:500, color: diff > 0 ? '#D4522A' : diff < 0 ? '#2E7D60' : '#7A9098' }}>
                    {diff > 0 ? '+' : ''}{diff !== 0 ? '$' + Math.abs(diff).toLocaleString() : 'No change'}
                  </span>
                  <p style={{ fontSize:'10px', color:'#9AA5AA', margin:'2px 0 0' }}>vs current</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
