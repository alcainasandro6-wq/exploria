import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { generateConfirmationCode } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTuriTopKey, getTuriTopSlots, createTuriTopBooking, type TuriTopSlot } from '@/lib/services/turitop'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export async function POST(request: NextRequest) {
  const supabase = await createClient() as AnySupabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { activity_id, activity_date, activity_time, participants, notes, hotel_code } = body

  if (!activity_id || !activity_date || !activity_time || !participants) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (typeof activity_id !== 'string' || typeof activity_time !== 'string' || !/^\d{2}:\d{2}$/.test(activity_time)) {
    return NextResponse.json({ error: 'Invalid time' }, { status: 400 })
  }
  if (typeof activity_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(activity_date) || Number.isNaN(Date.parse(activity_date))) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }
  if (activity_date < new Date().toISOString().split('T')[0]) {
    return NextResponse.json({ error: 'The date is in the past' }, { status: 400 })
  }
  if (!Number.isInteger(participants) || participants < 1 || participants > 200) {
    return NextResponse.json({ error: 'Invalid number of participants' }, { status: 400 })
  }
  if (notes != null && (typeof notes !== 'string' || notes.length > 2000)) {
    return NextResponse.json({ error: 'Invalid notes' }, { status: 400 })
  }

  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id, title, provider_id, price_from, status, min_participants, max_participants, turitop_product_id')
    .eq('id', activity_id)
    .eq('status', 'published')
    .single()

  if (activityError || !activity) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  }

  const { data: subscription } = await supabase
    .from('provider_subscriptions')
    .select('id')
    .eq('provider_id', activity.provider_id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Provider subscription is not active' }, { status: 400 })
  }

  if (participants < activity.min_participants || participants > activity.max_participants) {
    return NextResponse.json({ error: 'Invalid number of participants' }, { status: 400 })
  }

  let hotel_id = null
  if (hotel_code) {
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('affiliate_code', hotel_code)
      .single()
    hotel_id = hotel?.id || null
  }

  // Activities linked to a TuriTop product sell REAL departures: re-check the
  // seats in TuriTop right now so the same seat is never sold twice.
  let turitop: { key: string; slot: TuriTopSlot } | null = null
  if (activity.turitop_product_id) {
    const key = await getTuriTopKey(activity.provider_id)
    if (key) {
      let slots: TuriTopSlot[]
      try {
        slots = await getTuriTopSlots(key, activity.turitop_product_id, activity_date)
      } catch (err) {
        console.error('TuriTop availability check failed:', err)
        return NextResponse.json({ error: 'Availability could not be verified. Please try again in a moment.' }, { status: 502 })
      }
      const slot = slots.find((s) => s.time === activity_time)
      if (!slot || slot.ticketId == null) {
        return NextResponse.json({ error: 'That departure is no longer available' }, { status: 409 })
      }
      if (slot.left < participants) {
        return NextResponse.json({ error: `Only ${slot.left} seat(s) left on that departure` }, { status: 409 })
      }
      turitop = { key, slot }
    }
  }

  const total_price = activity.price_from * participants

  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('customer_id', user.id)
    .eq('activity_id', activity_id)
    .eq('activity_date', activity_date)
    .eq('activity_time', activity_time)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a reservation for this activity at this date and time' },
      { status: 409 }
    )
  }

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      activity_id,
      customer_id: user.id,
      hotel_id,
      provider_id: activity.provider_id,
      booking_date: new Date().toISOString().split('T')[0],
      activity_date,
      activity_time,
      participants,
      total_price,
      notes,
      affiliate_code: hotel_code || null,
      confirmation_code: generateConfirmationCode(),
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }

  // Hold the seats in the provider's TuriTop calendar (pending until paid).
  if (turitop) {
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle()
      const ttId = await createTuriTopBooking(turitop.key, {
        productId: activity.turitop_product_id,
        eventStart: turitop.slot.timestamp,
        ticketId: turitop.slot.ticketId as number,
        quantity: participants,
        status: 'pending',
        totalPrice: reservation.total_price,
        customerName: profile?.full_name || user.email || 'Exploria customer',
        customerEmail: user.email,
        customerPhone: profile?.phone || undefined,
        notes: `Exploria · ${reservation.confirmation_code}`,
      })
      await createAdminClient().from('reservations').update({ turitop_booking_id: ttId }).eq('id', reservation.id)
    } catch (err) {
      console.error('TuriTop booking creation failed:', err)
      // Do not leave a reservation that holds no seat: cancel it and tell the customer.
      await createAdminClient().from('reservations').update({ status: 'cancelled' }).eq('id', reservation.id)
      return NextResponse.json({ error: 'The seat could not be reserved. Please try again.' }, { status: 502 })
    }
  }

  // Centralized payment collection: BookActivities charges the customer
  // directly (own Stripe account, no Connect needed), holds the money, and
  // settles with the provider/hotel later via the commissions ledger. If
  // checkout creation fails, the reservation still exists as pending/unpaid
  // — the customer can retry payment from their bookings list.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  let checkoutUrl: string | null = null
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: activity.title },
          unit_amount: Math.round(total_price * 100),
        },
        quantity: 1,
      }],
      success_url: `${siteUrl}/es/dashboard/customer/bookings?payment=success`,
      cancel_url: `${siteUrl}/es/dashboard/customer/bookings?payment=cancelled`,
      metadata: { reservation_id: reservation.id },
      payment_intent_data: { metadata: { reservation_id: reservation.id } },
    })
    checkoutUrl = session.url
  } catch (checkoutError) {
    console.error('Checkout session error:', checkoutError)
  }

  return NextResponse.json({ reservation, checkoutUrl }, { status: 201 })
}

// Re-creates a Checkout Session for an existing unpaid pending reservation
// (e.g. the customer abandoned the first checkout attempt).
export async function PATCH(request: NextRequest) {
  const supabase = await createClient() as AnySupabase
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reservation_id } = await request.json()
  if (!reservation_id) return NextResponse.json({ error: 'Missing reservation_id' }, { status: 400 })

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, customer_id, total_price, payment_status, status, activity:activities(title)')
    .eq('id', reservation_id)
    .single()

  if (!reservation || reservation.customer_id !== user.id) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }
  if (reservation.payment_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }
  if (reservation.status !== 'pending') {
    return NextResponse.json({ error: 'Reservation is no longer payable' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: reservation.activity?.title ?? 'Actividad' },
        unit_amount: Math.round(reservation.total_price * 100),
      },
      quantity: 1,
    }],
    success_url: `${siteUrl}/es/dashboard/customer/bookings?payment=success`,
    cancel_url: `${siteUrl}/es/dashboard/customer/bookings?payment=cancelled`,
    metadata: { reservation_id: reservation.id },
    payment_intent_data: { metadata: { reservation_id: reservation.id } },
  })

  return NextResponse.json({ checkoutUrl: session.url })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient() as AnySupabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('reservations')
    .select('*, activity:activities(title, slug, images:activity_images(url, is_cover))')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  return NextResponse.json({ bookings: data })
}
