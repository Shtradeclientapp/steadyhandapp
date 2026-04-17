'use client'
import { useState, useEffect } from 'react'

interface CheckItem {
  text: string
  emphasis?: boolean
}

interface StageGuideModalProps {
  storageKey: string
  stageNumber: number
  stageColor: string
  stageLabel: string
  headline: string
  intro: string
  checklist: CheckItem[]
  warning?: string
  ctaLabel?: string
}

export function StageGuideModal({
  storageKey, stageNumber, stageColor, stageLabel,
  headline, intro, checklist, warning, ctaLabel = "I'm ready →"
}: StageGuideModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(storageKey)) {
      setVisible(true)
    }
  }, [storageKey])

  const dismiss = () => {
    if (typeof window !== 'undefined') localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(28,43,50,0.82)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#E8F0EE', borderRadius: '20px',
        maxWidth: '500px', width: '100%', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(28,43,50,0.35)',
      }}>
        {/* Header band */}
        <div style={{
          background: '#0A0A0A', padding: '20px 28px',
          display: 'flex', alignItems: 'center', gap: '14px',
          borderBottom: '2px solid ' + stageColor,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: stageColor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
            fontFamily: 'var(--font-aboreto), sans-serif',
            fontSize: '14px', fontWeight: 700, color: 'white',
          }}>{stageNumber}</div>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(216,228,225,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 2px' }}>Stage {stageNumber}</p>
            <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '16px', color: 'rgba(216,228,225,0.9)', letterSpacing: '1px', margin: 0 }}>{stageLabel.toUpperCase()}</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          <h2 style={{
            fontFamily: 'var(--font-aboreto), sans-serif',
            fontSize: '19px', color: '#0A0A0A', letterSpacing: '0.3px',
            marginBottom: '10px', lineHeight: '1.3',
          }}>{headline}</h2>
          <p style={{ fontSize: '14px', color: '#4A5E64', lineHeight: '1.7', marginBottom: '20px' }}>{intro}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: warning ? '16px' : '24px' }}>
            {checklist.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: stageColor + '20', border: '1.5px solid ' + stageColor + '60',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: stageColor, marginTop: '1px',
                }}>{i + 1}</div>
                <p style={{
                  fontSize: '13px', lineHeight: '1.6', margin: 0,
                  color: item.emphasis ? '#0A0A0A' : '#4A5E64',
                  fontWeight: item.emphasis ? 600 : 400,
                }}>{item.text}</p>
              </div>
            ))}
          </div>

          {warning && (
            <div style={{
              background: 'rgba(192,120,48,0.08)', border: '1px solid rgba(192,120,48,0.25)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠</span>
              <p style={{ fontSize: '12px', color: '#C07830', lineHeight: '1.6', margin: 0 }}>{warning}</p>
            </div>
          )}

          <button type="button" onClick={dismiss} style={{
            width: '100%', background: '#0A0A0A', color: 'white',
            padding: '14px', borderRadius: '10px', fontSize: '15px',
            fontWeight: 600, border: 'none', cursor: 'pointer',
            letterSpacing: '0.2px',
          }}>{ctaLabel}</button>

          <button type="button" onClick={dismiss} style={{
            display: 'block', margin: '10px auto 0', background: 'none',
            border: 'none', fontSize: '12px', color: '#9AA5AA',
            cursor: 'pointer', textDecoration: 'underline',
          }}>Don't show this again</button>
        </div>
      </div>
    </div>
  )
}
