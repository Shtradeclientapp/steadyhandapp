'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        window.location.href = '/login'
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <p>Loading...</p>
    </div>
  )

  if (!user) return null

  return (
    <div style={{ fontFamily:'sans-serif', background:'#C8D5D2', minHeight:'100vh', padding:'60px 40px' }}>
      <h1 style={{ fontSize:'32px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'4px' }}>STEADYHAND</h1>
      <p style={{ color:'#4A5E64', marginBottom:'40px' }}>Welcome, {user.email}</p>
      <div style={{ display:'flex', gap:'16px' }}>
        <a href="/request">
          <button style={{ background:'#D4522A', color:'white', padding:'14px 28px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'15px' }}>
            + New request
          </button>
        </a>
        <button
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          style={{ background:'#1C2B32', color:'white', padding:'14px 28px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'15px' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}