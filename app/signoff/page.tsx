'use client'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CHECKS = [
  { id:'scope', label:'All scope items completed as described', sub:'Everything in the agreement has been done' },
  { id:'tested', label:'All fixtures, taps and fittings tested', sub:'No leaks, no faults, everything works correctly' },
  { id:'defects', label:'No visible defects in workmanship', sub:'No cracks, gaps, or unfinished surfaces' },
  { id:'clean', label:'Site left clean and tidy', sub:'All rubbish removed, surfaces wiped down' },
  { id:'cert', label:'Any required certificates provided', sub:'Compliance certificates, warranty documents' },
]


export default function SignoffPage() {
  const [job, setJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [showContribution, setShowContribution] = useState(false)
  const [contributionAmount, setContributionAmount] = useState(0)
  const [contributionMessage, setContributionMessage] = useState('')
  const [contributionSending, setContributionSending] = useState(false)
  const [contributionDone, setContributionDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name, id, dialogue_score_avg, stripe_account_id)')
        .eq('client_id', session.user.id)
        .in('status', ['signoff', 'delivery', 'warranty', 'complete'])
        .order('updated_at', { ascending: false })
        .limit(1)
      if (jobs && jobs.length > 0) setJob(jobs[0])
      setLoading(false)
    })
  }, [])

  const allChecked = CHECKS.every(c => checks[c.id])

  const submitSignoff = async () => {
    if (!job || !allChecked || rating === 0) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('jobs').update({
      status: 'warranty',
      signoff_at: new Date().toISOString(),
      warranty_ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', job.id)
    if (review && session) {
      await supabase.from('reviews').insert({
        job_id: job.id,
        reviewer_id: session.user.id,
        reviewee_id: job.tradie?.id,
        rating,
        body: review,
        is_public: true,
      })
    }
    await fetch('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'score_stage', stage: 'complete', job_id: job.id }),
    }).catch(() => {})
    setDone(true)
    setShowContribution(true)
    setSubmitting(false)
  }

  const sendContribution = async () => {
    if (!contributionAmount || !job) return
    setContributionSending(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/contribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: job.id,
        amount: contributionAmount,
        message: contributionMessage,
        client_id: session?.user.id,
      }),
    })
    const data = await res.json()
    if (data.contribution_id) {
      await fetch('/api/contribution', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contribution_id: data.contribution_id,
          job_id: job.id,
          tradie_id: job.tradie_id,
          amount: contributionAmount,
          message: contributionMessage,
        }),
      })
    }
    setContributionDone(true)
    setContributionSending(false)
  }

  const isPastSignoff = job && ['warranty', 'complete'].includes(job.status)


}
