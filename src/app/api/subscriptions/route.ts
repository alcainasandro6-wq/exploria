import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const PLAN_PRICE_IDS: Record<string, Record<string, string>> = {
  basic: {
    monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID!,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!,
  },
}

export async function POST(request: NextRequest) {
  const supabase = await createClient() as AnySupabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { plan, billing = 'monthly' } = body

  if (!plan || !PLAN_PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Get provider record
  const { data: provider } = await supabase
    .from('providers')
    .select('id, company_name')
    .eq('profile_id', user.id)
    .single()

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  // Get or create Stripe customer
  const { data: existingSub } = await supabase
    .from('provider_subscriptions')
    .select('stripe_customer_id')
    .eq('provider_id', provider.id)
    .not('stripe_customer_id', 'is', null)
    .single()

  let customerId = existingSub?.stripe_customer_id

  if (!customerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const customer = await stripe.customers.create({
      email: profile?.email,
      name: provider.company_name,
      metadata: { provider_id: provider.id, user_id: user.id },
    })
    customerId = customer.id
  }

  const priceId = PLAN_PRICE_IDS[plan][billing]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/es/dashboard/provider/subscription?success=true`,
    cancel_url: `${siteUrl}/es/dashboard/provider/subscription?cancelled=true`,
    metadata: {
      provider_id: provider.id,
      plan,
      billing,
    },
    subscription_data: {
      trial_period_days: 30,
      metadata: { provider_id: provider.id, plan, billing },
    },
  })

  return NextResponse.json({ url: session.url })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient() as AnySupabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  const { data: sub } = await supabase
    .from('provider_subscriptions')
    .select('stripe_subscription_id')
    .eq('provider_id', provider.id)
    .eq('status', 'active')
    .single()

  if (sub?.stripe_subscription_id) {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })
    await supabase
      .from('provider_subscriptions')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.stripe_subscription_id)
  }

  return NextResponse.json({ success: true })
}
