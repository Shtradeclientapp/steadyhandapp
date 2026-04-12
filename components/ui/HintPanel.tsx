'use client'
import { useState } from 'react'

export function HintPanel({ hints, color = '#2E6A8F' }: { hints: string[], color?: string }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div style={{ background: color + '08', border: '1px solid ' + color + '30', borderRadius:'12px', marginBottom:'20px', overflow:'hidden' }}>
      <div onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'14px' }}>💡</span>
          <span style={{ fontSize:'12px', fontWeight:600, color, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>
            A few things worth knowing
          </span>
          <span style={{ fontSize:'11px', color, background: color + '15', borderRadius:'100px', padding:'2px 8px' }}>
            {hints.length}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'12px', color, opacity:0.7 }}>{open ? '▲ Hide' : '▼ Show'}</span>
          <button type="button" onClick={e => { e.stopPropagation(); setDismissed(true) }}
            style={{ background:'none', border:'none', color, opacity:0.4, cursor:'pointer', fontSize:'14px', padding:'0 4px', lineHeight:1 }}>×</button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop:'1px solid ' + color + '20', padding:'12px 16px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
          {hints.map((hint, i) => (
            <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'11px', fontWeight:700, color, background: color + '15', borderRadius:'100px', padding:'2px 7px', flexShrink:0, marginTop:'1px' }}>{i + 1}</span>
              <p style={{ fontSize:'13px', color:'#1C2B32', lineHeight:'1.6', margin:0 }}>{hint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
