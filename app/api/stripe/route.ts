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
    const body = await request.json()
    const { action, job_id, milestone_id, tradie_id, client_id, amount, email, price_id, tier, return_url: customReturnUrl } = body

    // ── Stripe Connect onboarding ────────────────────────────────
    if (action === 'create_connect_account') {
      const { data: profile } = await supabase.from('profiles').select('stripe_account_id, full_name').eq('id', tradie_id).single()
      if (profile?.stripe_account_id) {
        const link = await stripe.accountLinks.create({
          account: profile.stripe_account_id,
          refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard',
          return_url: customReturnUrl || process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard?stripe=connected',
          type: 'account_onboarding',
        })
        return NextResponse.json({ url: link.url })
      }
      const account = await stripe.accounts.create({
        type: 'express', country: 'AU', email,
        capabilities: { transfers: { requested: true } },
        business_profile: { mcc: '1711', url: process.env.NEXT_PUBLIC_APP_URL },
      })
      await supabase.from('profiles').update({ stripe_account_id: account.id }).eq('id', tradie_id)
      const link = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard',
        return_url: customReturnUrl || process.env.NEXT_PUBLIC_APP_URL + '/tradie/dashboard?stripe=connected',
        type: 'account_onboarding',
      })
      return NextResponse.json({ url: link.url })
    }

    // ── Milestone payment intent ─────────────────────────────────
    if (action === 'create_payment_intent') {
      const { data: job } = await supabase.from('jobs').select('*, tradie:tradie_profiles(*, profile:profiles(stripe_account_id, email))').eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const tradieAccountId = job.tradie?.profile?.stripe_account_id
      if (!tradieAccountId) return NextResponse.json({ error: 'Tradie has not connected Stripe yet' }, { status: 400 })
      // Use milestone amount if provided, otherwise fall back to quote total
      let amountCents: number
      if (milestone_id) {
        const { data: milestone } = await supabase.from('milestones').select('amount').eq('id', milestone_id).single()
        if (!milestone?.amount) return NextResponse.json({ error: 'Milestone amount not set' }, { status: 400 })
        amountCents = Math.round(Number(milestone.amount) * 100)
      } else {
        const { data: quote } = await supabase.from('quotes').select('total_price').eq('job_id', job_id).order('created_at', { ascending: false }).limit(1).single()
        if (!quote) return NextResponse.json({ error: 'No quote found' }, { status: 404 })
        // Include approved variation amounts in the payment total
        const { data: approvedVariations } = await supabase
          .from('variations')
          .select('cost_impact')
          .eq('job_id', job_id)
          .eq('status', 'approved')
        const variationTotal = (approvedVariations || []).reduce((sum: number, v: any) => sum + Number(v.cost_impact || 0), 0)
        amountCents = Math.round((Number(quote.total_price) + variationTotal) * 100)
      }
      const isFoundingMember = !!job.tradie?.founding_member
      const standardFeeRate = 0.035
      const actualFeeRate = isFoundingMember ? 0 : standardFeeRate
      const standardFeeCents = Math.round(amountCents * standardFeeRate)
      const platformFeeCents = Math.round(amountCents * actualFeeRate)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents, currency: 'aud',
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: tradieAccountId },
        metadata: { job_id, milestone_id: milestone_id || '', client_id: client_id || '' },
        automatic_payment_methods: { enabled: true },
      })
      await supabase.from('milestones').update({ stripe_payment_intent_id: paymentIntent.id }).eq('id', milestone_id)
      return NextResponse.json({
        client_secret: paymentIntent.client_secret,
        amount: amountCents,
        fee: platformFeeCents,
        standard_fee: standardFeeCents,
        founding_member: isFoundingMember,
        tradie_receives: amountCents - platformFeeCents,
      })
    }

    // ── Voluntary contribution — no platform fee, direct to tradie ─
    if (action === 'create_contribution') {
      const { data: job } = await supabase.from('jobs').select('*, tradie:tradie_profiles(*, profile:profiles(stripe_account_id))').eq('id', job_id).single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const tradieAccountId = job.tradie?.profile?.stripe_account_id
      if (!tradieAccountId) return NextResponse.json({ error: 'Tradie has not connected Stripe' }, { status: 400 })
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'aud',
        application_fee_amount: 0, // No platform fee on contributions
        transfer_data: { destination: tradieAccountId },
        metadata: { job_id, client_id: client_id || '', type: 'contribution' },
        automatic_payment_methods: { enabled: true },
      })
      return NextResponse.json({ client_secret: paymentIntent.client_secret, amount })
    }

    // ── Release milestone — transfer funds to tradie ────────────
    if (action === 'release_milestone') {
      const { data: milestone } = await supabase.from('milestones').select('*, job:jobs(*, tradie:tradie_profiles(*, profile:profiles(stripe_account_id)))').eq('id', milestone_id).single()
      if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
      const tradieAccountId = milestone.job?.tradie?.profile?.stripe_account_id
      const amountCents = Math.round(Number(milestone.amount) * 100)
      const feeRate = milestone.job?.tradie?.founding_member ? 0.03 : 0.035
      const platformFeeCents = Math.round(amountCents * feeRate)
      const transferAmount = amountCents - platformFeeCents
      if (tradieAccountId && transferAmount > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: transferAmount,
            currency: 'aud',
            destination: tradieAccountId,
            metadata: { milestone_id, job_id: milestone.job_id || '' },
          })
          await supabase.from('milestones').update({
            paid_at: new Date().toISOString(),
            stripe_transfer_id: transfer.id,
          }).eq('id', milestone_id)
          return NextResponse.json({ success: true, transfer_id: transfer.id, amount_transferred: transferAmount })
        } catch (stripeErr: any) {
          console.error('Stripe transfer failed:', stripeErr.message)
          // Still mark paid in DB but flag transfer error
          await supabase.from('milestones').update({ paid_at: new Date().toISOString() }).eq('id', milestone_id)
          return NextResponse.json({ success: true, transfer_error: stripeErr.message })
        }
      } else {
        // No Stripe account connected — mark paid in DB only
        await supabase.from('milestones').update({ paid_at: new Date().toISOString() }).eq('id', milestone_id)
        return NextResponse.json({ success: true, note: 'Tradie Stripe account not connected — marked paid in DB only' })
      }
    }

    // ── Stripe Connect account status ────────────────────────────
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

    // ── Embedded subscription checkout ───────────────────────────
    if (action === 'create_checkout') {
      if (!price_id || (!tradie_id && !client_id)) return NextResponse.json({ error: 'price_id and user_id required' }, { status: 400 })
      const userId = tradie_id || client_id

      // Find or create Stripe customer
      const { data: prof } = await supabase.from('profiles').select('email, full_name, stripe_customer_id').eq('id', userId).single()
      let customerId = prof?.stripe_customer_id
      if (!customerId && tradie_id) {
        const { data: tp } = await supabase.from('tradie_profiles').select('stripe_customer_id, business_name').eq('id', tradie_id).single()
        customerId = tp?.stripe_customer_id
      }
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: prof?.email || email,
          name: prof?.full_name || undefined,
          metadata: { user_id: userId },
        })
        customerId = customer.id
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
        if (tradie_id) {
          await supabase.from('tradie_profiles').update({ stripe_customer_id: customerId }).eq('id', tradie_id)
        }
      }

      const session = await (stripe.checkout.sessions.create as any)({
        ui_mode: 'embedded_page',
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: price_id, quantity: 1 }],
        automatic_tax: { enabled: true },
        customer_update: { address: 'auto' },
        billing_address_collection: 'required',
        return_url: process.env.NEXT_PUBLIC_APP_URL + (client_id ? '/home-plan/return?session_id={CHECKOUT_SESSION_ID}' : '/tradie/subscribe/return?session_id={CHECKOUT_SESSION_ID}'),
        metadata: { tradie_id: tradie_id || null, client_id: client_id || null, tier },
      })
      return NextResponse.json({ client_secret: session.client_secret })
    }

    // ── Get checkout session status (for return page) ────────────
    if (action === 'get_session_status') {
      const { session_id } = body
      if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })
      const session = await stripe.checkout.sessions.retrieve(session_id)
      return NextResponse.json({
        status: session.status,
        customer_email: session.customer_details?.email,
        tier: session.metadata?.tier,
        tradie_id: session.metadata?.tradie_id,
      })
    }

    // ── Worker seat checkout ─────────────────────────────────────
    if (action === 'create_worker_seat_checkout') {
      const { quantity } = body
      const seatPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_WORKER_SEAT
      if (!seatPriceId) return NextResponse.json({ error: 'Worker seat price not configured' }, { status: 500 })

      // Get or create Stripe customer
      const { data: tp } = await supabase.from('tradie_profiles').select('stripe_customer_id').eq('id', tradie_id).single()
      let customerId = tp?.stripe_customer_id
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: email,
          metadata: { user_id: tradie_id },
        })
        customerId = customer.id
        await supabase.from('tradie_profiles').update({ stripe_customer_id: customerId }).eq('id', tradie_id)
      }

      const session = await (stripe.checkout.sessions.create as any)({
        ui_mode: 'embedded_page',
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: seatPriceId, quantity: quantity || 1 }],
        automatic_tax: { enabled: true },
        customer_update: { address: 'auto' },
        billing_address_collection: 'required',
        return_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/subscribe/return?session_id={CHECKOUT_SESSION_ID}&type=worker_seats&quantity=' + (quantity || 1),
        metadata: { tradie_id: tradie_id || null, type: 'worker_seats', quantity: String(quantity || 1) },
      })
      return NextResponse.json({ client_secret: session.client_secret })
    }

    // ── Customer portal (manage/cancel subscription) ─────────────
    if (action === 'create_portal_session') {
      const { data: tp } = await supabase.from('tradie_profiles').select('stripe_customer_id').eq('id', tradie_id).single()
      if (!tp?.stripe_customer_id) return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: tp.stripe_customer_id,
        return_url: process.env.NEXT_PUBLIC_APP_URL + '/tradie/subscribe',
      })
      return NextResponse.json({ url: portalSession.url })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    console.error('Stripe API error:', err.message, err.stack)
    return NextResponse.json({ error: err.message, type: err.type, code: err.code }, { status: 500 })
  }
}
