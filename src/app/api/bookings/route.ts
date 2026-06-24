import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateConfirmationCode } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

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

  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id, provider_id, price_from, status')
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

  let hotel_id = null
  if (hotel_code) {
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('affiliate_code', hotel_code)
      .single()
    hotel_id = hotel?.id || null
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

  return NextResponse.json({ reservation }, { status: 201 })
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
