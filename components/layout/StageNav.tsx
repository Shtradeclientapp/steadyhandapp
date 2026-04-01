'use client'
import { usePathname } from 'next/navigation'

const STAGES = [
  { num: 1, label: 'Request',   path: '/request',   color: '#2E7D60' },
  { num: 2, label: 'Shortlist', path: '/shortlist',  color: '#2E6A8F' },
  { num: 3, label: 'Agreement', path: '/agreement',  color: '#6B4FA8' },
  { num: 4, label: 'Delivery',  path: '/delivery',   color: '#C07830' },
  { num: 5, label: 'Sign-off',  path: '/signoff',    color: '#D4522A' },
  { num: 6, label: 'Warranty',  path: '/warranty',   color: '#1A6B5A' },
]

export function StageNav({ completedStage = 0 }: { completedStage?: number }) {
  const pathname = usePathname()
  const currentStage = STAGES.findIndex(s => s.path === pathname) + 1
  return (
    <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
      {STAGES.map(stage => {
        const isDone = stage.num < currentStage || stage.num <= completedStage
        const isActive = stage.num === currentStage
        return (
          <a key={stage.num} href={stage.path} style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 16px', borderRight:'1px solid rgba(28,43,50,0.1)', textDecoration:'none', position:'relative' as const }}>
            {isActive && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:stage.color }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid ' + (isDone ? '#2E7D60' : isActive ? stage.color : 'rgba(28,43,50,0.2)'), background: isDone ? '#2E7D60' : '#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: isDone ? 'white' : isActive ? stage.color : '#7A9098' }}>
              {isDone ? '✓' : stage.num}
            </div>
            <div style={{ fontSize:'10px', color: isActive ? '#1C2B32' : isDone ? '#2E7D60' : '#7A9098', fontWeight: isActive ? 600 : 400 }}>{stage.label}</div>
          </a>
        )
      })}
    </div>
  )
}
