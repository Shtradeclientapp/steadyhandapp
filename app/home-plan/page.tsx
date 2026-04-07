'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      setLoading(false)
    })
  }, [])

  const registerInterest = async () => {
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ subscription_plan: 'home_interest' }).eq('id', profile.id)
    // Log interest internally via profile update only
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  const isHome = profile?.subscription_plan === 'home' || profile?.subscription_plan === 'home_interest'

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth:'820px', margin:'0 auto', padding:'48px 24px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'100px', padding:'5px 14px', marginBottom:'16px' }}>
            <span style={{ fontSize:'11px', color:'#2E7D60', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>Steadyhand Home</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(24px,4vw,40px)', color:'#1C2B32', letterSpacing:'2px', marginBottom:'12px' }}>YOUR HOME, LOOKED AFTER.</h1>
          <p style={{ fontSize:'16px', color:'#4A5E64', fontWeight:300, lineHeight:'1.7', maxWidth:'480px', margin:'0 auto' }}>
            Steadyhand Home turns a single job platform into a long-term relationship with your property — every job documented, every warranty tracked, every tradie rated.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'40px' }}>

          {/* Free */}
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'16px', padding:'28px' }}>
            <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' }}>Standard</p>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'36px', color:'#1C2B32', marginBottom:'4px' }}>Free</p>
            <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'24px' }}>No credit card required</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' }}>
              {FEATURES_FREE.map(f => (
                <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                  <span style={{ color:'#2E7D60', fontSize:'14px', flexShrink:0, marginTop:'1px' }}>✓</span>
                  <span style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.5' }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'11px', borderRadius:'8px', background:'rgba(28,43,50,0.06)', textAlign:'center', fontSize:'13px', color:'#7A9098' }}>
              Your current plan
            </div>
          </div>

          {/* Home */}
          <div style={{ background:'#1C2B32', border:'2px solid #2E7D60', borderRadius:'16px', padding:'28px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(46,125,96,0.25), transparent 60%)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'rgba(216,228,225,0.5)', letterSpacing:'1px', textTransform:'uppercase' }}>Steadyhand Home</p>
                <span style={{ fontSize:'10px', background:'rgba(46,125,96,0.3)', border:'1px solid rgba(46,125,96,0.4)', color:'#2E7D60', borderRadius:'100px', padding:'2px 8px', fontWeight:600 }}>FOUNDING RATE</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'36px', color:'rgba(216,228,225,0.9)' }}>$19</p>
                <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)' }}>/month</p>
              </div>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', marginBottom:'24px' }}>Founding member rate — locked in for life</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' }}>
                {FEATURES_HOME.map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                    <span style={{ color:'#2E7D60', fontSize:'14px', flexShrink:0, marginTop:'1px' }}>✓</span>
                    <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', lineHeight:'1.5' }}>{f}</span>
                  </div>
                ))}
              </div>
              {submitted || isHome ? (
                <div style={{ padding:'12px', borderRadius:'8px', background:'rgba(46,125,96,0.2)', border:'1px solid rgba(46,125,96,0.3)', textAlign:'center', fontSize:'13px', color:'#2E7D60', fontWeight:500 }}>
                  ✓ Interest registered — we will be in touch
                </div>
              ) : (
                <button type="button" onClick={registerInterest} disabled={submitting}
                  style={{ width:'100%', background:'#2E7D60', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Registering...' : 'Register interest — founding rate →'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Home document vault preview */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px', marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>📁</div>
            <div>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.5px', margin:'0 0 3px' }}>HOME DOCUMENT VAULT</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Store warranties, compliance certificates, permits, receipts — all in one place</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
            {[
              { icon:'📋', label:'Scope agreements', sub:'All signed contracts' },
              { icon:'🔒', label:'Warranty certificates', sub:'With expiry tracking' },
              { icon:'✅', label:'Compliance docs', sub:'Certificates of compliance' },
            ].map(d => (
              <div key={d.label} style={{ background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                <div style={{ fontSize:'24px', marginBottom:'6px' }}>{d.icon}</div>
                <p style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', marginBottom:'3px' }}>{d.label}</p>
                <p style={{ fontSize:'11px', color:'#7A9098' }}>{d.sub}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'14px', padding:'12px 14px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px' }}>
            <p style={{ fontSize:'12px', color:'#2E7D60', margin:0 }}>Available with Steadyhand Home — launching soon for founding members.</p>
          </div>
        </div>

        {/* Health check preview */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#1C2B32', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>🏠</div>
            <div>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.5px', margin:'0 0 3px' }}>ANNUAL HOME HEALTH CHECK</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Maintenance reminders based on your property history and job records</p>
            </div>
          </div>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'14px' }}>
            Based on the jobs you have completed through Steadyhand, we will remind you when maintenance is due — gutters before winter, air conditioning before summer, hot water systems approaching end of life. Your job history becomes a maintenance schedule.
          </p>
          <div style={{ padding:'12px 14px', background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.15)', borderRadius:'8px' }}>
            <p style={{ fontSize:'12px', color:'#C07830', margin:0 }}>Available with Steadyhand Home — launching soon for founding members.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
