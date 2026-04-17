'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function XeroConnectedPage() {
  const [status, setStatus] = useState('Connecting your Xero account...')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      // Read tokens from cookie via a server action
      const res = await fetch('/api/xero/save-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('Xero connected successfully!')
        setDone(true)
        // Redirect to correct dashboard based on role
        const supabase2 = createClient()
        const { data: prof } = await supabase2.from('profiles').select('role, org_id').eq('id', session.user.id).single()
        setTimeout(() => {
          if (prof?.org_id) window.location.href = '/org/dashboard?xero=connected'
          else if (prof?.role === 'tradie') window.location.href = '/tradie/dashboard?xero=connected'
          else window.location.href = '/dashboard?xero=connected'
        }, 2000)
      } else {
        setStatus('Connection failed — please try again.')
        setError(true)
      }
    })
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', maxWidth:'400px', width:'100%', margin:'0 24px' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>{done ? '✓' : error ? '✗' : '⏳'}</div>
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color: error ? '#D4522A' : '#0A0A0A', marginBottom:'8px' }}>XERO</h2>
        <p style={{ fontSize:'14px', color:'#4A5E64' }}>{status}</p>
        {error && (
          <a href="/tradie/dashboard" style={{ display:'inline-block', marginTop:'20px', background:'#0A0A0A', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'13px' }}>Back to dashboard</a>
        )}
      </div>
    </div>
  )
}
