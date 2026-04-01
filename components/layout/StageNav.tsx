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
    <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
      <div className="stage-nav">
        {STAGES.map(stage => (
          const isDone = stage.num < currentStage || stage.num <= completedStage
          const isActive = stage.num === currentStage
          const isLocked = stage.num > Math.max(currentStage, completedStage + 1)

          return (
            
              key={stage.num}
              href={isLocked ? undefined : stage.path}
              className={'stage-nav-item' + (isDone ? ' done' : '') + (isActive ? ' active' : '')}
              style={{
                pointerEvents: isLocked ? 'none' : 'auto',
                opacity: isLocked ? 0.4 : 1,
              }}
            >
              {isActive && (
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background: stage.color }} />
              )}
              <div
                className="stage-nav-num"
                style={
                  isDone ? undefined :
                  isActive ? { borderColor: stage.color, color: stage.color } :
                  undefined
                }
              >
                {isDone ? '✓' : stage.num}
              </div>
              <div className="stage-nav-label">{stage.label}</div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
