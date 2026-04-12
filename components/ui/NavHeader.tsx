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

  // Load on mount if profile present
  useState(() => { if (profile) loadNotifs() })

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
            <button type="button" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) { loadNotifs(); markAllRead() } }}
              style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(28,43,50,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 }}>
              <span style={{ fontSize:'16px', lineHeight:1 }}>🔔</span>
              {unread > 0 && (
                <span style={{ position:'absolute', top:'2px', right:'2px', width:'8px', height:'8px', borderRadius:'50%', background:'#D4522A', border:'2px solid rgba(200,213,210,0.95)' }} />
              )}
            </button>
            {notifOpen && (
              <>
                <div style={{ position:'fixed', inset:0, zIndex:150 }} onClick={() => setNotifOpen(false)} />
                <div style={{ position:'absolute', top:'42px', right:0, background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', boxShadow:'0 4px 20px rgba(28,43,50,0.12)', width:'300px', zIndex:200, overflow:'hidden' }}>
                  <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Notifications</p>
                    {unread > 0 && <button type="button" onClick={markAllRead} style={{ fontSize:'11px', color:'#7A9098', background:'none', border:'none', cursor:'pointer', padding:0 }}>Mark all read</button>}
                  </div>
                  {notifs.length === 0 && (
                    <div style={{ padding:'24px 14px', textAlign:'center' }}>
                      <p style={{ fontSize:'13px', color:'#7A9098', margin:0 }}>No notifications yet</p>
                    </div>
                  )}
                  <div style={{ maxHeight:'320px', overflowY:'auto' }}>
                    {notifs.map((n: any) => (
                      <a key={n.id} href={n.job_id ? (isTradie ? '/tradie/dashboard' : '/dashboard') : '#'}
                        style={{ display:'block', padding:'10px 14px', borderBottom:'1px solid rgba(28,43,50,0.05)', textDecoration:'none', background: n.read ? 'white' : 'rgba(46,125,96,0.04)' }}
                        onClick={() => setNotifOpen(false)}>
                        <p style={{ fontSize:'13px', color:'#1C2B32', margin:'0 0 2px', fontWeight: n.read ? 400 : 500 }}>{n.message}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{new Date(n.created_at).toLocaleDateString('en-AU')}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
