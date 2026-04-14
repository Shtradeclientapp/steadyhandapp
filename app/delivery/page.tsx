'use client'
import { StageGuideModal } from '@/components/ui/StageGuideModal'
import React from 'react'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StageRail } from '@/components/ui'
import { JobSelector } from '@/components/ui/JobSelector'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Payment form component ────────────────────────────────────────────────────
function MilestonePaymentForm({ milestoneId, amount, jobId, onSuccess, onCancel }: {
  milestoneId: string
  amount: number
  jobId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setPaying(true)
    setError(null)
    const { error: submitError } = await elements.submit()
    if (submitError) { setError(submitError.message || 'Payment failed'); setPaying(false); return }
    const res = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_payment_intent', job_id: jobId, milestone_id: milestoneId }),
    })
    const { client_secret, error: apiError } = await res.json()
    if (apiError || !client_secret) { setError(apiError || 'Could not create payment'); setPaying(false); return }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: client_secret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    if (confirmError) { setError(confirmError.message || 'Payment failed'); setPaying(false); return }
    // Payment succeeded — release milestone
    await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'release_milestone', milestone_id: milestoneId }),
    })
    onSuccess()
    setPaying(false)
  }

  return (
    <div style={{ background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'12px', padding:'20px', marginTop:'12px' }}>
      <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'4px' }}>RELEASE PAYMENT</p>
      <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'16px' }}>
        ${Number(amount).toLocaleString()} will be transferred to the tradie upon payment confirmation.
      </p>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p style={{ fontSize:'12px', color:'#D4522A', marginTop:'10px' }}>{error}</p>}
      <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
        <button type="button" onClick={handlePay} disabled={paying || !stripe}
          style={{ flex:1, background:'#2E7D60', color:'white', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: paying || !stripe ? 0.7 : 1 }}>
          {paying ? 'Processing...' : `Pay $${Number(amount).toLocaleString()} →`}
        </button>
        <button type="button" onClick={onCancel} disabled={paying}
          style={{ background:'transparent', color:'#7A9098', padding:'12px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Variation card with local response state ─────────────────────────────────
function VariationCard({ v, isTradie, onRespond }: { v: any, isTradie: boolean, onRespond: (id: string, approved: boolean, response: string) => void }) {
  const [responseText, setResponseText] = React.useState('')
  const statusColor = v.status === 'approved' ? '#2E7D60' : v.status === 'rejected' ? '#D4522A' : '#C07830'
  return (
    <div style={{ background:'#F4F8F7', borderRadius:'10px', padding:'14px 16px', borderLeft:'3px solid ' + statusColor }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'6px' }}>
        <p style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', margin:0 }}>{v.title}</p>
        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background: statusColor + '18', border:'1px solid ' + statusColor + '40', color:statusColor, fontWeight:500, flexShrink:0, textTransform:'capitalize' as const }}>{v.status}</span>
      </div>
      {v.description && <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.55', marginBottom:'8px' }}>{v.description}</p>}
      <div style={{ display:'flex', gap:'16px', marginBottom: v.status === 'pending' && !isTradie ? '10px' : 0 }}>
        {v.cost_impact !== 0 && <span style={{ fontSize:'12px', color:'#C07830', fontWeight:500 }}>+${Number(v.cost_impact).toLocaleString()} cost</span>}
        {v.time_impact_days !== 0 && <span style={{ fontSize:'12px', color:'#C07830', fontWeight:500 }}>+{v.time_impact_days} days</span>}
        <span style={{ fontSize:'11px', color:'#9AA5AA' }}>{new Date(v.created_at).toLocaleDateString('en-AU')}</span>
      </div>
      {v.status === 'pending' && !isTradie && (
        <div style={{ marginTop:'10px' }}>
          <textarea placeholder="Add a note (optional)..." rows={2}
            onChange={e => setResponseText(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'12px', background:'white', color:'#1C2B32', outline:'none', resize:'vertical' as const, boxSizing:'border-box' as const, marginBottom:'8px', fontFamily:'sans-serif' }} />
          <div style={{ display:'flex', gap:'8px' }}>
            <button type="button" onClick={() => onRespond(v.id, true, responseText)}
              style={{ flex:1, background:'#2E7D60', color:'white', padding:'9px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
              ✓ Approve variation
            </button>
            <button type="button" onClick={() => onRespond(v.id, false, responseText)}
              style={{ flex:1, background:'transparent', color:'#D4522A', padding:'9px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'1px solid rgba(212,82,42,0.3)', cursor:'pointer' }}>
              ✗ Reject
            </button>
          </div>
        </div>
      )}
      {v.client_response && (
        <p style={{ fontSize:'12px', color:'#4A5E64', marginTop:'8px', fontStyle:'italic' as const }}>"{v.client_response}"</p>
      )}
    </div>
  )
}

export default function DeliveryPage() {
  const [job, setJob] = useState<any>(null)
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingMilestone, setPayingMilestone] = useState<string|null>(null)
  const [clientSecret, setClientSecret] = useState<string|null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState<string|null>(null)
  const [variations, setVariations] = useState<any[]>([])
  const [showVariationForm, setShowVariationForm] = useState(false)
  const [variationForm, setVariationForm] = useState({ title: '', description: '', cost_impact: '', time_impact_days: '' })
  const [submittingVariation, setSubmittingVariation] = useState(false)
  const [variationError, setVariationError] = useState<string|null>(null)
  const [isTradie, setIsTradie] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)

      const isT = prof?.role === 'tradie'
      setIsTradie(isT)
      const col = isT ? 'tradie_id' : 'client_id'
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq(col, session.user.id)
        .in('status', ['delivery', 'agreement', 'signoff', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })

      if (jobs && jobs.length > 0) {
        // Find the most relevant job — prefer delivery status, then most recently updated
        setAllJobs(jobs)
        const deliveryJob = jobs.find((j: any) => j.status === 'delivery') || jobs[0]
        setJob(deliveryJob)
        const { data: ms } = await supabase
          .from('milestones')
          .select('*')
          .eq('job_id', jobs[0].id)
          .order('order_index', { ascending: true })

        if (ms && ms.length > 0) {
          setMilestones(ms)
        } else {
          const { data: scope } = await supabase
            .from('scope_agreements')
            .select('milestones, total_price')
            .eq('job_id', jobs[0].id)
            .single()

          if (scope?.milestones) {
            const { data: latestQuote } = await supabase
              .from('quotes')
              .select('total_price')
              .eq('job_id', jobs[0].id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            const quoteTotal = latestQuote?.total_price || scope.total_price || 0
            const rows = scope.milestones.map((m: any, i: number) => ({
              job_id: jobs[0].id,
              label: m.label,
              description: m.description,
              order_index: i + 1,
              percent: m.percent,
              amount: quoteTotal ? (Number(quoteTotal) * m.percent / 100) : 0,
              status: 'pending',
            }))
            await supabase.from('milestones').insert(rows)
            const { data: fresh } = await supabase.from('milestones').select('*').eq('job_id', jobs[0].id).order('order_index', { ascending: true })
            setMilestones(fresh || [])
          }
        }
      }
      // Load variations
      if (jobs && jobs.length > 0) {
        const { data: vars } = await supabase
          .from('variations')
          .select('*, requested_by_profile:profiles!variations_requested_by_fkey(full_name)')
          .eq('job_id', jobs[0].id)
          .order('created_at', { ascending: false })
        setVariations(vars || [])
      }

      // Detect if user is tradie
      const { data: tradieCheck } = await supabase
        .from('tradie_profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()
      setIsTradie(!!tradieCheck)

      setLoading(false)
    })
  }, [])

  const uploadPhoto = async (milestoneId: string, file: File) => {
    setUploadingPhoto(milestoneId)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const ext = file.name.split('.').pop()
    const filePath = `milestone-photos/${milestoneId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('Job Photos').upload(filePath, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('Job Photos').getPublicUrl(filePath)
      const url = data.publicUrl
      const milestone = milestones.find(m => m.id === milestoneId)
      const existingPhotos = milestone?.photos || []
      await supabase.from('milestones').update({ photos: [...existingPhotos, url] }).eq('id', milestoneId)
      setMilestones(ms => ms.map(m => m.id === milestoneId ? { ...m, photos: [...(m.photos || []), url] } : m))
    }
    setUploadingPhoto(null)
  }

  const submitVariation = async () => {
    if (!variationForm.title || !job) return
    setSubmittingVariation(true)
    setVariationError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: variation, error: varErr } = await supabase.from('variations').insert({
      job_id: job.id,
      requested_by: session?.user.id,
      title: variationForm.title,
      description: variationForm.description,
      cost_impact: parseFloat(variationForm.cost_impact) || 0,
      time_impact_days: parseInt(variationForm.time_impact_days) || 0,
      status: 'pending',
    }).select().single()
    if (varErr || !variation) {
      setVariationError('Could not submit variation — please check your connection and try again.')
      setSubmittingVariation(false)
      return
    }
    if (variation) {
      setVariations(prev => [variation, ...prev])
      await supabase.from('job_messages').insert({
        job_id: job.id,
        sender_id: session?.user.id,
        body: '⚠ Variation requested: ' + variationForm.title + (variationForm.cost_impact ? ' · Cost impact: +$' + Number(variationForm.cost_impact).toLocaleString() : '') + (variationForm.time_impact_days ? ' · Time impact: +' + variationForm.time_impact_days + ' days' : ''),
      })
    }
    setVariationForm({ title: '', description: '', cost_impact: '', time_impact_days: '' })
    setShowVariationForm(false)
    setSubmittingVariation(false)
  }

  const respondToVariation = async (variationId: string, approved: boolean, response: string) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('variations').update({
      status: approved ? 'approved' : 'rejected',
      client_response: response,
      responded_at: new Date().toISOString(),
    }).eq('id', variationId)
    setVariations(prev => prev.map(v => v.id === variationId ? { ...v, status: approved ? 'approved' : 'rejected', client_response: response } : v))
    await supabase.from('job_messages').insert({
      job_id: job.id,
      sender_id: session?.user.id,
      body: (approved ? '✅ Variation approved' : '❌ Variation rejected') + ': ' + variations.find(v => v.id === variationId)?.title,
    })
  }

  const initiatePayment = async (id: string, amount: number) => {
    if (amount <= 0) { approveM(id); return }
    const res = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_payment_intent', job_id: job.id, milestone_id: id }),
    })
    const data = await res.json()
    if (data.client_secret) {
      setClientSecret(data.client_secret)
      setPayingMilestone(id)
    } else {
      // Stripe not connected — approve milestone directly and note payment pending
      if (confirm('Stripe payment could not be initiated (tradie bank account not yet connected). Approve this milestone now and arrange payment separately?')) {
        approveM(id)
      }
    }
  }

  const approveM = async (id: string) => {
    const supabase = createClient()
    await supabase.from('milestones').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id)
    const updated = milestones.map((m: any) => m.id === id ? { ...m, status: 'approved', approved_at: new Date().toISOString() } : m)
    setMilestones(updated)
    // Auto-activate next pending milestone
    const nextPending = updated.find((m: any) => m.status === 'pending')
    if (nextPending) {
      const supabase2 = createClient()
      await supabase2.from('milestones').update({ status: 'active' }).eq('id', nextPending.id)
      setMilestones(prev => prev.map((m: any) => m.id === nextPending.id ? { ...m, status: 'active' } : m))
    }
    setPayingMilestone(null)
    setClientSecret(null)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'milestone_approved', milestone_id: id }),
    }).catch(() => {})
    const allDone = milestones.every(m => m.id === id ? true : m.status === 'approved')
    if (allDone && job) {
      const supabase2 = createClient()
      await supabase2.from('jobs').update({ status: 'signoff' }).eq('id', job.id)
      await supabase2.from('job_messages').insert({
        job_id: job.id,
        sender_id: profile?.id,
        body: 'All milestones approved — the job is ready for sign-off.',
      })
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ready_for_signoff', job_id: job.id }),
      }).catch(() => {})
      setTimeout(() => { window.location.href = '/signoff' }, 800)
    }
  }

  const nav = (
    <div>
      <NavHeader profile={profile} isTradie={isTradie} />
      <StageRail currentPath="/delivery" jobStatus={job?.status} />

    </div>
  )

  if (loading) return <>{nav}<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div></>

  if (!job) return (
    <>{nav}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background:'#C8D5D2' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#4A5E64', marginBottom:'16px' }}>No job in delivery stage.</p>
        <a href="/agreement"><button style={{ background:'#1C2B32', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer' }}>Go to agreement</button></a>
      </div>
    </div></>
  )

  const isPastDelivery = job && ['signoff', 'warranty', 'complete'].includes(job.status)
  const done = milestones.filter(m => m.status === 'approved').length
  const total = milestones.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <>{nav}
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#C8D5D2', padding:'40px 24px' }}>
      <div style={{ maxWidth:'780px', margin:'0 auto' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
          <span style={{ fontSize:'11px', color:'#C07830', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>Watch it happen</span>
        </div>
        {isPastDelivery && (
          <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px' }}>
            <p style={{ fontSize:'13px', fontWeight:500, color:'#C07830', marginBottom:'6px' }}>You are reviewing the Build stage</p>
            <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'12px', lineHeight:'1.6' }}>
              This job has moved to the <strong>{job?.status}</strong> stage. Below is a summary of milestone delivery for your records.
            </p>
            <a href={job?.status === 'signoff' ? '/signoff' : '/warranty'}>
              <button type="button" style={{ background:'#C07830', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to current stage →
              </button>
            </a>
          </div>
        )}
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'6px' }}>DELIVERY TRACKING</h1>
        <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:'300', marginBottom:'28px', lineHeight:'1.6' }}>
          You confirm each milestone as it is completed. Payment releases only when you approve.
        </p>

        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'16px' }}>
            <div>
              <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'4px' }}>{job.title}</h3>
              <p style={{ fontSize:'13px', color:'#7A9098' }}>{job.trade_category} · {job.suburb} · {job.tradie?.business_name}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'#1C2B32' }}>{progress}%</div>
              <div style={{ fontSize:'12px', color:'#4A5E64' }}>{done}/{total} milestones</div>
            </div>
          </div>
          <div style={{ height:'6px', background:'rgba(28,43,50,0.1)', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#C07830', borderRadius:'3px', width: progress + '%', transition:'width 0.4s' }} />
          </div>
        </div>

        {milestones.length === 0 && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'28px 24px', textAlign:'center' as const, marginBottom:'24px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px', opacity:0.4 }}>📋</div>
            <p style={{ fontSize:'15px', fontWeight:500, color:'#1C2B32', marginBottom:'6px' }}>No milestones set up yet</p>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'16px' }}>
              {isTradie
                ? 'Add milestones to your quote so the client can track and approve each stage of work.'
                : 'Your tradie has not yet set up milestones for this job. Check back soon or message them directly.'}
            </p>
            {isTradie ? (
              <a href={'/tradie/job?id=' + job.id}>
                <button type="button" style={{ background:'#C07830', color:'white', padding:'11px 22px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  Set up milestones →
                </button>
              </a>
            ) : (
              <a href={'/messages?job=' + job.id}>
                <button type="button" style={{ background:'#1C2B32', color:'white', padding:'11px 22px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  Message tradie →
                </button>
              </a>
            )}
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
          {milestones.map((m, i) => {
            const isDone = m.status === 'approved'
            const isActive = !isDone && (i === 0 || milestones[i-1]?.status === 'approved')
            return (
              <div key={m.id} style={{ display:'flex', gap:'16px', position:'relative' }}>
                {i < milestones.length - 1 && (
                  <div style={{ position:'absolute', left:'19px', top:'40px', bottom:'-2px', width:'1px', background:'rgba(28,43,50,0.1)' }} />
                )}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:'4px' }}>
                  <div style={{
                    width:'22px', height:'22px', borderRadius:'50%', border:'2px solid',
                    borderColor: isDone ? '#2E7D60' : isActive ? '#C07830' : 'rgba(28,43,50,0.2)',
                    background: isDone ? '#2E7D60' : isActive ? '#1C2B32' : '#C8D5D2',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'10px', color: isDone || isActive ? 'white' : '#7A9098',
                    flexShrink:0, zIndex:1
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                </div>
                <div style={{ padding:'4px 0 28px', flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                    <h3 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.3px' }}>{m.label}</h3>
                    {m.due_date && (
                      <p style={{ fontSize:'11px', color: new Date(m.due_date) < new Date() && m.status !== 'approved' ? '#D4522A' : '#7A9098', margin:'2px 0 0' }}>
                        {new Date(m.due_date) < new Date() && m.status !== 'approved' ? '⚠ Overdue · ' : 'Due · '}{new Date(m.due_date).toLocaleDateString('en-AU')}
                      </p>
                    )}
                    {isDone && <span style={{ background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.25)', borderRadius:'100px', padding:'2px 8px', fontSize:'10px', color:'#2E7D60' }}>Approved</span>}
                    {isActive && !isDone && <span style={{ background:'rgba(192,120,48,0.1)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'100px', padding:'2px 8px', fontSize:'10px', color:'#C07830' }}>Action needed</span>}
                  </div>
                  <p style={{ fontSize:'13px', color:'#7A9098', lineHeight:'1.55', marginBottom:'8px' }}>{m.description}</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'10px' }}>
                    {m.percent}% of total{m.amount > 0 ? ' · $' + Number(m.amount).toLocaleString() : ''}
                    {isDone && m.approved_at ? ' · Approved ' + new Date(m.approved_at).toLocaleDateString('en-AU') : ''}
                  </p>
                  {isActive && !isDone && payingMilestone !== m.id && !isTradie && (
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      <button type="button" onClick={() => initiatePayment(m.id, m.amount || 0)}
                        style={{ background:'#2E7D60', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'none', cursor:'pointer' }}>
                        {m.amount > 0 ? `Approve & pay $${Number(m.amount).toLocaleString()} →` : 'Approve milestone →'}
                      </button>
                      <button type="button"
                        onClick={() => window.location.href = '/messages' + (job?.id ? '?job=' + job.id : '')}
                        style={{ background:'transparent', color:'#D4522A', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(212,82,42,0.3)', cursor:'pointer' }}>
                        Flag an issue
                      </button>
                    </div>
                  )}
                  {isTradie && !isDone && milestones.length > 1 && (
                    <div style={{ display:'flex', gap:'6px', marginBottom:'8px' }}>
                      <button type="button" onClick={async () => {
                        const idx = milestones.findIndex((x:any) => x.id === m.id)
                        if (idx <= 0) return
                        const supabase = createClient()
                        const prev = milestones[idx - 1]
                        await supabase.from('milestones').update({ order_index: idx }).eq('id', prev.id)
                        await supabase.from('milestones').update({ order_index: idx - 1 }).eq('id', m.id)
                        window.location.reload()
                      }} style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'4px', padding:'3px 8px', cursor:'pointer' }}>↑ Move up</button>
                      <button type="button" onClick={async () => {
                        const idx = milestones.findIndex((x:any) => x.id === m.id)
                        if (idx >= milestones.length - 1) return
                        const supabase = createClient()
                        const next = milestones[idx + 1]
                        await supabase.from('milestones').update({ order_index: idx }).eq('id', next.id)
                        await supabase.from('milestones').update({ order_index: idx + 1 }).eq('id', m.id)
                        window.location.reload()
                      }} style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'4px', padding:'3px 8px', cursor:'pointer' }}>↓ Move down</button>
                    </div>
                  )}
                  {isActive && !isDone && isTradie && (
                    <div style={{ background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'10px 14px' }}>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Waiting for client to approve this milestone and release payment.</p>
                    </div>
                  )}
                  {isActive && !isDone && payingMilestone === m.id && clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat', variables: { colorPrimary: '#2E7D60', colorBackground: '#F4F8F7', borderRadius: '8px' } } }}>
                      <MilestonePaymentForm
                        milestoneId={m.id}
                        amount={m.amount || 0}
                        jobId={job.id}
                        onSuccess={() => approveM(m.id)}
                        onCancel={() => { setPayingMilestone(null); setClientSecret(null) }}
                      />
                    </Elements>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Variations section */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginTop:'24px', marginBottom:'16px' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', margin:0 }}>VARIATIONS</p>
              <p style={{ fontSize:'11px', color:'#7A9098', margin:'2px 0 0' }}>Scope changes, additions or unexpected work</p>
            </div>
            <button type="button" onClick={() => setShowVariationForm(v => !v)}
              style={{ background:'#C07830', color:'white', padding:'8px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
              {showVariationForm ? 'Cancel' : '+ Request variation'}
            </button>
          </div>

          {showVariationForm && (
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(192,120,48,0.03)' }}>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                <input
                  type="text"
                  placeholder="Variation title (required)"
                  value={variationForm.title}
                  onChange={e => setVariationForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', boxSizing:'border-box' as const }}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={variationForm.description}
                  onChange={e => setVariationForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', boxSizing:'border-box' as const }}
                />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <input
                    type="number"
                    placeholder="Cost impact ($)"
                    value={variationForm.cost_impact}
                    onChange={e => setVariationForm(f => ({ ...f, cost_impact: e.target.value }))}
                    style={{ padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif' }}
                  />
                  <input
                    type="number"
                    placeholder="Time impact (days)"
                    value={variationForm.time_impact_days}
                    onChange={e => setVariationForm(f => ({ ...f, time_impact_days: e.target.value }))}
                    style={{ padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif' }}
                  />
                </div>
                {variationError && (
                  <p style={{ fontSize:'12px', color:'#D4522A', margin:0 }}>⚠ {variationError}</p>
                )}
                <button type="button" onClick={submitVariation} disabled={submittingVariation || !variationForm.title}
                  style={{ background: submittingVariation || !variationForm.title ? 'rgba(192,120,48,0.4)' : '#C07830', color:'white', padding:'10px', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'none', cursor: submittingVariation || !variationForm.title ? 'not-allowed' : 'pointer' }}>
                  {submittingVariation ? 'Submitting...' : 'Submit variation →'}
                </button>
              </div>
            </div>
          )}

          {variations.length === 0 && !showVariationForm && (
            <div style={{ padding:'20px', textAlign:'center' as const }}>
              <p style={{ fontSize:'13px', color:'#9AA5AA', margin:0 }}>No variations requested yet.</p>
            </div>
          )}
          {variations.length > 0 && (
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              {variations.map(v => (
                <VariationCard key={v.id} v={v} isTradie={isTradie} onRespond={respondToVariation} />
              ))}
            </div>
          )}
        </div>

        {done === total && total > 0 && (
          <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'10px', padding:'20px', textAlign:'center', marginTop:'8px' }}>
            <p style={{ fontSize:'15px', color:'#2E7D60', fontWeight:'500', marginBottom:'12px' }}>All milestones complete. Ready for final sign-off.</p>
            <a href="/signoff">
              <button style={{ background:'#2E7D60', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', border:'none', cursor:'pointer' }}>
                Go to sign-off →
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
      <StageGuideModal
        storageKey="seen_delivery_guide"
        stageNumber={6}
        stageColor="#C07830"
        stageLabel="Build"
        headline="You control when each payment releases"
        intro="Payments are held until you approve each milestone — giving you control at every stage without holding the tradie to ransom."
        checklist={[
          { text: 'Only approve a milestone when you are genuinely satisfied — not out of politeness', emphasis: true },
          { text: 'Check the scope agreement before approving — does the work match what was agreed?', emphasis: false },
          { text: 'If something is not right, use the variations process', emphasis: false },
          { text: 'Progress photos are your record if a milestone is disputed later', emphasis: false },
        ]}
        ctaLabel="Review milestones →"
      />
    </>
  )
}