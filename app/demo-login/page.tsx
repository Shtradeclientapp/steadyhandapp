'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCOUNTS = [
  { role: 'client', email: 'demo-client@steadyhand-demo.app', password: 'demo-client-2024', label: 'Homeowner', name: 'Sarah Mitchell', icon: '🏠', color: '#2E7D60', bg: 'rgba(46,125,96,0.08)', border: 'rgba(46,125,96,0.2)', dash: '/dashboard', desc: 'Post jobs, review quotes, sign scope agreements, approve milestones, manage warranties. See the full client journey.' },
  { role: 'tradie', email: 'demo-tradie@steadyhand-demo.app', password: 'demo-tradie-2024', label: 'Tradie', name: 'Marcus Webb · Webb Tiling & Bathrooms', icon: '🔧', color: '#C07830', bg: 'rgba(192,120,48,0.08)', border: 'rgba(192,120,48,0.2)', dash: '/tradie/dashboard', desc: 'Accept quote requests, submit site assessments, draft scope agreements, log milestones, respond to warranty issues.' },
  { role: 'org', email: 'demo-org@steadyhand-demo.app', password: 'demo-org-2024', label: 'Property Manager', name: 'James Corrigan · Corrigan Property Group', icon: '🏢', color: '#185FA5', bg: 'rgba(46,106,143,0.08)', border: 'rgba(46,106,143,0.2)', dash: '/org/dashboard', desc: 'Manage multiple properties, post jobs on behalf of properties, track compliance across a portfolio.' },
]

export default function DemoLoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const login = async (account: typeof ACCOUNTS[0]) => {
    setLoading(account.role)
    setError(null)
    const supabase = createClient()
    await supabase.auth.signOut()
    const { error: err } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password })
    if (err) {
      setError(err.message)
      setLoading(null)
    } else {
      window.location.href = account.dash
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '11px', color: 'rgba(216,228,225,0.5)', letterSpacing: '2px', marginBottom: '20px' }}>STEADYHAND DEMO</p>
      <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#ffffff', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' as const }}>Choose your perspective</h1>
      <p style={{ fontSize: '15px', color: 'rgba(216,228,225,0.75)', marginBottom: '40px', textAlign: 'center' as const, maxWidth: '480px', lineHeight: '1.7' }}>
        The same job — three different views. Switch between them at any time using the bar at the top of the screen.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', width: '100%', maxWidth: '520px' }}>
        {ACCOUNTS.map(account => (
          <button key={account.role} type="button" onClick={() => login(account)} disabled={!!loading}
            style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '20px', background: account.bg, border: `1px solid ${account.border}`, borderRadius: '12px', cursor: loading ? 'default' : 'pointer', opacity: loading && loading !== account.role ? 0.5 : 1, textAlign: 'left' as const, transition: 'all 0.15s' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: account.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
              {loading === account.role ? '⏳' : account.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: account.color }}>{account.label}</span>
                <span style={{ fontSize: '12px', color: 'rgba(216,228,225,0.6)' }}>— {account.name}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(216,228,225,0.7)', lineHeight: '1.55', margin: 0 }}>{account.desc}</p>
            </div>
            <span style={{ fontSize: '16px', color: 'rgba(216,228,225,0.4)', flexShrink: 0, marginTop: '2px' }}>→</span>
          </button>
        ))}
      </div>

      {error && <p style={{ marginTop: '16px', fontSize: '13px', color: '#D4522A' }}>{error}</p>}

      <p style={{ marginTop: '32px', fontSize: '12px', color: 'rgba(216,228,225,0.4)', textAlign: 'center' as const, lineHeight: '1.6' }}>
        This is a demo environment. No real data, no real payments.<br />
        <a href="https://steadyhandtrade.app/signup" style={{ color: 'rgba(216,228,225,0.55)', textDecoration: 'none' }}>Create a real account →</a>
      </p>
    </div>
  )
}
