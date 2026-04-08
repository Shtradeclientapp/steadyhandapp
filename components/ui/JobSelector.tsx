'use client'

interface JobSelectorProps {
  jobs: any[]
  selectedJobId: string | null
  onSelect: (jobId: string) => void
}

export function JobSelector({ jobs, selectedJobId, onSelect }: JobSelectorProps) {
  if (jobs.length <= 1) return null
  return (
    <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
      <p style={{ fontSize:'11px', fontWeight:600, color:'#2E6A8F', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'8px' }}>
        You have {jobs.length} active jobs at this stage
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {jobs.map(j => (
          <div key={j.id} onClick={() => onSelect(j.id)}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:'8px', border:'1.5px solid ' + (j.id === selectedJobId ? '#2E6A8F' : 'rgba(28,43,50,0.1)'), background: j.id === selectedJobId ? 'rgba(46,106,143,0.06)' : 'white', cursor:'pointer' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{j.title}</p>
              <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{j.trade_category} · {j.suburb}</p>
            </div>
            {j.id === selectedJobId && (
              <span style={{ fontSize:'11px', color:'#2E6A8F', fontWeight:600 }}>Viewing</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
