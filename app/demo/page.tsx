'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DemoPage() {
  const [step, setStep] = useState<'landing'|'creating'|'done'|'error'>('landing')
  const [error, setError] = useState<string|null>(null)

  const startDemo = async () => {
    setStep('creating')
    setError(null)
    try {
      const supabase = createClient()
      const demoId = Math.random().toString(36).slice(2, 9)
      const demoEmail = `demo-${demoId}@steadyhandtrade.app`
      const demoPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: demoEmail, password: demoPassword })
      if (authErr || !authData?.user) throw new Error(authErr?.message || 'Could not create demo account')
      const uid = authData.user.id
      await supabase.from('profiles').upsert({ id: uid, role: 'client', full_name: 'Demo User', email: demoEmail, suburb: 'Subiaco', is_demo: true, demo_data_seeded: true }, { onConflict: 'id' })
      const seedRes = await fetch('/api/seed-demo-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: uid }) })
      if (!seedRes.ok) throw new Error('Could not seed demo data')
      setStep('done')
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setStep('error')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', fontFamily:'sans-serif', display:'flex', flexDirection:'column' as const }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
          <Link href="/login" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>Log in</Link>
          <Link href="/signup" style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', textDecoration:'none', border:'1px solid rgba(255,255,255,0.15)', padding:'6px 14px', borderRadius:'6px' }}>Sign up</Link>
        </div>
      </nav>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ maxWidth:'520px', width:'100%' }}>
          {step === 'landing' && (
            <>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'rgba(216,228,225,0.3)', letterSpacing:'2px', marginBottom:'20px' }}>DEMO</p>
              <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'32px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'16px', lineHeight:1.25 }}>See a real job in progress</h1>
              <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.5)', lineHeight:'1.75', marginBottom:'36px' }}>We&apos;ll create an account with three sample jobs at different stages — delivery, agreement, and warranty. Click through each one to see how the platform works before committing to anything.</p>
              <div style={{ marginBottom:'32px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {[
                  { stage:'Delivery', color:'#C07830', bg:'rgba(192,120,48,0.1)', desc:'A switchboard upgrade in progress. Two milestones approved, one pending. A message thread between you and the tradie.' },
                  { stage:'Agreement', color:'#534AB7', bg:'rgba(107,79,168,0.1)', desc:'A bathroom renovation with a scope agreement drafted and signed by the tradie — waiting for your signature.' },
                  { stage:'Warranty', color:'#0F6E56', bg:'rgba(46,125,96,0.1)', desc:'A completed exterior repaint with an open warranty issue. The tradie has responded and offered to return.' },
                ].map(j => (
                  <div key={j.stage} style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'14px 16px', background:j.bg, border:`1px solid ${j.color}30`, borderRadius:'10px' }}>
                    <span style={{ fontSize:'11px', fontWeight:600, color:j.color, background:`${j.color}20`, padding:'2px 8px', borderRadius:'100px', flexShrink:0, marginTop:'1px' }}>{j.stage}</span>
                    <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.6)', lineHeight:'1.55', margin:0 }}>{j.desc}</p>
                  </div>
                ))}
              </div>
              <button type="button" onClick={startDemo} style={{ width:'100%', padding:'16px', background:'#D4522A', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:600, cursor:'pointer', marginBottom:'12px' }}>
                Start the demo →
              </button>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.25)', textAlign:'center' as const, lineHeight:'1.6' }}>
                No email required. A temporary account is created instantly.<br />You can delete the demo data and use the account for real jobs anytime.
              </p>
            </>
          )}
          {step === 'creating' && (
            <div style={{ textAlign:'center' as const }}>
              <div style={{ fontSize:'40px', marginBottom:'20px' }}>⏳</div>
              <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'rgba(216,228,225,0.9)', marginBottom:'12px' }}>Setting up your demo</h2>
              <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.4)', lineHeight:'1.7' }}>Creating your account and seeding three sample jobs.<br />This takes about 5 seconds.</p>
            </div>
          )}
          {step === 'done' && (
            <div style={{ textAlign:'center' as const }}>
              <div style={{ fontSize:'48px', marginBottom:'20px' }}>✓</div>
              <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#2E7D60', marginBottom:'12px' }}>Ready — taking you in</h2>
              <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.4)' }}>Your demo account is set up with three sample jobs.</p>
            </div>
          )}
          {step === 'error' && (
            <div style={{ textAlign:'center' as const }}>
              <div style={{ fontSize:'40px', marginBottom:'20px' }}>✗</div>
              <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', marginBottom:'12px' }}>Something went wrong</h2>
              <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.4)', marginBottom:'8px' }}>{error}</p>
              <button type="button" onClick={() => setStep('landing')} style={{ marginTop:'16px', fontSize:'13px', color:'rgba(216,228,225,0.6)', background:'transparent', border:'1px solid rgba(255,255,255,0.15)', padding:'8px 20px', borderRadius:'6px', cursor:'pointer' }}>Try again</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:'20px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'center', gap:'24px' }}>
        <Link href="/how-it-works" style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)', textDecoration:'none' }}>How it works</Link>
        <Link href="/trust" style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)', textDecoration:'none' }}>Trust</Link>
        <Link href="/signup" style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)', textDecoration:'none' }}>Sign up for real</Link>
      </div>
    </div>
  )
}
