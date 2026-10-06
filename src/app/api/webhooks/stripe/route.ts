import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { markTuriTopBookingPaid } from '@/lib/services/turitop-sync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'payment') {
          await handleBookingPaymentCompleted(session)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from('provider_subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription
        if (subscriptionId) {
          await supabase
            .from('provider_subscriptions')
            .update({ status: 'suspended' })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleBookingPaymentCompleted(session: Stripe.Checkout.Session) {
  const reservationId = session.metadata?.reservation_id
  if (!reservationId) {
    console.error('Checkout session missing reservation_id metadata:', session.id)
    return
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null

  await supabase
    .from('reservations')
    .update({ payment_status: 'paid', stripe_payment_intent_id: paymentIntentId })
    .eq('id', reservationId)

  await markTuriTopBookingPaid(reservationId)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'suspended',
    canceled: 'cancelled',
    unpaid: 'suspended',
    trialing: 'trialing',
    incomplete: 'suspended',
    incomplete_expired: 'expired',
    paused: 'suspended',
  }

  const status = statusMap[subscription.status] || 'suspended'
  const subData = subscription as unknown as {
    current_period_start: number
    current_period_end: number
  }
  const periodStart = new Date(subData.current_period_start * 1000).toISOString()
  const periodEnd = new Date(subData.current_period_end * 1000).toISOString()

  const { data: existingSub } = await supabase
    .from('provider_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existingSub) {
    await supabase
      .from('provider_subscriptions')
      .update({ status, current_period_start: periodStart, current_period_end: periodEnd })
      .eq('stripe_subscription_id', subscription.id)
    return
  }

  // First time we see this subscription — no row was pre-created at checkout,
  // so this insert is what actually activates the provider's plan after payment.
  const metadata = subscription.metadata as { provider_id?: string; plan?: string; billing?: string }
  if (!metadata.provider_id || !metadata.plan) {
    console.error('Stripe subscription missing provider_id/plan metadata:', subscription.id)
    return
  }

  const { data: planRow } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('name', metadata.plan)
    .single()

  if (!planRow) {
    console.error('Unknown plan in subscription metadata:', metadata.plan)
    return
  }

  await supabase.from('provider_subscriptions').insert({
    provider_id: metadata.provider_id,
    plan_id: planRow.id,
    status,
    billing_cycle: metadata.billing === 'annual' ? 'annual' : 'monthly',
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    current_period_start: periodStart,
    current_period_end: periodEnd,
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as {
    subscription?: string
    amount_paid?: number
    currency: string
    id: string
  }
  if (!invoiceData.subscription) return

  const { data: sub } = await supabase
    .from('provider_subscriptions')
    .select('id, provider_id')
    .eq('stripe_subscription_id', invoiceData.subscription)
    .single()

  if (sub) {
    const subRecord = sub as { id: string; provider_id: string }
    await supabase.from('payments').insert({
      subscription_id: subRecord.id,
      provider_id: subRecord.provider_id,
      stripe_invoice_id: invoiceData.id,
      amount: (invoiceData.amount_paid || 0) / 100,
      currency: invoiceData.currency.toUpperCase(),
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
  }
}
