'use client'
import { useEffect, useState } from 'react'

export default function SubscribeReturnPage() {
  const [status, setStatus] = useState<'loading'|'success'|'open'|'error'>('loading')
  const [tier, setTier] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    if (!sessionId) { setStatus('error'); return }
    fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_session_status', session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        setStatus(data.status === 'complete' ? 'success' : data.status === 'open' ? 'open' : 'error')
        setTier(data.tier || '')
        setEmail(data.customer_email || '')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', padding:'24px' }}>
      <div style={{ background:'#E8F0EE', borderRadius:'20px', padding:'40px 36px', maxWidth:'480px', width:'100%', textAlign:'center' as const, boxShadow:'0 16px 48px rgba(28,43,50,0.12)' }}>
        {status === 'loading' && (
          <>
            <div style={{ width:'48px', height:'48px', border:'3px solid rgba(28,43,50,0.1)', borderTop:'3px solid #D4522A', borderRadius:'50%', margin:'0 auto 24px', animation:'spin 0.8s linear infinite' }} />
            <p style={{ color:'#4A5E64', fontSize:'14px' }}>Confirming your subscription...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(46,125,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'28px' }}>✓</div>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'10px' }}>You're subscribed</h1>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'8px' }}>
              Welcome to Steadyhand {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : ''}. Your account has been upgraded.
            </p>
            {email && <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'28px' }}>Confirmation sent to {email}</p>}
            <a href="/tradie/dashboard" style={{ display:'block', background:'#0A0A0A', color:'white', padding:'14px', borderRadius:'10px', fontSize:'14px', fontWeight:600, textDecoration:'none' }}>
              Go to dashboard →
            </a>
          </>
        )}
        {status === 'open' && (
          <>
            <p style={{ fontSize:'14px', color:'#C07830', marginBottom:'20px' }}>Your payment is still being processed. Please wait a moment.</p>
            <a href="/tradie/subscribe" style={{ fontSize:'13px', color:'#2E6A8F' }}>← Back to plans</a>
          </>
        )}
        {status === 'error' && (
          <>
            <p style={{ fontSize:'14px', color:'#D4522A', marginBottom:'20px' }}>Something went wrong confirming your subscription. Please contact support if you were charged.</p>
            <a href="/tradie/subscribe" style={{ fontSize:'13px', color:'#2E6A8F' }}>← Back to plans</a>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
