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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tradieId = session.metadata?.tradie_id
        const clientId = session.metadata?.client_id
        const tier = session.metadata?.tier

        if (tradieId && tier) {
          await supabase.from('tradie_profiles').update({
            subscription_active: true,
            subscription_tier: tier,
          }).eq('id', tradieId)
          await supabase.from('profiles').update({
            subscription_plan: tier,
            subscription_active: true,
            subscription_since: new Date().toISOString(),
          }).eq('id', tradieId)
          console.log('Subscription activated for tradie:', tradieId, 'tier:', tier)
        }

        // Org / property manager subscription
        if (clientId && tier && tier.startsWith('property_')) {
          const { data: prof } = await supabase.from('profiles').select('org_id').eq('id', clientId).single()
          if (prof?.org_id) {
            const tierLimit: Record<string, number> = { property_starter: 10, property_growth: 50, property_enterprise: 999999 }
            await supabase.from('organisations').update({
              subscription_tier: tier,
              subscription_active: true,
              subscription_since: new Date().toISOString(),
              property_limit: tierLimit[tier] || 10,
            }).eq('id', prof.org_id)
            await supabase.from('profiles').update({
              subscription_plan: tier,
              subscription_active: true,
            }).eq('id', clientId)
            console.log('Org subscription activated:', prof.org_id, 'tier:', tier)
          }
        }

        // Client home plan
        if (clientId && tier === 'home') {
          await supabase.from('profiles').update({
            subscription_plan: 'home',
            subscription_active: true,
            subscription_since: new Date().toISOString(),
          }).eq('id', clientId)
          console.log('Home plan activated for client:', clientId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()
        if (profile) {
          await supabase.from('tradie_profiles').update({ subscription_active: false, subscription_tier: 'basic' }).eq('id', profile.id)
          await supabase.from('profiles').update({ subscription_plan: 'free', subscription_active: false }).eq('id', profile.id)
          // Also cancel org subscription if applicable
          if (profile.org_id) {
            await supabase.from('organisations').update({ subscription_active: false, subscription_tier: null }).eq('id', profile.org_id)
          }
          console.log('Subscription cancelled for profile:', profile.id)
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
