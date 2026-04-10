import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const jobId = pi.metadata?.job_id
        if (jobId) {
          await supabase.from('jobs').update({
            status: 'delivery',
          }).eq('id', jobId).eq('status', 'agreement')
          console.log('Payment succeeded for job:', jobId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const jobId = pi.metadata?.job_id
        const clientId = pi.metadata?.client_id
        if (jobId) {
          await supabase.from('job_messages').insert({
            job_id: jobId,
            sender_id: clientId,
            body: 'Payment failed — please update your payment method to continue.',
          })
          console.log('Payment failed for job:', jobId)
        }
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        const milestoneId = transfer.metadata?.milestone_id
        if (milestoneId) {
          await supabase.from('milestones').update({
            stripe_transfer_id: transfer.id,
            paid_at: new Date().toISOString(),
          }).eq('id', milestoneId)
          console.log('Transfer created for milestone:', milestoneId)
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_account_id', account.id)
          .single()
        if (profile) {
          // Update stripe_active separately from licence_verified
          // licence_verified reflects actual licence check, not Stripe status
          await supabase.from('tradie_profiles').update({
            subscription_active: account.charges_enabled,
          }).eq('id', profile.id)
          console.log('Account updated:', account.id, 'charges_enabled:', account.charges_enabled)
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
