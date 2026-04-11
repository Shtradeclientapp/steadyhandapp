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
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const tradieId = session.metadata?.tradie_id
    const tier = session.metadata?.tier
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (tradieId && tier) {
      await supabase.from('tradie_profiles').update({
        subscription_tier: tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('id', tradieId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    // Downgrade to basic when subscription cancelled
    await supabase.from('tradie_profiles').update({
      subscription_tier: 'basic',
      stripe_subscription_id: null,
    }).eq('stripe_customer_id', customerId)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    // Handle plan changes
    const priceId = sub.items.data[0]?.price?.id
    const businessPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS
    const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO
    const tier = priceId === proPriceId ? 'pro' : priceId === businessPriceId ? 'business' : 'basic'
    await supabase.from('tradie_profiles').update({ subscription_tier: tier }).eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
