'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PublicTradieProfile({ params }: { params: { id: string } }) {
  const [tradie, setTradie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('tradie_profiles')
      .select('id, business_name, bio, trade_categories, service_areas, logo_url, hero_url, licence_number, licence_type, licence_verified, years_experience, website, dialogue_score_avg, abn, phone, availability_status')
      .eq('id', params.id)
      .single()
      .then(({ data }) => { setTradie(data); setLoading(false) })
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F2F6F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontSize:'13px', color:'#7A9098' }}>Loading profile…</p>
    </div>
  )

  if (!tradie) return (
    <div style={{ minHeight:'100vh', background:'#F2F6F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontSize:'13px', color:'#7A9098' }}>Profile not found.</p>
    </div>
  )

  const initials = (tradie.business_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const score = tradie.dialogue_score_avg ? Number(tradie.dialogue_score_avg).toFixed(0) : null
  const availability = { available: { label: 'Available now', color: '#2E7D60', bg: 'rgba(46,125,96,0.1)' }, enquiries: { label: 'Taking enquiries', color: '#C07830', bg: 'rgba(192,120,48,0.1)' }, booked: { label: 'Fully booked', color: '#D4522A', bg: 'rgba(212,82,42,0.1)' } }[tradie.availability_status as string] || null

  return (
    <div style={{ minHeight:'100vh', background:'#F2F6F5' }}>

      {/* Hero */}
      <div style={{ background:'#0A0A0A', position:'relative', overflow:'hidden', minHeight:'200px' }}>
        {tradie.hero_url
          ? <img src={tradie.hero_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.4 }} />
          : <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 100%, rgba(46,125,96,0.25), transparent 60%)', pointerEvents:'none' }} />
        }
        <div style={{ maxWidth:'720px', margin:'0 auto', padding:'40px 24px 36px', position:'relative', zIndex:1 }}>
          <a href="javascript:history.back()" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(216,228,225,0.45)', textDecoration:'none', marginBottom:'28px' }}>
            ← Back
          </a>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'20px' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'16px', background: tradie.logo_url ? 'transparent' : '#1C2B32', border:'2px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontFamily:'var(--font-aboreto), sans-serif', color:'rgba(216,228,225,0.7)', flexShrink:0, overflow:'hidden' }}>
              {tradie.logo_url ? <img src={tradie.logo_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : initials}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' as const, marginBottom:'6px' }}>
                <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.95)', letterSpacing:'0.5px', margin:0 }}>{tradie.business_name}</h1>
                {tradie.licence_verified && (
                  <span style={{ fontSize:'11px', background:'rgba(46,125,96,0.2)', color:'#5AC99A', padding:'3px 10px', borderRadius:'100px', fontWeight:600, border:'1px solid rgba(46,125,96,0.3)' }}>✓ Verified</span>
                )}
                {availability && (
                  <span style={{ fontSize:'11px', background: availability.bg, color: availability.color, padding:'3px 10px', borderRadius:'100px', fontWeight:500 }}>{availability.label}</span>
                )}
              </div>
              <p style={{ fontSize:'14px', color:'rgba(216,228,225,0.5)', margin:'0 0 12px' }}>
                {(tradie.trade_categories || []).join(' · ')}{tradie.years_experience ? ` · ${tradie.years_experience} years experience` : ''}
              </p>
              <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' as const }}>
                {score && (
                  <div>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:'0 0 2px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Dialogue Rating</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'22px', fontWeight:700, color:'#B89FE0' }}>{score}</span>
                      <span style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)' }}>/100</span>
                    </div>
                  </div>
                )}
                {tradie.service_areas?.length > 0 && (
                  <div>
                    <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:'0 0 2px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Service areas</p>
                    <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.65)', margin:0 }}>{(tradie.service_areas || []).slice(0,4).join(', ')}{tradie.service_areas.length > 4 ? ' +' + (tradie.service_areas.length - 4) + ' more' : ''}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'32px 24px' }}>

        {/* Bio */}
        {tradie.bio && (
          <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'16px', boxShadow:'0 1px 3px rgba(28,43,50,0.04)' }}>
            <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'1px', textTransform:'uppercase' as const, margin:'0 0 12px' }}>About</p>
            <p style={{ fontSize:'15px', color:'#1C2B32', lineHeight:'1.8', margin:0 }}>{tradie.bio}</p>
          </div>
        )}

        {/* Credentials */}
        <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'16px', boxShadow:'0 1px 3px rgba(28,43,50,0.04)' }}>
          <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'1px', textTransform:'uppercase' as const, margin:'0 0 16px' }}>Credentials</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              tradie.licence_number && { label: 'Licence', value: tradie.licence_number + (tradie.licence_type ? ' · ' + tradie.licence_type : ''), verified: tradie.licence_verified },
              tradie.abn && { label: 'ABN', value: tradie.abn },
              tradie.years_experience && { label: 'Experience', value: tradie.years_experience + ' years' },
              tradie.website && { label: 'Website', value: tradie.website, href: tradie.website.startsWith('http') ? tradie.website : 'https://' + tradie.website },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label}>
                <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'0 0 3px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{item.label}</p>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer" style={{ fontSize:'14px', color:'#2E6A8F', textDecoration:'none', fontWeight:500 }}>{item.value} ↗</a>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <p style={{ fontSize:'14px', color:'#1C2B32', fontWeight:500, margin:0 }}>{item.value}</p>
                    {item.verified && <span style={{ fontSize:'10px', color:'#2E7D60', background:'rgba(46,125,96,0.08)', padding:'1px 7px', borderRadius:'100px', fontWeight:600 }}>✓ Verified</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dialogue score explainer */}
        {score && (
          <div style={{ background:'rgba(107,79,168,0.05)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'14px', padding:'20px 24px', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#6B4FA8', letterSpacing:'1px', textTransform:'uppercase' as const, margin:0 }}>Dialogue Rating</p>
              <span style={{ fontSize:'24px', fontWeight:700, color:'#6B4FA8' }}>{score}<span style={{ fontSize:'13px', fontWeight:400, color:'rgba(107,79,168,0.5)' }}>/100</span></span>
            </div>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.65', margin:0 }}>
              This rating reflects how clients experienced this tradie&apos;s communication across completed jobs — whether they felt informed about pricing, scope, risk and timeline. It measures client confidence, not communication volume. Discretion has an important place in trade.
            </p>
          </div>
        )}

        {/* Service areas */}
        {tradie.service_areas?.length > 0 && (
          <div style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'16px', boxShadow:'0 1px 3px rgba(28,43,50,0.04)' }}>
            <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'1px', textTransform:'uppercase' as const, margin:'0 0 14px' }}>Service areas</p>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px' }}>
              {tradie.service_areas.map((area: string) => (
                <span key={area} style={{ fontSize:'13px', color:'#1C2B32', background:'#F2F6F5', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'100px', padding:'5px 14px' }}>{area}</span>
              ))}
            </div>
          </div>
        )}

        {/* Steadyhand note */}
        <div style={{ background:'#0A0A0A', borderRadius:'14px', padding:'20px 24px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.5)', letterSpacing:'1px', margin:'0 0 6px' }}>STEADYHAND</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', lineHeight:'1.6', margin:0 }}>
            {tradie.licence_verified
              ? `${tradie.business_name} is a verified Steadyhand tradie. Their licence has been checked and confirmed.`
              : `${tradie.business_name} is listed in the Steadyhand directory.`}
          </p>
        </div>
      </div>
    </div>
  )
}
