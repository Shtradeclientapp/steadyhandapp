'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    cta: 'Current plan',
    ctaStyle: 'muted',
  },
  {
    id: 'business',
    name: 'Business',
    price: '$49',
    sub: 'per month',
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
      '2.5% completion fee (2% founding)',
    ],
    cta: 'Subscribe now',
    ctaStyle: 'primary',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$149',
    sub: 'per month',
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
      'Quarterly business review (30 min)',
      '1.5% completion fee (1% founding)',
    ],
    cta: 'Subscribe now',
    ctaStyle: 'primary',
  },
]

export default function TradieSubscribePage() {
  const [profile, setProfile] = useState<any>(null)
  const [tradie, setTradie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState<string|null>(null)
  const [submitting, setSubmitting] = useState<string|null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      const { data: trad } = await supabase.from('tradie_profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      setTradie(trad)
      setLoading(false)
    })
  }, [])

  const PRICE_IDS: Record<string, string> = {
    business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || '',
    pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
  }

  const subscribe = async (tierId: string) => {
    if (!profile || tierId === 'basic') return
    setSubmitting(tierId)
    const priceId = PRICE_IDS[tierId]
    if (!priceId) {
      alert('Subscription not available yet for this plan. Please contact support.')
      setSubmitting(null)
      return
    }
    const res = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_checkout', price_id: priceId, tradie_id: profile.id, email: profile.email, tier: tierId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert('Could not start checkout. Please try again.'); setSubmitting(null) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const subscribeSuccess = urlParams?.get('success') === 'true'
  const subscribeCancelled = urlParams?.get('cancelled') === 'true'

  const isFounding = tradie?.founding_member === true
  const currentTier = tradie?.subscription_tier || 'basic'

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background:'#1C2B32', padding:'40px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(212,82,42,0.15), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Membership</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(24px, 4vw, 36px)', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'8px' }}>STEADYHAND PLANS</h1>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', fontWeight:300, maxWidth:'500px' }}>
            Pay nothing until you get paid. Our completion fee aligns our success with yours.
          </p>
          {isFounding && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginTop:'16px', background:'rgba(212,82,42,0.15)', border:'1px solid rgba(212,82,42,0.3)', borderRadius:'100px', padding:'6px 14px' }}>
              <div style={{ width:'6px', height:'6px', background:'#D4522A', borderRadius:'50%' }} />
              <span style={{ fontSize:'12px', color:'#D4522A', fontWeight:500 }}>Founding member — your reduced rates are guaranteed permanently</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'40px 24px' }}>

        {/* Fee comparison banner */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'20px 24px', marginBottom:'32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' as const, gap:'16px' }}>
          <div>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>How completion fees work</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
              Steadyhand takes a small percentage only when a job is completed and paid. No upfront costs, no lead fees, no lock-in.
            </p>
          </div>
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

        {/* Tier cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px', marginBottom:'32px' }}>
          {TIERS.map(tier => {
            const isCurrent = currentTier === tier.id
            const isSubmitted = submitted === tier.id
            return (
              <div key={tier.id} style={{ background:'#E8F0EE', border:'2px solid ' + (isCurrent ? tier.color : 'rgba(28,43,50,0.1)'), borderRadius:'16px', overflow:'hidden', position:'relative' as const, display:'flex', flexDirection:'column' as const }}>
                {tier.badge && (
                  <div style={{ background:tier.color, padding:'6px 16px', textAlign:'center' as const }}>
                    <span style={{ fontSize:'11px', color:'white', fontWeight:600, letterSpacing:'0.5px' }}>{tier.badge.toUpperCase()}</span>
                  </div>
                )}
                <div style={{ padding:'24px', flex:1 }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'4px' }}>{tier.name.toUpperCase()}</p>
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
                  ) : isSubmitted ? (
                    <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'8px', padding:'11px', textAlign:'center' as const }}>
                      <span style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60' }}>✓ We'll be in touch soon</span>
                    </div>
                  ) : (
                    <button type="button" onClick={() => subscribe(tier.id)} disabled={submitting === tier.id}
                      style={{ width:'100%', background:tier.color, color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: submitting === tier.id ? 0.7 : 1 }}>
                      {submitting === tier.id ? 'Sending...' : tier.cta + ' →'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'16px' }}>COMMON QUESTIONS</p>
          {[
            { q:'When do I get charged the completion fee?', a:'Only when a job is fully completed and the client has approved the final milestone. Never upfront.' },
            { q:'What is a founding member?', a:'Tradies who join Steadyhand during our launch period receive a permanently reduced completion fee — 3% instead of 3.5%. That rate is yours to keep and never increases, regardless of what standard rates do later.' },
            { q:'When will Business and Pro be available?', a:'We are finalising these plans now. Register your interest and we will contact you directly before they launch.' },
            { q:'Can I switch plans later?', a:'Yes — you can upgrade or downgrade at any time. Your founding member rate stays with you regardless of which plan you are on.' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i < 3 ? '16px' : 0, paddingBottom: i < 3 ? '16px' : 0, borderBottom: i < 3 ? '1px solid rgba(28,43,50,0.08)' : 'none' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>{item.q}</p>
              <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
