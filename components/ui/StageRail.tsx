'use client'
import { useEffect, useState } from 'react'

const STAGES = [
  { n:1, l:'Request',   p:'/request'  },
  { n:2, l:'Match',     p:'/shortlist' },
  { n:3, l:'Consult',   p:'/consult'  },
  { n:4, l:'Compare',   p:'/compare'  },
  { n:5, l:'Agreement', p:'/agreement'},
  { n:6, l:'Build',     p:'/delivery' },
  { n:7, l:'Sign off',  p:'/signoff'  },
  { n:8, l:'Protected', p:'/warranty' },
]

const STATUS_TO_STAGE: Record<string,number> = {
  draft:1, matching:1, shortlisted:2, assess:3, consult:3, invite_client:2, first_job:2,
  compare:4, quote:4, agreement:5, contract:5,
  delivery:6, signoff:7, warranty:8, complete:8,
}

const STAGE_COLOR: Record<number,string> = {
  1:'#2E7D60', 2:'#2E6A8F', 3:'#9B6B9B', 4:'#7B5EA7',
  5:'#6B4FA8', 6:'#C07830', 7:'#D4522A', 8:'#1A6B5A',
}

interface StageRailProps { currentPath: string; jobStatus?: string }

export function StageRail({ currentPath, jobStatus }: StageRailProps) {
  const [jobId, setJobId] = useState<string|null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setJobId(params.get('id') || params.get('job_id'))
    }
  }, [])

  const currentN = STAGES.find(s => s.p === currentPath)?.n ?? 1
  const jobStageN = jobStatus ? (STATUS_TO_STAGE[jobStatus] ?? 1) : currentN
  const completedUpTo = Math.max(jobStageN - 1, currentN - 1)

  const getHref = (stage: typeof STAGES[0]) => {
    if (!isClickable(stage)) return '#'
    // Append job_id to /agreement so the page loads the correct job
    if (stage.p === '/agreement' && jobId) return '/agreement?job_id=' + jobId
    return stage.p
  }

  const isClickable = (stage: typeof STAGES[0]) => {
    const isComplete = stage.n <= completedUpTo
    const isCurrent = stage.p === currentPath
    return isComplete || isCurrent
  }

  return (
    <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex', overflowX:'auto' as const }}>
      {STAGES.map(s => {
        const isComplete = s.n <= completedUpTo
        const isCurrent = s.p === currentPath
        const clickable = isClickable(s)
        const color = STAGE_COLOR[s.n] || '#7A9098'
        return (
          <a key={s.n} href={getHref(s)}
            onClick={e => { if (!clickable) e.preventDefault() }}
            title={!clickable ? 'Complete the current stage first' : ''}
            style={{ flexShrink:0, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', padding:'10px 14px', borderRight:'1px solid rgba(28,43,50,0.08)', textDecoration:'none', position:'relative' as const, cursor: clickable ? 'pointer' : 'not-allowed', opacity: !clickable ? 0.45 : 1 }}>
            {isCurrent && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:color }} />}
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'1.5px solid '+(isComplete?'#2E7D60':isCurrent?color:'rgba(28,43,50,0.2)'), background:isComplete?'#2E7D60':isCurrent?color:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:isComplete||isCurrent?'white':'#7A9098' }}>
              {isComplete ? '✓' : s.n}
            </div>
            <div style={{ fontSize:'11px', color:isCurrent?'#0A0A0A':isComplete?'#2E7D60':'#7A9098', fontWeight:isCurrent?600:400, whiteSpace:'nowrap' as const }}>{s.l}</div>
          </a>
        )
      })}
    </div>
  )
}
