'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavHeaderProps {
  profile?: any
  isTradie?: boolean
  showBack?: boolean
  backLabel?: string
  backHref?: string
}

export function NavHeader({ profile, isTradie, showBack = true, backLabel, backHref }: NavHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const dashboardHref = isTradie ? '/tradie/dashboard' : '/dashboard'
  const profileHref = isTradie ? '/tradie/profile' : '/profile'
  const defaultBackHref = backHref || dashboardHref
  const defaultBackLabel = backLabel || '← Back to dashboard'
  const initial = profile?.tradie?.business_name?.charAt(0) || profile?.full_name?.charAt(0) || '?'

  return (
    <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
      <a href={dashboardHref} style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>

      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        {showBack && (
          <a href={defaultBackHref} style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>{defaultBackLabel}</a>
        )}

        {profile && (
          <div style={{ position:'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#1C2B32', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            >
              <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.9)' }}>{initial}</span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  style={{ position:'fixed', inset:0, zIndex:150 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div style={{ position:'absolute', top:'42px', right:0, background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', boxShadow:'0 4px 20px rgba(28,43,50,0.12)', minWidth:'180px', zIndex:200, overflow:'hidden' }}>
                  <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{profile.tradie?.business_name || profile.full_name}</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>{profile.email}</p>
                  </div>
                  <a href={profileHref} style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#1C2B32', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}
                    onClick={() => setDropdownOpen(false)}>
                    My profile
                  </a>
                  <a href="/trust" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#1C2B32', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}
                    onClick={() => setDropdownOpen(false)}>
                    Dialogue Rating
                  </a>
                  {profile?.org_id && (
                    <a href="/org/dashboard" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#1C2B32', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}
                      onClick={() => setDropdownOpen(false)}>
                      Organisation dashboard
                    </a>
                  )}
                  {!profile?.org_id && (
                    <a href="/org/setup" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#2E6A8F', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}
                      onClick={() => setDropdownOpen(false)}>
                      Set up organisation →
                    </a>
                  )}
                  <a href="/messages" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#1C2B32', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }}
                    onClick={() => setDropdownOpen(false)}>
                    Messages
                  </a>
                  <button type="button" onClick={signOut}
                    style={{ display:'block', width:'100%', padding:'10px 14px', fontSize:'13px', color:'#D4522A', textAlign:'left' as const, background:'none', border:'none', cursor:'pointer' }}>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
