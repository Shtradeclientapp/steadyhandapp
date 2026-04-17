'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOME_MONTHLY || '',
  annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_HOME_ANNUAL  || '',
}

const FEATURES_FREE = [
  'Up to 3 active job requests',
  'AI-matched tradie shortlist',
  'Scope agreement and milestone payments',
  '90-day warranty tracking',
  'Job message threads',
]

const FEATURES_HOME = [
  'Unlimited job requests',
  'Priority shortlisting — your jobs shown first',
  'Extended 180-day warranty period',
  'Home document vault — store warranties, certificates, receipts',
  'Build Journal for owner-builder projects',
  'Annual home health check — maintenance reminders based on your job history',
  'Dedicated support during active jobs',
]

export default function HomePlanPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<'monthly'|'annual'>('monthly')
  const [clientSecret, setClientSecret] = useState<string|null>(null)
  const [checkoutError, setCheckoutError] = useState<string|null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      setLoading(false)
    })
  }, [])

  const openCheckout = useCallback(async () => {
    if (!profile) return
    setStarting(true)
    setCheckoutError(null)
    const priceId = PRICE_IDS[billing]
    if (!priceId) { setCheckoutError('Subscription not available — please contact support.'); setStarting(false); return }
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_checkout', price_id: priceId, client_id: profile.id, email: profile.email, tier: 'home' }),
      })
      const data = await res.json()
      console.log('Stripe checkout response:', data)
      if (data.client_secret) {
        setClientSecret(data.client_secret)
      } else {
        setCheckoutError(data.error || 'Could not start checkout — please try again.')
      }
    } catch {
      setCheckoutError('Could not start checkout — please try again.')
    }
    setStarting(false)
  }, [profile, billing])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const isHome = profile?.subscription_plan === 'home'

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth:'820px', margin:'0 auto', padding:'48px 24px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'100px', padding:'5px 14px', marginBottom:'16px' }}>
            <span style={{ fontSize:'11px', color:'#2E7D60', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Steadyhand Home</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(24px,4vw,40px)', color:'#0A0A0A', letterSpacing:'2px', marginBottom:'12px' }}>YOUR HOME, LOOKED AFTER.</h1>
          <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:300, lineHeight:'1.7', maxWidth:'480px', margin:'0 auto' }}>
            Steadyhand Home turns a single job platform into a long-term relationship with your property — every job documented, every warranty tracked, every tradie rated.
          </p>
        </div>

        {isHome ? (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'14px', padding:'28px', textAlign:'center', marginBottom:'32px' }}>
            <p style={{ fontSize:'20px', marginBottom:'8px' }}>✓</p>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', marginBottom:'6px' }}>You are on Steadyhand Home</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'20px' }}>All features are active on your account.</p>
            <a href="/dashboard" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none' }}>← Back to dashboard</a>
          </div>
        ) : (
          <>
            {/* Billing toggle */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'28px' }}>
              <div style={{ display:'inline-flex', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'4px', gap:'4px' }}>
                {(['monthly', 'annual'] as const).map(b => (
                  <button key={b} type="button" onClick={() => setBilling(b)}
                    style={{ padding:'8px 20px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500,
                      background: billing === b ? '#0A0A0A' : 'transparent',
                      color: billing === b ? 'white' : '#7A9098' }}>
                    {b === 'monthly' ? 'Monthly' : 'Annual'}
                    {b === 'annual' && <span style={{ fontSize:'10px', color: billing === 'annual' ? 'rgba(216,228,225,0.6)' : '#2E7D60', marginLeft:'6px' }}>2 months free</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'32px' }}>

              {/* Free */}
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'16px', padding:'28px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:'8px' }}>Standard</p>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'36px', color:'#0A0A0A', marginBottom:'4px' }}>Free</p>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'24px' }}>No credit card required</p>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'24px' }}>
                  {FEATURES_FREE.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                      <span style={{ color:'#2E7D60', fontSize:'14px', flexShrink:0, marginTop:'1px' }}>✓</span>
                      <span style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.5' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'11px', borderRadius:'8px', background:'rgba(28,43,50,0.06)', textAlign:'center' as const, fontSize:'13px', color:'#7A9098' }}>
                  Your current plan
                </div>
              </div>

              {/* Home */}
              <div style={{ background:'#0A0A0A', border:'2px solid #2E7D60', borderRadius:'16px', padding:'28px', position:'relative' as const, overflow:'hidden' }}>
                <div style={{ position:'relative' as const, zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'rgba(216,228,225,0.5)', letterSpacing:'1px', textTransform:'uppercase' as const }}>Steadyhand Home</p>
                    <span style={{ fontSize:'10px', background:'rgba(46,125,96,0.3)', border:'1px solid rgba(46,125,96,0.4)', color:'#2E7D60', borderRadius:'100px', padding:'2px 8px', fontWeight:600 }}>FOUNDING RATE</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
                    <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'36px', color:'rgba(216,228,225,0.9)', margin:0 }}>
                      {billing === 'monthly' ? '$19' : '$190'}
                    </p>
                    <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', margin:0 }}>
                      {billing === 'monthly' ? '/month' : '/year'}
                    </p>
                  </div>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', marginBottom:'20px' }}>
                    {billing === 'annual' ? 'Equivalent to $15.83/month — 2 months free' : 'Founding member rate — yours to keep, permanently'}
                  </p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'24px' }}>
                    {FEATURES_HOME.map(f => (
                      <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                        <span style={{ color:'#2E7D60', fontSize:'14px', flexShrink:0, marginTop:'1px' }}>✓</span>
                        <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', lineHeight:'1.5' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {checkoutError && (
                    <p style={{ fontSize:'12px', color:'#D4522A', marginBottom:'8px' }}>⚠ {checkoutError}</p>
                  )}
                  <button type="button" onClick={openCheckout} disabled={starting}
                    style={{ width:'100%', background:'#2E7D60', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor: starting ? 'not-allowed' : 'pointer', opacity: starting ? 0.7 : 1 }}>
                    {starting ? 'Starting...' : `Subscribe ${billing === 'monthly' ? '— $19/month' : '— $190/year'} →`}
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded checkout */}
            {clientSecret && (
              <div style={{ marginBottom:'32px' }}>
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </>
        )}

        {/* Feature preview sections */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 6px' }}>HOME DOCUMENT VAULT</p>
          <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'16px' }}>Store warranties, compliance certificates, permits, receipts — all in one place.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
            {[
              { icon:'📋', label:'Scope agreements', sub:'All signed contracts' },
              { icon:'🔒', label:'Warranty certificates', sub:'With expiry tracking' },
              { icon:'✅', label:'Compliance docs', sub:'Certificates of compliance' },
            ].map(d => (
              <div key={d.label} style={{ background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'14px', textAlign:'center' as const }}>
                <div style={{ fontSize:'24px', marginBottom:'6px' }}>{d.icon}</div>
                <p style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'3px' }}>{d.label}</p>
                <p style={{ fontSize:'11px', color:'#7A9098' }}>{d.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 6px' }}>ANNUAL HOME HEALTH CHECK</p>
          <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'12px' }}>Maintenance reminders based on your property history and job records.</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6' }}>
            Based on the jobs you have completed through Steadyhand, we will remind you when maintenance is due — gutters before winter, air conditioning before summer, hot water systems approaching end of life.
          </p>
        </div>

      </div>
    </div>
  )
}
