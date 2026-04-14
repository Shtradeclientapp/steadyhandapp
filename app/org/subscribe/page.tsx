'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIERS = [
  {
    id: 'property_starter',
    label: 'Starter',
    price: '$49',
    period: '/month',
    limit: 'Up to 10 properties',
    features: [
      'Up to 10 properties',
      'Full request-to-warranty flow',
      'Portfolio dashboard',
      'Invite tradies',
      'Custom warranty terms',
      'Document vault per property',
    ],
    color: '#2E7D60',
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PROPERTY_STARTER',
  },
  {
    id: 'property_growth',
    label: 'Growth',
    price: '$149',
    period: '/month',
    limit: 'Up to 50 properties',
    features: [
      'Up to 50 properties',
      'Everything in Starter',
      'Contractor list import (CSV)',
      'Multi-property job posting',
      'Reporting exports',
      'Team member access',
    ],
    color: '#2E6A8F',
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PROPERTY_GROWTH',
    recommended: true,
  },
  {
    id: 'property_enterprise',
    label: 'Enterprise',
    price: '$399',
    period: '/month',
    limit: 'Unlimited properties',
    features: [
      'Unlimited properties',
      'Everything in Growth',
      'Priority support',
      'Custom T&Cs',
      'Dedicated account setup',
    ],
    color: '#6B4FA8',
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PROPERTY_ENTERPRISE',
  },
]

const PRICE_IDS: Record<string, string> = {
  property_starter:    process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPERTY_STARTER || '',
  property_growth:     process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPERTY_GROWTH || '',
  property_enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPERTY_ENTERPRISE || '',
}

export default function OrgSubscribePage() {
  const [profile, setProfile] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string|null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string|null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof?.org_id) { window.location.href = '/org/setup'; return }
      setProfile(prof)
      const { data: orgData } = await supabase.from('organisations').select('*').eq('id', prof.org_id).single()
      setOrg(orgData)
      setLoading(false)
    })
  }, [])

  const startCheckout = async (tierId: string) => {
    const priceId = PRICE_IDS[tierId]
    if (!priceId) { setCheckoutError('Stripe price not configured for this tier. Please contact support.'); return }
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_checkout', price_id: priceId, client_id: profile.id, email: profile.email, tier: tierId }),
      })
      const data = await res.json()
      if (data.client_secret) {
        window.location.href = '/org/subscribe/checkout?secret=' + encodeURIComponent(data.client_secret) + '&tier=' + tierId
      } else {
        setCheckoutError(data.error || 'Could not start checkout')
      }
    } catch {
      setCheckoutError('Network error — please try again')
    }
    setCheckoutLoading(false)
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#1C2B32', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
        <a href="/org/dashboard" style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background:'#1C2B32', padding:'48px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, rgba(212,82,42,0.12), transparent 60%)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'8px' }}>Steadyhand Property</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'8px' }}>CHOOSE YOUR PLAN</h1>
          <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', maxWidth:'480px', margin:'0 auto' }}>
            Manage your property portfolio end-to-end — from job request to warranty, across every property.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'48px 24px' }}>
        <div className='tier-cards-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'32px' }}>
          {TIERS.map(tier => (
            <div key={tier.id} onClick={() => setSelectedTier(tier.id)}
              style={{ background: selectedTier === tier.id ? '#1C2B32' : 'white', border: tier.recommended ? '2px solid ' + tier.color : '1px solid rgba(28,43,50,0.12)', borderRadius:'16px', padding:'28px 24px', cursor:'pointer', position:'relative', transition:'all 0.15s' }}>
              {tier.recommended && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:tier.color, color:'white', fontSize:'10px', fontWeight:700, padding:'3px 12px', borderRadius:'100px', letterSpacing:'0.5px' }}>RECOMMENDED</div>}
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color: selectedTier === tier.id ? 'rgba(216,228,225,0.9)' : tier.color, letterSpacing:'0.5px', marginBottom:'4px' }}>{tier.label}</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'4px' }}>
                <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color: selectedTier === tier.id ? 'rgba(216,228,225,0.9)' : '#1C2B32' }}>{tier.price}</span>
                <span style={{ fontSize:'13px', color: selectedTier === tier.id ? 'rgba(216,228,225,0.4)' : '#7A9098' }}>{tier.period}</span>
              </div>
              <p style={{ fontSize:'12px', color: selectedTier === tier.id ? 'rgba(216,228,225,0.5)' : '#7A9098', marginBottom:'20px' }}>{tier.limit}</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ color: tier.color, fontSize:'12px', flexShrink:0, marginTop:'1px' }}>✓</span>
                    <span style={{ fontSize:'12px', color: selectedTier === tier.id ? 'rgba(216,228,225,0.7)' : '#4A5E64' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {checkoutError && <p style={{ fontSize:'13px', color:'#D4522A', textAlign:'center', marginBottom:'16px' }}>{checkoutError}</p>}

        <div style={{ textAlign:'center' as const }}>
          <button type="button" onClick={() => selectedTier && startCheckout(selectedTier)}
            disabled={!selectedTier || checkoutLoading}
            style={{ background: selectedTier ? '#D4522A' : 'rgba(28,43,50,0.2)', color:'white', padding:'14px 40px', borderRadius:'10px', fontSize:'15px', fontWeight:500, border:'none', cursor: selectedTier ? 'pointer' : 'not-allowed', opacity: checkoutLoading ? 0.7 : 1 }}>
            {checkoutLoading ? 'Starting checkout...' : selectedTier ? 'Subscribe to ' + TIERS.find(t => t.id === selectedTier)?.label + ' →' : 'Select a plan above'}
          </button>
          <p style={{ fontSize:'12px', color:'#7A9098', marginTop:'12px' }}>Cancel anytime. Billed monthly.</p>
        </div>
      </div>
    </div>
  )
}
