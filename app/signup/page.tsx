'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select } from '@/components/ui'
import Link from 'next/link'

const TRADES = [
  'Plumbing & Gas', 'Electrical', 'Carpentry & Joinery', 'Tiling',
  'Painting & Decorating', 'Roofing', 'Landscaping', 'Air Conditioning', 'General Handyman',
]

const SUBURBS = [
  'Perth Metro', 'Fremantle', 'Subiaco', 'Cottesloe', 'Leederville',
  'Mandurah', 'Bunbury', 'Geraldton', 'Albany', 'Broome', 'Kalgoorlie',
]

export default function SignupPage() {
  const [role, setRole] = useState<'client' | 'tradie'>('client')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', suburb: '',
    businessName: '', tradeCategory: '', serviceArea: '',
    licenceNumber: '', abn: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    // 1. Create auth user
    const { data, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authErr || !data.user) { setError(authErr?.message ?? 'Signup failed'); setLoading(false); return }

    const uid = data.user.id

    // 2. Create profile
    await supabase.from('profiles').insert({
      id: uid, role, full_name: form.fullName, email: form.email, suburb: form.suburb,
    })

    // 3. Create tradie profile if applicable
    if (role === 'tradie') {
      await supabase.from('tradie_profiles').insert({
        id: uid,
        business_name: form.businessName,
        trade_categories: [form.tradeCategory],
        service_areas: [form.serviceArea],
        licence_number: form.licenceNumber,
        abn: form.abn,
        subscription_active: false,
      })
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="flex flex-col justify-center px-16 py-12 bg-mist overflow-y-auto">
        <div className="max-w-sm w-full mx-auto">
          <div className="font-display text-3xl text-terra mb-8">STEADYHAND</div>

          {/* Role toggle */}
          {step === 1 && (
            <>
              <h1 className="font-display text-3xl text-ink mb-1.5">Create account</h1>
              <p className="text-[14px] text-muted mb-6">What best describes you?</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['client', 'tradie'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-4 border-[1.5px] rounded-xl text-center transition-all ${
                      role === r
                        ? 'border-terra bg-terra/5'
                        : 'border-ink/15 bg-off hover:border-ink/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">{r === 'client' ? '🏠' : '🔧'}</div>
                    <div className="font-display text-base text-ink">
                      {r === 'client' ? 'Homeowner / Client' : 'Trade Business'}
                    </div>
                    <div className="text-[11px] text-muted mt-1">
                      {r === 'client' ? 'Post jobs, manage projects' : 'Receive leads, quote jobs'}
                    </div>
                  </button>
                ))}
              </div>

              <Input label="Full name" placeholder="Sarah Mitchell" value={form.fullName} onChange={set('fullName')} />
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              <Input label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} />
              <Select label="Your suburb" value={form.suburb} onChange={set('suburb')}>
                <option value="">Select suburb...</option>
                {SUBURBS.map(s => <option key={s}>{s}</option>)}
              </Select>

              {role === 'tradie' ? (
                <Button variant="terra" size="lg" className="w-full" onClick={() => setStep(2)}>
                  Continue — trade details →
                </Button>
              ) : (
                <Button variant="terra" size="lg" loading={loading} className="w-full" onClick={handleSignup}>
                  Create account →
                </Button>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-3xl text-ink mb-1.5">Trade details</h1>
              <p className="text-[14px] text-muted mb-6">Your business and credentials</p>

              <Input label="Business name" placeholder="Walsh Plumbing & Gas" value={form.businessName} onChange={set('businessName')} />
              <Select label="Trade category" value={form.tradeCategory} onChange={set('tradeCategory')}>
                <option value="">Select trade...</option>
                {TRADES.map(t => <option key={t}>{t}</option>)}
              </Select>
              <Select label="Primary service area" value={form.serviceArea} onChange={set('serviceArea')}>
                <option value="">Select area...</option>
                {SUBURBS.map(s => <option key={s}>{s}</option>)}
              </Select>
              <Input label="WA Licence number" placeholder="PL12345" value={form.licenceNumber} onChange={set('licenceNumber')} />
              <Input label="ABN" placeholder="12 345 678 901" value={form.abn} onChange={set('abn')} />

              <div className="p-3.5 bg-terra/8 border border-terra/20 rounded-lg text-[12px] text-terra mb-5">
                <strong>Verification:</strong> Upload your licence and insurance docs after sign-up. Your profile goes live once reviewed (usually 1 business day).
              </div>

              {error && <div className="mb-4 text-[13px] text-terra">{error}</div>}

              <div className="flex gap-2.5">
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="terra" size="lg" loading={loading} className="flex-1" onClick={handleSignup}>
                  Create account →
                </Button>
              </div>
            </>
          )}

          <p className="text-[13px] text-muted mt-5 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-stage-1 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="bg-ink relative overflow-hidden flex items-center justify-center p-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(46,125,96,0.25),transparent_55%)]" />
        <blockquote className="relative z-10 max-w-sm">
          <p className="font-sans text-[18px] font-light italic leading-relaxed text-mist-l/85 mb-5">
            "The scope agreement meant there were no surprises. Both sides knew exactly what was happening and when."
          </p>
          <cite className="text-[12px] text-mist-l/45 not-italic">— Emma, Homeowner, Subiaco WA</cite>
        </blockquote>
      </div>
    </div>
  )
}
