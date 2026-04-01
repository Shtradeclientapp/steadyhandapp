'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { Button, Card, Input, Select, Textarea, StepDots } from '@/components/ui'
import { Dropzone } from '@/components/forms/Dropzone'

const TRADES = ['Plumbing & Gas','Electrical','Carpentry & Joinery','Tiling','Painting & Decorating','Roofing','Landscaping','Air Conditioning','General Handyman']
const SUBURBS = ['Subiaco','Fremantle','Perth CBD','Cottesloe','Leederville','Mandurah','Bunbury','Geraldton','Albany','Broome','Kalgoorlie']

export default function RequestPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])

  const [form, setForm] = useState({
    trade_category: '', title: '', description: '',
    suburb: '', property_type: 'Residential house',
    urgency: 'Within 2 weeks', budget_range: '',
    warranty_period: '90', preferred_start: '',
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submitJob = async () => {
    setSubmitting(true)
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, warranty_period: Number(form.warranty_period) }),
    })
    const { job, error } = await res.json()
    if (error) { alert(error); setSubmitting(false); return }
    setJobId(job.id)
    setStep(3)
    setSubmitting(false)
  }

  const STAGE_TAG = (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border mb-3"
      style={{ color:'var(--s1)', borderColor:'rgba(46,125,96,.25)', background:'rgba(46,125,96,.07)' }}>
      Stage 1
    </div>
  )

  return (
    <>
      <Nav />
      <div className="pt-[60px] min-h-screen">
        <div className="max-w-[640px] mx-auto px-8 py-12">
          {STAGE_TAG}
          <h1 className="font-display text-4xl text-ink mb-1.5">Define your request</h1>
          <p className="text-[15px] text-muted font-light mb-8">
            You set the brief. The more detail you give, the better your AI-matched shortlist.
          </p>

          {step < 3 && <StepDots total={3} current={step} />}

          {/* Step 0 — Job details */}
          {step === 0 && (
            <Card className="animate-slide-up">
              <p className="text-[10px] tracking-[1px] uppercase font-medium text-muted-l mb-4">What do you need done?</p>
              <Select label="Trade category" value={form.trade_category} onChange={set('trade_category')} required>
                <option value="">Select trade...</option>
                {TRADES.map(t => <option key={t}>{t}</option>)}
              </Select>
              <Input label="Request title" placeholder="e.g. Full bathroom renovation — Subiaco" value={form.title} onChange={set('title')} />
              <Textarea
                label="Describe what you need"
                placeholder="What needs doing? Include property age, access issues, materials preference, anything the tradie should know upfront."
                value={form.description} onChange={set('description')}
                hint="Tip: mention your home's age and any access constraints"
              />
              <Button variant="sage" size="lg" className="w-full"
                disabled={!form.trade_category || !form.title || !form.description}
                onClick={() => setStep(1)}>
                Continue — location & timing →
              </Button>
            </Card>
          )}

          {/* Step 1 — Location & timing */}
          {step === 1 && (
            <Card className="animate-slide-up">
              <p className="text-[10px] tracking-[1px] uppercase font-medium text-muted-l mb-4">Location & timing</p>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Suburb" value={form.suburb} onChange={set('suburb')}>
                  <option value="">Select suburb...</option>
                  {SUBURBS.map(s => <option key={s}>{s}</option>)}
                </Select>
                <Select label="Property type" value={form.property_type} onChange={set('property_type')}>
                  <option>Residential house</option>
                  <option>Unit / apartment</option>
                  <option>Commercial</option>
                  <option>Rural / farm</option>
                </Select>
                <Select label="Preferred start" value={form.preferred_start} onChange={set('preferred_start')}>
                  <option value="">As soon as possible</option>
                  <option>Within 2 weeks</option>
                  <option>Within a month</option>
                  <option>Flexible — no rush</option>
                </Select>
                <Select label="Budget range" value={form.budget_range} onChange={set('budget_range')}>
                  <option value="">Not sure — need quotes</option>
                  <option>Under $1,000</option>
                  <option>$1,000–$5,000</option>
                  <option>$5,000–$15,000</option>
                  <option>$15,000+</option>
                </Select>
              </div>
              <Select
                label="Warranty period"
                value={form.warranty_period} onChange={set('warranty_period')}
                hint="Written into the scope agreement — the tradie's obligation after job completion"
              >
                <option value="90">Standard — 90 days</option>
                <option value="180">Extended — 6 months</option>
                <option value="365">Full — 12 months</option>
              </Select>
              <div className="flex gap-2.5">
                <Button variant="ghost" size="lg" onClick={() => setStep(0)}>← Back</Button>
                <Button variant="sage" size="lg" className="flex-1"
                  disabled={!form.suburb} onClick={() => setStep(2)}>
                  Continue — photos & docs →
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2 — Photos */}
          {step === 2 && (
            <Card className="animate-slide-up">
              <p className="text-[10px] tracking-[1px] uppercase font-medium text-muted-l mb-4">Supporting materials (optional)</p>
              <Dropzone
                stage="request"
                label="Upload photos of the site, existing work, or inspiration images"
                onUploaded={(url) => setPhotos(p => [...p, url])}
              />
              {photos.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {photos.map((url, i) => (
                    <img key={i} src={url} className="w-16 h-16 rounded-lg object-cover border border-ink/10" alt="" />
                  ))}
                </div>
              )}
              <div className="mt-4 p-3.5 bg-stage-1/6 border border-stage-1/15 rounded-lg">
                <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-stage-1 mb-1.5">What happens next</p>
                <p className="text-[13px] text-muted leading-relaxed">
                  Our AI will review your request and build a shortlist of 3–5 verified tradies matched to your trade, suburb, and job complexity.
                </p>
              </div>
              <div className="flex gap-2.5 mt-5">
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="terra" size="lg" loading={submitting} className="flex-1" onClick={submitJob}>
                  Submit request & build shortlist →
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3 — Confirmation */}
          {step === 3 && (
            <Card className="animate-slide-up text-center py-10">
              <div className="text-6xl mb-5">✅</div>
              <h2 className="font-display text-3xl text-ink mb-3">Request submitted</h2>
              <p className="text-[15px] text-muted font-light mb-6 max-w-sm mx-auto leading-relaxed">
                Our AI is matching your job to verified local tradies now. You'll be notified when your shortlist is ready.
              </p>
              <div className="inline-flex items-center gap-2 bg-stage-1/8 border border-stage-1/20 rounded-full px-4 py-2 text-[13px] text-stage-1 mb-7">
                <span className="w-2 h-2 bg-stage-1 rounded-full animate-pulse-dot" />
                AI matching in progress...
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="ink" size="lg" onClick={() => router.push(`/dashboard/${jobId}/shortlist`)}>
                  View shortlist →
                </Button>
                <Button variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>
                  Back to dashboard
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
