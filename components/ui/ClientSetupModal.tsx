'use client'
import { useState } from 'react'

const SUBURBS = [
  'Perth Metro','Fremantle','Joondalup','Rockingham','Armadale','Swan',
  'Margaret River','Busselton','Bunbury','Mandurah','Geraldton','Albany',
  'Kalgoorlie','Broome','Port Hedland','Karratha','Esperance','Other WA'
]

interface ClientSetupModalProps {
  userId: string
  onComplete: (fullName: string, suburb: string) => Promise<void>
  onDismiss?: () => void
}

export function ClientSetupModal({ userId, onComplete, onDismiss }: ClientSetupModalProps) {
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [suburb, setSuburb] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleComplete = async () => {
    if (!fullName.trim()) { setError('Please enter your name.'); return }
    if (!suburb) { setError('Please select your suburb or region.'); return }
    setSaving(true)
    setError('')
    await onComplete(fullName.trim(), suburb)
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(28,43,50,0.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'sans-serif' }}>
      <div style={{ background:'#E8F0EE', borderRadius:'20px', padding:'36px 32px', maxWidth:'460px', width:'100%', boxShadow:'0 24px 60px rgba(28,43,50,0.3)' }}>

        {/* Progress */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'28px' }}>
          {[0,1].map(i => (
            <div key={i} style={{ height:'6px', borderRadius:'3px', background: i <= step ? '#D4522A' : 'rgba(28,43,50,0.15)', flex: i === step ? 2 : 1, transition:'all 0.3s' }} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>👋</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', marginBottom:'8px' }}>Welcome to Steadyhand</h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'20px' }}>
              Before you post your first job, we need two quick things — your name and your suburb. This helps tradies understand who they're quoting for.
            </p>
            <p style={{ fontSize:'12px', color:'#7A9098', lineHeight:'1.6' }}>Takes less than 30 seconds.</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>📋</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', marginBottom:'8px' }}>Your details</h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'20px' }}>This is how tradies will know who they're working with.</p>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4A5E64', marginBottom:'6px' }}>Your full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" autoFocus
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'10px', fontSize:'14px', color:'#0A0A0A', background:'white', outline:'none', boxSizing:'border-box' as const }} />
            </div>

            <div style={{ marginBottom:'8px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4A5E64', marginBottom:'6px' }}>Your suburb or region</label>
              <input type="text" style={inp} value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="e.g. Subiaco" />
            </div>
          </div>
        )}

        {error && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px', marginTop:'8px' }}>{error}</p>}

        <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
          {step > 0 && (
            <button type="button" onClick={() => { setStep(0); setError('') }}
              style={{ background:'transparent', color:'#7A9098', padding:'11px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>
              ← Back
            </button>
          )}
          <button type="button" onClick={step === 0 ? () => setStep(1) : handleComplete} disabled={saving}
            style={{ flex:1, background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:600, border:'none', cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : step === 0 ? 'Get started →' : 'Done →'}
          </button>
        </div>

        <p style={{ fontSize:'11px', color:'#9AA5AA', textAlign:'center' as const, marginTop:'12px' }}>
          Step {step + 1} of 2 — you can update these in your profile any time
        </p>
      </div>
    </div>
  )
}
