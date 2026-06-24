import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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
  }
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
