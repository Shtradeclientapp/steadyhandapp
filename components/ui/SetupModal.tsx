'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TRADE_CATEGORIES = [
  'Plumbing','Electrical','Carpentry','Painting','Roofing','Tiling',
  'Concreting','Landscaping','Fencing','Rendering','Plastering','Bricklaying',
  'Air Conditioning','Solar','Flooring','Cabinetry','Glazing','Demolition',
  'Earthworks','Steel Fabrication','Pool & Spa','Pest Control','Cleaning','Other'
]

const SERVICE_AREAS = [
  'Perth Metro','Fremantle','Joondalup','Rockingham','Armadale','Swan',
  'Margaret River','Busselton','Bunbury','Mandurah','Geraldton','Albany',
  'Kalgoorlie','Broome','Port Hedland','Karratha','Esperance','Regional WA'
]

interface SetupModalProps {
  userId: string
  tradieId: string
  onComplete: () => void
}

export function SetupModal({ userId, tradieId, onComplete }: SetupModalProps) {
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const handleComplete = async () => {
    if (!businessName.trim()) { setError('Please enter your business name.'); return }
    if (!bio.trim() || bio.length < 30) { setError('Please write a short bio (at least 30 characters).'); return }
    if (selectedCategories.length === 0) { setError('Please select at least one trade category.'); return }
    if (selectedAreas.length === 0) { setError('Please select at least one service area.'); return }

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: updateErr } = await supabase
      .from('tradie_profiles')
      .update({
        business_name: businessName.trim(),
        bio: bio.trim(),
        trade_categories: selectedCategories,
        service_areas: selectedAreas,
        onboarding_step: 'active',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', tradieId)

    if (updateErr) {
      setError('Could not save — please try again.')
      setSaving(false)
      return
    }

    onComplete()
  }

  const STEPS = ['welcome', 'business', 'bio', 'categories', 'areas']
  const totalSteps = STEPS.length
  const isLast = step === totalSteps - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(28,43,50,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#E8F0EE', borderRadius: '20px', padding: '36px 32px',
        maxWidth: '520px', width: '100%',
        boxShadow: '0 24px 60px rgba(28,43,50,0.3)',
        maxHeight: '90vh', overflowY: 'auto' as const,
      }}>
        {/* Progress dots */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: '6px', borderRadius: '3px',
              background: i <= step ? '#D4522A' : 'rgba(28,43,50,0.15)',
              flex: i === step ? 2 : 1,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>👋</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'12px' }}>
              Let's get you set up
            </h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:'12px' }}>
              This takes about 2 minutes. We'll collect the basics so your clients can find and trust you on Steadyhand.
            </p>
            <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'10px', padding:'14px 16px', marginBottom:'24px' }}>
              {[
                '🏢 Your business name',
                '📝 A short bio',
                '🔧 Your trade categories',
                '📍 Your service areas',
              ].map(item => (
                <p key={item} style={{ fontSize:'13px', color:'#4A5E64', margin:'4px 0', lineHeight:'1.6' }}>{item}</p>
              ))}
            </div>
            <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'24px', lineHeight:'1.6' }}>
              You won't be able to invite clients until this is complete — it protects both you and them.
            </p>
          </div>
        )}

        {/* STEP 1 — Business name */}
        {step === 1 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🏢</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', marginBottom:'8px' }}>
              Your business name
            </h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'20px' }}>
              This is how clients will see you on Steadyhand.
            </p>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Smith Plumbing Co."
              autoFocus
              style={{ width:'100%', padding:'13px 14px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'10px', fontSize:'15px', color:'#0A0A0A', background:'white', outline:'none', boxSizing:'border-box' as const, marginBottom:'8px' }}
            />
            <p style={{ fontSize:'11px', color:'#9AA5AA' }}>Use your registered business name or trading name.</p>
          </div>
        )}

        {/* STEP 2 — Bio */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>📝</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', marginBottom:'8px' }}>
              Tell clients about your work
            </h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'20px' }}>
              A short bio helps clients understand your experience and approach before they hire you.
            </p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. 15 years experience in residential plumbing across the South West. We specialise in renovations and new builds, and pride ourselves on clear communication and tidy work."
              autoFocus
              rows={5}
              style={{ width:'100%', padding:'13px 14px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'10px', fontSize:'14px', color:'#0A0A0A', background:'white', outline:'none', resize:'vertical' as const, boxSizing:'border-box' as const, fontFamily:'sans-serif', lineHeight:'1.6', marginBottom:'8px' }}
            />
            <p style={{ fontSize:'11px', color: bio.length < 30 ? '#C07830' : '#2E7D60' }}>
              {bio.length} characters {bio.length < 30 ? `— need ${30 - bio.length} more` : '— ✓ good'}
            </p>
          </div>
        )}

        {/* STEP 3 — Trade categories */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔧</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', marginBottom:'8px' }}>
              What trades do you do?
            </h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'16px' }}>
              Select all that apply — clients search by trade type.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px', marginBottom:'12px' }}>
              {TRADE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  style={{
                    padding:'7px 14px', borderRadius:'100px', fontSize:'13px', cursor:'pointer', fontWeight:500,
                    background: selectedCategories.includes(cat) ? '#D4522A' : 'white',
                    color: selectedCategories.includes(cat) ? 'white' : '#4A5E64',
                    border: '1.5px solid ' + (selectedCategories.includes(cat) ? '#D4522A' : 'rgba(28,43,50,0.15)'),
                    transition: 'all 0.15s',
                  }}
                >{cat}</button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <p style={{ fontSize:'12px', color:'#2E7D60' }}>✓ {selectedCategories.length} selected</p>
            )}
          </div>
        )}

        {/* STEP 4 — Service areas */}
        {step === 4 && (
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>📍</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#0A0A0A', marginBottom:'8px' }}>
              Where do you work?
            </h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'16px' }}>
              Select all your service areas — this helps clients find tradies near them.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px', marginBottom:'12px' }}>
              {SERVICE_AREAS.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  style={{
                    padding:'7px 14px', borderRadius:'100px', fontSize:'13px', cursor:'pointer', fontWeight:500,
                    background: selectedAreas.includes(area) ? '#2E6A8F' : 'white',
                    color: selectedAreas.includes(area) ? 'white' : '#4A5E64',
                    border: '1.5px solid ' + (selectedAreas.includes(area) ? '#2E6A8F' : 'rgba(28,43,50,0.15)'),
                    transition: 'all 0.15s',
                  }}
                >{area}</button>
              ))}
            </div>
            {selectedAreas.length > 0 && (
              <p style={{ fontSize:'12px', color:'#2E7D60' }}>✓ {selectedAreas.length} selected</p>
            )}
          </div>
        )}

        {error && (
          <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px', marginTop:'4px' }}>{error}</p>
        )}

        {/* Nav buttons */}
        <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
          {step > 0 && (
            <button type="button" onClick={() => { setStep(s => s - 1); setError('') }}
              style={{ background:'transparent', color:'#7A9098', padding:'11px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? handleComplete : () => {
              setError('')
              if (step === 1 && !businessName.trim()) { setError('Please enter your business name.'); return }
              if (step === 2 && bio.length < 30) { setError('Please write a bit more about your work.'); return }
              if (step === 3 && selectedCategories.length === 0) { setError('Please select at least one trade.'); return }
              setStep(s => s + 1)
            }}
            disabled={saving}
            style={{ flex:1, background:'#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:600, border:'none', cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : isLast ? 'Complete setup →' : 'Next →'}
          </button>
        </div>

        <p style={{ fontSize:'11px', color:'#9AA5AA', textAlign:'center' as const, marginTop:'12px', lineHeight:'1.5' }}>
          Step {step + 1} of {totalSteps} — you can update these details any time in your profile
        </p>
      </div>
    </div>
  )
}
