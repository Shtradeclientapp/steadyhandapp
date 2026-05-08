'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradePendingPage() {
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name, onboarding_step)').eq('id', session.user.id).single()
      setProfile(data)
      // If already verified, redirect to dashboard
      if (data?.tradie?.onboarding_step === 'active') {
        const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
        window.location.href = redirectParam || '/tradie/dashboard'
      }
    })
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ maxWidth:'520px', width:'100%', background:'#E8F0EE', borderRadius:'16px', overflow:'hidden', border:'1px solid rgba(28,43,50,0.1)' }}>
        <div style={{ background:'#0A0A0A', padding:'24px 28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', margin:'0 0 4px' }}>APPLICATION RECEIVED</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', margin:0 }}>Steadyhand tradie verification</p>
        </div>
        <div style={{ padding:'32px 28px' }}>
          <div style={{ width:'48px', height:'48px', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'20px' }}>✓</div>
          <h2 style={{ fontSize:'20px', fontWeight:600, color:'#0A0A0A', margin:'0 0 12px', fontFamily:'sans-serif' }}>
            Thanks{profile?.tradie?.business_name ? `, ${profile.tradie.business_name}` : ''}.
          </h2>
          <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', margin:'0 0 20px' }}>
            Your application is being reviewed by the Steadyhand team. We verify every tradie before they appear in client searches — this usually takes one business day.
          </p>
          <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px 18px', marginBottom:'24px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 10px' }}>What happens next</p>
            {[
              'Our team will check your licence details against the WA register',
              'We will call you to confirm your details and answer any questions',
              'Once verified, you will receive an email and your profile goes live',
              'Clients can then find and invite you through the Steadyhand directory',
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', marginBottom: i < 3 ? '8px' : 0 }}>
                <span style={{ fontSize:'12px', color:'#2E7D60', fontWeight:600, minWidth:'18px', marginTop:'1px' }}>{i+1}.</span>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{s}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:'13px', color:'#7A9098', margin:'0 0 16px' }}>
            In the meantime, you can complete your profile to make sure everything is ready when you go live.
          </p>
          <a href="/tradie/profile" style={{ display:'block', background:'#0A0A0A', color:'white', padding:'12px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:500, textDecoration:'none', textAlign:'center' as const, marginBottom:'10px' }}>
            Complete your profile →
          </a>
          <a href="/tradie/dashboard" style={{ display:'block', color:'#7A9098', padding:'10px', fontSize:'13px', textDecoration:'none', textAlign:'center' as const }}>
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
