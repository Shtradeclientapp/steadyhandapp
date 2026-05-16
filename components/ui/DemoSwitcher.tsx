'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DemoSwitcher() {
  const [profile, setProfile] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('profiles')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('id', session.user.id)
        .single()
      if (data?.is_demo) {
        setProfile(data)
        setRole(data.role === 'tradie' ? 'tradie' : data.org_id ? 'org' : 'client')
      }
    })
  }, [])

  const switchTo = async (targetRole: 'client' | 'tradie' | 'org') => {
    if (switching || targetRole === role) return
    setSwitching(true)
    const supabase = createClient()

    // Find the demo account for the target role
    const roleEmail = targetRole === 'client'
      ? 'demo-client@steadyhandtrade.app'
      : targetRole === 'tradie'
      ? 'demo-tradie@steadyhandtrade.app'
      : 'demo-org@steadyhandtrade.app'

    // Check if a demo account exists for this role in production
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', roleEmail)
      .eq('is_demo', true)
      .single()

    if (!targetProfile) {
      // No pre-seeded demo account for this role — show message
      alert('Switch to ' + targetRole + ' view: set up demo accounts in your profile settings.')
      setSwitching(false)
      return
    }

    // Sign in as the demo account
    const { error } = await supabase.auth.signInWithPassword({
      email: roleEmail,
      password: targetRole === 'client' ? 'demo-client-2024'
        : targetRole === 'tradie' ? 'demo-tradie-2024'
        : 'demo-org-2024',
    })

    if (error) {
      setSwitching(false)
      alert('Could not switch view: ' + error.message)
      return
    }

    const dash = targetRole === 'tradie' ? '/tradie/dashboard'
      : targetRole === 'org' ? '/org/dashboard'
      : '/dashboard'
    window.location.href = dash
  }

  if (!profile) return null

  const ROLES = [
    { key: 'client', label: 'Homeowner', icon: '🏠', color: '#2E7D60' },
    { key: 'tradie', label: 'Tradie', icon: '🔧', color: '#C07830' },
    { key: 'org',    label: 'Property Manager', icon: '🏢', color: '#185FA5' },
  ] as const

  return (
    <div style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '0', height: '40px', position: 'sticky', top: 0, zIndex: 200 }}>
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(216,228,225,0.3)', textTransform: 'uppercase' as const, marginRight: '16px', flexShrink: 0 }}>
        🔍 DEMO
      </span>
      <span style={{ fontSize: '11px', color: 'rgba(216,228,225,0.25)', marginRight: '12px', flexShrink: 0 }}>View as:</span>
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {ROLES.map(r => {
          const isActive = role === r.key
          const isLoading = switching && !isActive
          return (
            <button key={r.key} type="button"
              onClick={() => switchTo(r.key)}
              disabled={switching}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${isActive ? r.color + '60' : 'rgba(255,255,255,0.08)'}`, background: isActive ? r.color + '18' : 'transparent', color: isActive ? r.color : 'rgba(216,228,225,0.45)', fontSize: '11px', fontWeight: isActive ? 600 : 400, cursor: isActive ? 'default' : 'pointer', opacity: switching && !isActive ? 0.5 : 1 }}>
              <span>{isLoading ? '⏳' : r.icon}</span>
              <span>{r.label}</span>
            </button>
          )
        })}
      </div>
      <a href="/dashboard" style={{ fontSize: '10px', color: 'rgba(216,228,225,0.2)', textDecoration: 'none', marginLeft: '12px', flexShrink: 0 }}>
        Post a real job →
      </a>
    </div>
  )
}
