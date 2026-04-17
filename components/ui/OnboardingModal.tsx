'use client'
import { useState, useEffect } from 'react'

interface Slide {
  icon: string
  title: string
  body: string
  sub?: string
}

interface OnboardingModalProps {
  storageKey: string
  slides: Slide[]
  onDismiss?: () => void
}

export function OnboardingModal({ storageKey, slides, onDismiss }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(storageKey)) {
      setVisible(true)
    }
  }, [storageKey])

  const dismiss = () => {
    if (typeof window !== 'undefined') localStorage.setItem(storageKey, '1')
    setVisible(false)
    onDismiss?.()
  }

  if (!visible) return null

  const slide = slides[step]
  const isLast = step === slides.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(28,43,50,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#E8F0EE', borderRadius: '20px', padding: '36px 32px',
        maxWidth: '480px', width: '100%', position: 'relative',
        boxShadow: '0 24px 60px rgba(28,43,50,0.3)',
      }}>
        <button type="button" onClick={dismiss} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(28,43,50,0.08)', border: 'none', borderRadius: '50%',
          width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer',
          color: '#7A9098', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {slides.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
            {slides.map((_, i) => (
              <div key={i} style={{
                height: '6px', borderRadius: '3px',
                background: i === step ? '#D4522A' : 'rgba(28,43,50,0.15)',
                width: i === step ? '24px' : '6px',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}

        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{slide.icon}</div>
        <h2 style={{
          fontFamily: 'var(--font-aboreto), sans-serif',
          fontSize: '22px', color: '#0A0A0A', letterSpacing: '0.5px',
          marginBottom: '12px', lineHeight: '1.3',
        }}>{slide.title}</h2>
        <p style={{
          fontSize: '14px', color: '#4A5E64', lineHeight: '1.7',
          marginBottom: slide.sub ? '10px' : '28px',
        }}>{slide.body}</p>
        {slide.sub && (
          <p style={{
            fontSize: '12px', color: '#7A9098', lineHeight: '1.6',
            marginBottom: '28px', background: 'rgba(28,43,50,0.04)',
            borderRadius: '8px', padding: '10px 14px',
            borderLeft: '3px solid rgba(212,82,42,0.3)',
          }}>{slide.sub}</p>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} style={{
              background: 'transparent', color: '#7A9098',
              padding: '11px 20px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 500, border: '1px solid rgba(28,43,50,0.2)', cursor: 'pointer',
            }}>← Back</button>
          )}
          <button type="button" onClick={isLast ? dismiss : () => setStep(s => s + 1)} style={{
            flex: 1, background: '#0A0A0A', color: 'white',
            padding: '13px', borderRadius: '8px', fontSize: '14px',
            fontWeight: 600, border: 'none', cursor: 'pointer',
          }}>
            {isLast ? 'Get started →' : 'Next →'}
          </button>
        </div>
        {!isLast && (
          <button type="button" onClick={dismiss} style={{
            display: 'block', margin: '12px auto 0',
            background: 'none', border: 'none', fontSize: '12px',
            color: '#9AA5AA', cursor: 'pointer', textDecoration: 'underline',
          }}>Skip intro</button>
        )}
      </div>
    </div>
  )
}
