import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, job_id, milestone_id, tradie_id, client_id, amount, email } = await request.json()

    if (action === 'create_connect_account') {
      const { data: profile } = await supabase.from('profiles').select('stripe_account_id, full_name').eq('id', tradie_id).single()
      if (profile?.stripe_account_id) {
        const link = await stripe.accountLinks.create({
          account: profile.stripe_account_id,
          refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard',
          return_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard?stripe=connected',
          type: 'account_onboarding',
        })
        return NextResponse.json({ url: link.url })
      }
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'AU',
        email,
        capabilities: { transfers: { requested: true } },
        business_profile: { mcc: '1711', url: process.env.NEXT_PUBLIC_APP_URL },
      })
      await supabase.from('profiles').update({ stripe_account_id: account.id }).eq('id', tradie_id)
      const link = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard',
        return_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard?stripe=connected',
        type: 'account_onboarding',
      })
      return NextResponse.json({ url: link.url })
    }

    if (action === 'create_payment_intent') {
      const { data: job } = await supabase.from('jobs').select('*, tradie:tradie_profiles(*, profile:profiles(stripe_account_id, email))').eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const { data: quote } = await supabase.from('quotes').select('*').eq('job_id', job_id).order('created_at', { ascending: false }).limit(1).single()
      if (!quote) return NextResponse.json({ error: 'No quote found' }, { status: 404 })
      const tradieAccountId = job.tradie?.profile?.stripe_account_id
      if (!tradieAccountId) return NextResponse.json({ error: 'Tradie has not connected Stripe yet' }, { status: 400 })
      const amountCents = Math.round(Number(quote.total_price) * 100)
      const foundingMember = job.tradie?.founding_member === true
      const feeRate = foundingMember ? 0.03 : 0.035
      const platformFeeCents = Math.round(amountCents * feeRate)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'aud',
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: tradieAccountId },
        metadata: { job_id, client_id },
        automatic_payment_methods: { enabled: true },
      })
      await supabase.from('jobs').update({ stripe_payment_intent_id: paymentIntent.id }).eq('id', job_id)
      return NextResponse.json({ client_secret: paymentIntent.client_secret, amount: amountCents, fee: platformFeeCents })
    }

    if (action === 'release_milestone') {
      const { data: milestone } = await supabase.from('milestones').select('*, job:jobs(*, tradie:tradie_profiles(*, profile:profiles(stripe_account_id)))').eq('id', milestone_id).single()
      if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
      const tradieAccountId = milestone.job?.tradie?.profile?.stripe_account_id
      if (!tradieAccountId) return NextResponse.json({ error: 'Tradie not connected to Stripe' }, { status: 400 })
      if (!milestone.amount || milestone.amount <= 0) return NextResponse.json({ error: 'No amount set for this milestone' }, { status: 400 })
      const amountCents = Math.round(Number(milestone.amount) * 100)
      const foundingMember = milestone.job?.tradie?.founding_member === true
      const feeRate = foundingMember ? 0.03 : 0.035
      const platformFee = Math.round(amountCents * feeRate)
      const transferAmount = amountCents - platformFee
      const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: 'aud',
        destination: tradieAccountId,
        metadata: { milestone_id, job_id: milestone.job_id },
      })
      await supabase.from('milestones').update({ stripe_transfer_id: transfer.id, paid_at: new Date().toISOString() }).eq('id', milestone_id)
      return NextResponse.json({ transfer_id: transfer.id })
    }

    if (action === 'get_account_status') {
      const { data: profile } = await supabase.from('profiles').select('stripe_account_id').eq('id', tradie_id).single()
      if (!profile?.stripe_account_id) return NextResponse.json({ connected: false })
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)
      return NextResponse.json({
        connected: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        account_id: account.id,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
