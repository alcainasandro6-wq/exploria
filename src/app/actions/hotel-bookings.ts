'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReservation } from '@/lib/services/reservations'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { getPublishedActivities } from '@/lib/services/activities'
import type { Hotel } from '@/types/database'

// =====================================================
// Auth helper — hotel reception staff only
// =====================================================

async function requireHotelStaff(): Promise<{ hotel: Hotel }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'hotel') throw new Error('Hotel access required')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) throw new Error('Hotel record not found')

  return { hotel }
}

// =====================================================
// Activity search (for the "pick an activity" step of the form)
// =====================================================

export interface ConciergeActivityOption {
  id: string
  title: string
  slug: string
  price_from: number
  duration_minutes: number
  min_participants: number
  max_participants: number
  provider_id: string
  provider_name: string
  cover_image: string | null
}

export async function searchActivitiesForConciergeAction(query: string) {
  try {
    await requireHotelStaff()

    const activities = await getPublishedActivities({ q: query, sort: 'relevance' })
    const options: ConciergeActivityOption[] = activities.slice(0, 15).map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      price_from: a.price_from,
      duration_minutes: a.duration_minutes,
      min_participants: a.min_participants,
      max_participants: a.max_participants,
      provider_id: a.provider_id,
      provider_name: a.provider?.company_name ?? '',
      cover_image: a.images.find((img) => img.is_cover)?.url ?? a.images[0]?.url ?? null,
    }))

    return { success: true, activities: options }
  } catch (err) {
    return { success: false, error: (err as Error).message, activities: [] as ConciergeActivityOption[] }
  }
}

// =====================================================
// Create a reservation on behalf of a walk-in guest with no account
// =====================================================

export interface CreateConciergeReservationInput {
  activityId: string
  activityDate: string
  activityTime: string
  participants: number
  notes?: string
  guestName: string
  guestEmail: string
  guestPhone: string
}

export async function createConciergeReservationAction(input: CreateConciergeReservationInput) {
  try {
    const { hotel } = await requireHotelStaff()

    if (!input.guestName.trim() || !input.guestEmail.trim()) {
      return { success: false, error: 'Guest name and email are required' }
    }

    const supabase = await createClient()
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, provider_id, price_from, min_participants, max_participants, status')
      .eq('id', input.activityId)
      .eq('status', 'published')
      .single()

    if (activityError || !activity) return { success: false, error: 'Activity not found' }

    if (input.participants < activity.min_participants || input.participants > activity.max_participants) {
      return {
        success: false,
        error: `Participants must be between ${activity.min_participants} and ${activity.max_participants}`,
      }
    }

    // Service-role client — needed both to find-or-create the guest's profile
    // (mirrors adminCreateUserAction in src/app/actions/admin.ts) and to insert
    // the reservation itself, since the "Customer can create reservations" RLS
    // policy requires customer_id = auth.uid() and here the caller (hotel
    // staff) is never the guest.
    const admin = createAdminClient()

    const normalizedEmail = input.guestEmail.trim().toLowerCase()
    let customerId: string

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingProfile) {
      customerId = existingProfile.id
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: input.guestName.trim(), role: 'customer' },
      })
      if (createError || !created.user) {
        return { success: false, error: createError?.message ?? 'Could not create guest account' }
      }
      customerId = created.user.id

      if (input.guestPhone.trim()) {
        await admin.from('profiles').update({ phone: input.guestPhone.trim() }).eq('id', customerId)
      }
    }

    const totalPrice = activity.price_from * input.participants

    const reservation = await createReservation(
      {
        activityId: activity.id,
        providerId: activity.provider_id,
        activityDate: input.activityDate,
        activityTime: input.activityTime,
        participants: input.participants,
        notes: input.notes,
        totalPrice,
        source: 'concierge',
        hotelId: hotel.id,
      },
      customerId,
      admin
    )

    revalidatePath('/dashboard/hotel/bookings')
    revalidatePath('/dashboard/hotel')
    return { success: true, reservation }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
