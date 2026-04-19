'use client'
import { useEffect, useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    sub: 'Forever',
    fee: '3.5%',
    foundingFee: '3%',
    color: '#2E7D60',
    badge: null,
    features: [
      'Verified profile listing',
      'Job matching and shortlisting',
      'Scope agreement and milestone payments',
      'Warranty tracking',
      'Dialogue Rating',
      '3.5% completion fee (3% founding)',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '$49',
    sub: '/month',
    fee: '2.5%',
    foundingFee: '2%',
    color: '#2E6A8F',
    badge: 'Most popular',
    features: [
      'Everything in Basic',
      'Priority placement in shortlists',
      'Compare stage analytics',
      'Saved quote templates',
      'Monthly Dialogue Rating report',
      'Dedicated onboarding call',
      '2 worker seats included (field team access)',
      '2.5% completion fee (2% founding)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$149',
    sub: '/month',
    fee: '1.5%',
    foundingFee: '1%',
    color: '#6B4FA8',
    badge: 'Best value at scale',
    features: [
      'Everything in Business',
      '1 hour digital consulting per month',
      'White-label scope documents',
      'Advanced analytics and pipeline reporting',
      'Priority support — 1 business day SLA',
      '5 worker seats included',
      'Quarterly business review (30 min)',
      '1.5% completion fee (1% founding)',
    ],
  },
]

const PRICE_IDS: Record<string, string> = {
  business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || '',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
}

export default function TradieSubscribePage() {
  const [profile, setProfile] = useState<any>(null)
  const [tradie, setTradie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string|null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string|null>(null)
  const [clientSecret, setClientSecret] = useState<string|null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      const { data: trad } = await supabase.from('tradie_profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      if (prof?.role === 'tradie') {
        const { data: tp } = await supabase.from('tradie_profiles').select('*').eq('id', prof.id).single()
        setTradie(tp)
      }
      setTradie(trad)
      setLoading(false)
    })
  }, [])

  const openCheckout = useCallback(async (tierId: string) => {
    if (!profile || tierId === 'basic') return
    const priceId = PRICE_IDS[tierId]
    if (!priceId) { setCheckoutError('This plan is not yet available. Please contact support.'); return }
    setSelectedTier(tierId)
    setCheckoutLoading(true)
    setClientSecret(null)
    const res = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_checkout', price_id: priceId, tradie_id: profile.id, email: profile.email, tier: tierId }),
    })
    const data = await res.json()
    if (data.client_secret) {
      setClientSecret(data.client_secret)
    } else {
      setCheckoutError(data.error || 'Could not start checkout. Please try again.')
      setSelectedTier(null)
    }
    setCheckoutLoading(false)
  }, [profile])

  const openPortal = async () => {
    if (!profile) return
    const res = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_portal_session', tradie_id: profile.id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setCheckoutError('Could not open billing portal. Please try again.')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const isFounding = tradie?.founding_member === true
  const currentTier = tradie?.subscription_tier || 'basic'
  const isSubscribed = currentTier !== 'basic'

  const currentTier = tradie?.free_tier_override || tradie?.subscription_tier
  const isSubscribed = tradie?.subscription_active === true

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>

      {/* Hero */}
      <div style={{ background:'#0A0A0A', padding:'48px 24px', textAlign:'center' as const }}>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'rgba(216,228,225,0.4)', letterSpacing:'2px', marginBottom:'10px' }}>PLANS & PRICING</p>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'1.5px', marginBottom:'12px' }}>CHOOSE YOUR PLAN</h1>
        <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.55)', maxWidth:'480px', margin:'0 auto', lineHeight:'1.7' }}>
          Pay nothing until you get paid. Our completion fee aligns our success with yours.
        </p>
        {isFounding && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginTop:'16px', background:'rgba(212,82,42,0.15)', border:'1px solid rgba(212,82,42,0.3)', borderRadius:'100px', padding:'6px 14px' }}>
            <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
            <span style={{ fontSize:'12px', color:'#D4522A', fontWeight:500 }}>Founding member — your reduced rates are guaranteed permanently</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'40px 24px' }}>

        {/* Current plan banner for subscribers */}
        {isSubscribed && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'18px 24px', marginBottom:'28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>
                Current plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
              </p>
              <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>Manage your subscription, update payment details or cancel at any time.</p>
            </div>
            <button type="button" onClick={openPortal}
              style={{ background:'#0A0A0A', color:'white', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'13px', fontWeight:500, cursor:'pointer', flexShrink:0 }}>
              Manage subscription →
            </button>
          </div>
        )}

        {/* Tier cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px', marginBottom: clientSecret ? '0' : '32px' }}>
          {TIERS.map(tier => {
            const isCurrent = currentTier === tier.id
            const isSelected = selectedTier === tier.id
            return (
              <div key={tier.id} style={{ background:'#E8F0EE', border:'2px solid ' + (isSelected ? tier.color : isCurrent ? tier.color + '80' : 'rgba(28,43,50,0.1)'), borderRadius:'16px', overflow:'hidden', display:'flex', flexDirection:'column' as const, transition:'border-color 0.2s' }}>
                {tier.badge && (
                  <div style={{ background:tier.color, padding:'6px 16px', textAlign:'center' as const }}>
                    <span style={{ fontSize:'11px', color:'white', fontWeight:600, letterSpacing:'0.5px' }}>{tier.badge.toUpperCase()}</span>
                  </div>
                )}
                <div style={{ padding:'24px', flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'4px' }}>{tier.name.toUpperCase()}</p>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'4px' }}>
                    <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:tier.color }}>{tier.price}</span>
                    <span style={{ fontSize:'13px', color:'#7A9098' }}>{tier.sub}</span>
                  </div>
                  <p style={{ fontSize:'12px', color:tier.color, fontWeight:500, marginBottom:'20px' }}>
                    + {isFounding ? tier.foundingFee : tier.fee} completion fee
                    {isFounding && <span style={{ color:'#D4522A' }}> (founding rate)</span>}
                  </p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                    {tier.features.map((f, i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                        <span style={{ color:tier.color, flexShrink:0, fontSize:'13px' }}>✓</span>
                        <span style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.5' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding:'0 24px 24px' }}>
                  {isCurrent ? (
                    <div style={{ background:tier.color + '11', border:'1px solid ' + tier.color + '33', borderRadius:'8px', padding:'11px', textAlign:'center' as const }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:tier.color }}>✓ Current plan</span>
                    </div>
                  ) : tier.id === 'basic' ? (
                    <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', padding:'11px', textAlign:'center' as const }}>
                      <span style={{ fontSize:'13px', color:'#7A9098' }}>Free forever</span>
                    </div>
                  ) : isSelected && checkoutLoading ? (
                    <div style={{ background:tier.color + '11', border:'1px solid ' + tier.color + '33', borderRadius:'8px', padding:'11px', textAlign:'center' as const }}>
                      <span style={{ fontSize:'13px', color:tier.color }}>Loading checkout...</span>
                    </div>
                  ) : isSelected && clientSecret ? (
                    <div style={{ background:tier.color + '11', border:'1px solid ' + tier.color + '33', borderRadius:'8px', padding:'11px', textAlign:'center' as const }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:tier.color }}>↓ Complete payment below</span>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openCheckout(tier.id)}
                      style={{ width:'100%', background:tier.color, color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                      Subscribe now →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Embedded checkout panel */}
        {checkoutError && (
          <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', padding:'12px 16px', margin:'0 0 16px' }}>
            <p style={{ fontSize:'13px', color:'#D4522A', margin:0 }}>⚠ {checkoutError}</p>
          </div>
        )}
        {clientSecret && (
          <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'16px', overflow:'hidden', marginBottom:'32px', boxShadow:'0 8px 32px rgba(28,43,50,0.08)' }}>
            <div style={{ background:'#0A0A0A', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.8)', letterSpacing:'0.5px', margin:0 }}>
                COMPLETE YOUR SUBSCRIPTION
              </p>
              <button type="button" onClick={() => { setClientSecret(null); setSelectedTier(null) }}
                style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'12px', color:'rgba(216,228,225,0.6)', cursor:'pointer' }}>
                ✕ Cancel
              </button>
            </div>
            <div style={{ padding:'24px' }}>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        )}

        {/* Fee comparison */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'20px 24px', marginBottom:'24px' }}>
          <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', marginBottom:'4px' }}>How completion fees work</p>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:'0 0 16px' }}>
            Steadyhand takes a small percentage only when a job is completed and paid. No upfront costs, no lead fees, no lock-in.
          </p>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' as const }}>
            {TIERS.map(t => (
              <div key={t.id} style={{ textAlign:'center' as const, padding:'10px 16px', background:'white', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 2px' }}>{t.name}</p>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:t.color, margin:0 }}>
                  {isFounding ? t.foundingFee : t.fee}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'16px' }}>COMMON QUESTIONS</p>
          {[
            { q:'When do I get charged the completion fee?', a:'Only when a job is fully completed and the client has approved the final milestone. Never upfront.' },
            { q:'What is a founding member?', a:'Tradies who join Steadyhand during our launch period receive a permanently reduced completion fee — 3% instead of 3.5%. That rate is yours to keep and never increases, regardless of what standard rates do later.' },
            { q:'Can I cancel my subscription?', a:'Yes — you can cancel or change plans at any time through the billing portal. Your founding member completion fee rate stays with you regardless of which plan you are on.' },
            { q:'Is my payment secure?', a:'Yes. Payments are processed by Stripe, the same infrastructure used by Amazon, Shopify and millions of other businesses. Steadyhand never stores your card details.' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i < 3 ? '16px' : 0, paddingBottom: i < 3 ? '16px' : 0, borderBottom: i < 3 ? '1px solid rgba(28,43,50,0.08)' : 'none' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', marginBottom:'4px' }}>{item.q}</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
