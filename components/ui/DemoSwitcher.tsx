'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEMO_ACCOUNTS = {
  client: { email: 'demo-client@steadyhand-demo.app', password: 'demo-client-2024', label: 'Homeowner', sub: 'Sarah Mitchell', icon: '🏠', color: '#2E7D60', dash: '/dashboard' },
  tradie: { email: 'demo-tradie@steadyhand-demo.app', password: 'demo-tradie-2024', label: 'Tradie', sub: 'Marcus Webb', icon: '🔧', color: '#C07830', dash: '/tradie/dashboard' },
  org: { email: 'demo-org@steadyhand-demo.app', password: 'demo-org-2024', label: 'Property Manager', sub: 'James Corrigan', icon: '🏢', color: '#185FA5', dash: '/org/dashboard' },
}

export function DemoSwitcher({ currentRole }: { currentRole?: string }) {
  const [switching, setSwitching] = useState<string | null>(null)

  const switchTo = async (role: keyof typeof DEMO_ACCOUNTS) => {
    if (switching) return
    setSwitching(role)
    const account = DEMO_ACCOUNTS[role]
    const supabase = createClient()
    await supabase.auth.signOut()
    const { error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password })
    if (!error) {
      window.location.href = account.dash
    } else {
      setSwitching(null)
      alert('Could not switch — ' + error.message)
    }
  }

  return (
    <div style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '0', height: '40px', position: 'sticky', top: 0, zIndex: 200 }}>
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(216,228,225,0.3)', textTransform: 'uppercase' as const, marginRight: '16px', flexShrink: 0 }}>
        🔍 DEMO
      </span>
      <span style={{ fontSize: '11px', color: 'rgba(216,228,225,0.25)', marginRight: '12px', flexShrink: 0 }}>View as:</span>
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {(Object.entries(DEMO_ACCOUNTS) as [keyof typeof DEMO_ACCOUNTS, typeof DEMO_ACCOUNTS[keyof typeof DEMO_ACCOUNTS]][]).map(([role, account]) => {
          const isActive = currentRole === role
          const isLoading = switching === role
          return (
            <button key={role} type="button" onClick={() => !isActive && switchTo(role)} disabled={!!switching}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${isActive ? account.color + '60' : 'rgba(255,255,255,0.08)'}`, background: isActive ? account.color + '18' : 'transparent', color: isActive ? account.color : 'rgba(216,228,225,0.45)', fontSize: '11px', fontWeight: isActive ? 600 : 400, cursor: isActive ? 'default' : 'pointer', opacity: switching && !isLoading ? 0.5 : 1 }}>
              <span>{isLoading ? '⏳' : account.icon}</span>
              <span>{account.label}</span>
              {isActive && <span style={{ fontSize: '9px', opacity: 0.7 }}>— {account.sub}</span>}
            </button>
          )
        })}
      </div>
      <a href="/demo-login" style={{ fontSize: '10px', color: 'rgba(216,228,225,0.2)', textDecoration: 'none', marginLeft: '12px', flexShrink: 0 }}>Switch account →</a>
    </div>
  )
}
