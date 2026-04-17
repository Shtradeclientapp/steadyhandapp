'use client'
import { useState, useEffect } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  const loadNotifs = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data || [])
    setUnread((data || []).filter((n: any) => !n.read).length)
  }

  const markAllRead = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false)
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  useEffect(() => { if (profile) loadNotifs() }, [profile])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMobileMenuOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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
  const displayName = profile?.tradie?.business_name || profile?.full_name || ''

  return (
    <>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>

        {/* Logo */}
        <a href={dashboardHref} style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none', flexShrink:0 }}>
          STEADYHAND
        </a>

        {/* Desktop: back link + icons */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>

          {/* Back link — hidden on mobile via CSS */}
          {showBack && (
            <a href={defaultBackHref} className="nav-back-link" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>
              {defaultBackLabel}
            </a>
          )}

          {/* Notifications bell */}
          {profile && (
            <div style={{ position:'relative' }}>
              <button type="button"
                onClick={() => { setNotifOpen(!notifOpen); setMobileMenuOpen(false); if (!notifOpen) { loadNotifs(); markAllRead() } }}
                style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(28,43,50,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 }}>
                <span style={{ fontSize:'16px', lineHeight:1 }}>🔔</span>
                {unread > 0 && (
                  <span style={{ position:'absolute', top:'2px', right:'2px', width:'8px', height:'8px', borderRadius:'50%', background:'#D4522A', border:'2px solid rgba(200,213,210,0.95)' }} />
                )}
              </button>
              {notifOpen && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:150 }} onClick={() => setNotifOpen(false)} />
                  <div style={{ position:'absolute', top:'44px', right:0, background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', boxShadow:'0 4px 20px rgba(28,43,50,0.12)', width:'300px', maxWidth:'calc(100vw - 32px)', zIndex:200, overflow:'hidden' }}>
                    <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>Notifications</p>
                      {unread > 0 && <button type="button" onClick={markAllRead} style={{ fontSize:'11px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:0 }}>Mark all read</button>}
                    </div>
                    {notifs.length === 0 && (
                      <div style={{ padding:'24px 14px', textAlign:'center' as const }}>
                        <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>No notifications yet</p>
                      </div>
                    )}
                    <div style={{ maxHeight:'320px', overflowY:'auto' }}>
                      {notifs.map((n: any) => (
                        <a key={n.id} href={n.job_id ? (isTradie ? '/tradie/dashboard' : '/dashboard') : '#'}
                          style={{ display:'block', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.05)', textDecoration:'none', background: n.read ? 'white' : 'rgba(46,125,96,0.04)' }}
                          onClick={() => setNotifOpen(false)}>
                          <p style={{ fontSize:'13px', color:'#0A0A0A', margin:'0 0 2px', fontWeight: n.read ? 400 : 500 }}>{n.message}</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{new Date(n.created_at).toLocaleDateString('en-AU')}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Avatar + dropdown — desktop only */}
          {profile && (
            <div className="nav-avatar-desktop" style={{ position:'relative' }}>
              <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#0A0A0A', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.9)' }}>{initial}</span>
              </button>
              {dropdownOpen && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:150 }} onClick={() => setDropdownOpen(false)} />
                  <div style={{ position:'absolute', top:'44px', right:0, background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', boxShadow:'0 4px 20px rgba(28,43,50,0.12)', minWidth:'180px', zIndex:200, overflow:'hidden' }}>
                    <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{displayName}</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>{profile.email}</p>
                    </div>
                    <a href={profileHref} style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setDropdownOpen(false)}>My profile</a>
                    <a href="/trust" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setDropdownOpen(false)}>Dialogue Rating</a>
                    {profile?.org_id && (
                      <a href="/org/dashboard" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setDropdownOpen(false)}>Organisation dashboard</a>
                    )}
                    {!profile?.org_id && (
                      <a href="/org/setup" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#2E6A8F', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setDropdownOpen(false)}>Set up organisation →</a>
                    )}
                    <a href="/messages" style={{ display:'block', padding:'10px 14px', fontSize:'13px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setDropdownOpen(false)}>Messages</a>
                    <button type="button" onClick={signOut} style={{ display:'block', width:'100%', padding:'10px 14px', fontSize:'13px', color:'#D4522A', textAlign:'left' as const, background:'none', border:'none', cursor:'pointer' }}>Sign out</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button type="button"
            className="nav-hamburger"
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setDropdownOpen(false); setNotifOpen(false) }}
            style={{ width:'36px', height:'36px', borderRadius:'8px', background:'rgba(28,43,50,0.08)', border:'none', cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', flexShrink:0, flexDirection:'column' as const, gap:'4px', padding:'8px' }}>
            <span style={{ display:'block', width:'18px', height:'2px', background:'#0A0A0A', borderRadius:'1px', transition:'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ display:'block', width:'18px', height:'2px', background:'#0A0A0A', borderRadius:'1px', transition:'all 0.2s', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display:'block', width:'18px', height:'2px', background:'#0A0A0A', borderRadius:'1px', transition:'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:90, background:'rgba(28,43,50,0.3)' }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{ position:'fixed', top:'64px', left:0, right:0, background:'white', zIndex:95, boxShadow:'0 8px 24px rgba(28,43,50,0.15)', borderBottom:'1px solid rgba(28,43,50,0.1)', overflow:'hidden' }}>
            {/* User info */}
            {profile && (
              <div style={{ padding:'16px 20px', background:'#0A0A0A', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#D4522A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'white' }}>{initial}</span>
                </div>
                <div>
                  <p style={{ fontSize:'14px', fontWeight:500, color:'rgba(216,228,225,0.9)', margin:'0 0 2px' }}>{displayName}</p>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.5)', margin:0 }}>{profile.email}</p>
                </div>
              </div>
            )}

            {/* Back link */}
            {showBack && (
              <a href={defaultBackHref} style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)', fontWeight:500 }}
                onClick={() => setMobileMenuOpen(false)}>
                {defaultBackLabel}
              </a>
            )}

            {/* Nav links */}
            {profile && (
              <>
                <a href={dashboardHref} style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
                <a href="/messages" style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>Messages</a>
                <a href={profileHref} style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>My profile</a>
                <a href="/trust" style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>Dialogue Rating</a>
                {profile?.org_id && (
                  <a href="/org/dashboard" style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>Organisation dashboard</a>
                )}
                {isTradie && (
                  <a href="/tradie/vault" style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>Document vault</a>
                )}
                {!isTradie && (
                  <a href="/vault" style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#0A0A0A', textDecoration:'none', borderBottom:'1px solid rgba(28,43,50,0.06)' }} onClick={() => setMobileMenuOpen(false)}>Document vault</a>
                )}
                <button type="button" onClick={() => { setMobileMenuOpen(false); signOut() }}
                  style={{ display:'flex', alignItems:'center', width:'100%', padding:'14px 20px', fontSize:'14px', color:'#D4522A', background:'none', border:'none', cursor:'pointer', textAlign:'left' as const }}>
                  Sign out
                </button>
              </>
            )}
            {!profile && (
              <a href="/login" style={{ display:'flex', alignItems:'center', padding:'14px 20px', fontSize:'14px', color:'#D4522A', textDecoration:'none', fontWeight:500 }} onClick={() => setMobileMenuOpen(false)}>Sign in →</a>
            )}
          </div>
        </>
      )}
    </>
  )
}
