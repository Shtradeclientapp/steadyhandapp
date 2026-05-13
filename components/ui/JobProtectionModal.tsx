'use client'
import { useState, useEffect } from 'react'

interface JobProtectionModalProps {
  jobId: string
  jobTitle?: string
  onClose: () => void
}

export function JobProtectionModal({ jobId, jobTitle, onClose }: JobProtectionModalProps) {
  const [loading, setLoading] = useState(true)
  const [claimUrl, setClaimUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/job-protection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setClaimUrl(d.claim_url)
        setLoading(false)
      })
      .catch(() => { setError('Could not generate link'); setLoading(false) })
  }, [jobId])

  const message = claimUrl
    ? `I've set up Steadyhand Job Protection for your job. This gives you a signed scope agreement, milestone sign-offs and a workmanship warranty — all held on a legal compliance record.\n\nActivate your protection here: ${claimUrl}`
    : ''

  const copy = async () => {
    if (!claimUrl) return
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = message
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const copyLinkOnly = async () => {
    if (!claimUrl) return
    try { await navigator.clipboard.writeText(claimUrl) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,10,10,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#F2F6F5', borderRadius:'16px', padding:'28px', maxWidth:'480px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'100px', padding:'4px 10px', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px' }}>&#x1F6E1;</span>
              <span style={{ fontSize:'10px', fontWeight:700, color:'#2E7D60', letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Steadyhand Job Protection</span>
            </div>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>SHARE JOB PROTECTION</p>
          </div>
          <button type="button" onClick={onClose} style={{ background:'none', border:'none', fontSize:'18px', color:'#7A9098', cursor:'pointer', padding:'2px', lineHeight:1 }}>x</button>
        </div>

        {jobTitle && (
          <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
            <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 2px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Job</p>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{jobTitle}</p>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center' as const, padding:'24px 0' }}>
            <p style={{ fontSize:'13px', color:'#7A9098' }}>Generating protection link...</p>
          </div>
        ) : error ? (
          <p style={{ fontSize:'13px', color:'#D4522A', textAlign:'center' as const }}>{error}</p>
        ) : (
          <>
            <div style={{ marginBottom:'16px' }}>
              <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 6px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Suggested message</p>
              <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', padding:'14px', fontSize:'12px', color:'#4A5E64', lineHeight:'1.65', whiteSpace:'pre-line' as const }}>
                {message}
              </div>
            </div>

            <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px', overflow:'hidden' }}>
              <span style={{ fontSize:'12px', color:'#2E7D60', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{claimUrl}</span>
              <button type="button" onClick={copyLinkOnly}
                style={{ fontSize:'11px', color:'#2E6A8F', background:'none', border:'none', cursor:'pointer', flexShrink:0, fontWeight:600, padding:0 }}>
                Copy link
              </button>
            </div>

            <button type="button" onClick={copy}
              style={{ width:'100%', background: copied ? '#2E7D60' : '#0A0A0A', color:'white', padding:'13px', borderRadius:'9px', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer', transition:'background 0.2s' }}>
              {copied ? '&#10003; Copied to clipboard' : 'Copy message + link'}
            </button>

            <p style={{ fontSize:'11px', color:'#9AA5AA', textAlign:'center' as const, marginTop:'12px', lineHeight:'1.55' }}>
              Paste into your quote, invoice, email or SMS.<br/>Free for your client — no lock-in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
