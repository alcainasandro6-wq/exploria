import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { getTuriTopKey, getTuriTopSlots } from '@/lib/services/turitop'

// Real, live departures (with seats left) of the TuriTop product linked to an
// activity. Public: it only exposes time + seats + price for published activities.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const activityId = searchParams.get('activity_id') ?? ''
  const date = searchParams.get('date') ?? ''

  if (!/^[0-9a-f-]{36}$/i.test(activityId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }
  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 400 * 86400_000).toISOString().split('T')[0]
  if (date < today || date > maxDate) return NextResponse.json({ linked: true, slots: [] })

  const supabase = createPublicClient()
  const { data: activity } = await supabase
    .from('activities')
    .select('provider_id, turitop_product_id')
    .eq('id', activityId)
    .eq('status', 'published')
    .maybeSingle()

  if (!activity?.turitop_product_id) return NextResponse.json({ linked: false, slots: [] })

  const key = await getTuriTopKey(activity.provider_id as string)
  if (!key) return NextResponse.json({ linked: false, slots: [] })

  try {
    const slots = await getTuriTopSlots(key, activity.turitop_product_id as string, date)
    return NextResponse.json(
      { linked: true, slots: slots.map((s) => ({ time: s.time, left: s.left, price: s.price })) },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('TuriTop slots error:', err)
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: 502 })
  }
}
