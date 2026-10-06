'use server'

import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelTuriTopBooking } from '@/lib/services/turitop-sync'
import {
  createReservation,
  transitionReservation,
  canTransition,
} from '@/lib/services/reservations'
import type { ReservationStatus, ReservationSource } from '@/types/database'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// Reservations are paid upfront (BookActivities charges the customer
// directly, see /api/bookings) — rejecting/cancelling a paid one must
// refund it, since the platform is the one holding the money.
async function refundReservationIfPaid(reservationId: string) {
  const supabase = await createClient()
  const { data: res } = await supabase
    .from('reservations')
    .select('payment_status, stripe_payment_intent_id')
    .eq('id', reservationId)
    .single()

  if (!res || res.payment_status !== 'paid' || !res.stripe_payment_intent_id) return

  try {
    await stripe.refunds.create({ payment_intent: res.stripe_payment_intent_id })
    // payment_status is locked for ordinary users at DB level; use the service role.
    await createAdminClient()
      .from('reservations')
      .update({ payment_status: 'refunded' })
      .eq('id', reservationId)
  } catch (err) {
    console.error('Refund failed for reservation', reservationId, err)
  }
}

// =====================================================
// Auth helper
// =====================================================

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')
  return { user, profile }
}

async function requireProvider() {
  const { user, profile } = await requireAuth()
  if (profile.role !== 'provider' && profile.role !== 'admin') {
    throw new Error('Provider access required')
  }
  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  if (!provider) throw new Error('Provider record not found')
  return { user, profile, providerId: provider.id }
}

// =====================================================
// Customer actions
// =====================================================

export async function createReservationAction(input: {
  activityId: string
  providerId: string
  activityDate: string
  activityTime: string
  participants: number
  notes?: string
  totalPrice: number
  affiliateCode?: string
  source?: ReservationSource
}) {
  const { user } = await requireAuth()

  try {
    const reservation = await createReservation(input, user.id)
    revalidatePath('/dashboard/customer/reservations')
    return { success: true, reservation }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function cancelReservationAction(reservationId: string) {
  const { user } = await requireAuth()
  const supabase = await createClient()

  // Verify it's the customer's own reservation
  const { data: res } = await supabase
    .from('reservations')
    .select('id, status, customer_id')
    .eq('id', reservationId)
    .single()

  if (!res) return { success: false, error: 'Reservation not found' }
  if (res.customer_id !== user.id) return { success: false, error: 'Not your reservation' }
  if (!canTransition(res.status as ReservationStatus, 'cancelled')) {
    return { success: false, error: `Cannot cancel a ${res.status} reservation` }
  }

  try {
    await transitionReservation(reservationId, 'cancelled')
    await refundReservationIfPaid(reservationId)
    await cancelTuriTopBooking(reservationId)
    revalidatePath('/dashboard/customer/reservations')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Provider actions
// =====================================================

export async function confirmReservationAction(reservationId: string, notes?: string) {
  const { providerId } = await requireProvider()
  const supabase = await createClient()

  // Verify the reservation belongs to this provider
  const { data: res } = await supabase
    .from('reservations')
    .select('id, status, provider_id')
    .eq('id', reservationId)
    .single()

  if (!res) return { success: false, error: 'Reservation not found' }
  if (res.provider_id !== providerId) return { success: false, error: 'Not your reservation' }
  if (!canTransition(res.status as ReservationStatus, 'confirmed')) {
    return { success: false, error: `Cannot confirm a ${res.status} reservation` }
  }

  try {
    const updated = await transitionReservation(reservationId, 'confirmed', notes)
    revalidatePath('/dashboard/provider/reservations')
    return { success: true, reservation: updated }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function rejectReservationAction(reservationId: string, reason: string) {
  const { providerId } = await requireProvider()
  const supabase = await createClient()

  const { data: res } = await supabase
    .from('reservations')
    .select('id, status, provider_id')
    .eq('id', reservationId)
    .single()

  if (!res) return { success: false, error: 'Reservation not found' }
  if (res.provider_id !== providerId) return { success: false, error: 'Not your reservation' }
  if (!canTransition(res.status as ReservationStatus, 'rejected')) {
    return { success: false, error: `Cannot reject a ${res.status} reservation` }
  }

  try {
    await transitionReservation(reservationId, 'rejected', reason)
    await refundReservationIfPaid(reservationId)
    await cancelTuriTopBooking(reservationId)
    revalidatePath('/dashboard/provider/reservations')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function completeReservationAction(reservationId: string) {
  const { providerId } = await requireProvider()
  const supabase = await createClient()

  const { data: res } = await supabase
    .from('reservations')
    .select('id, status, provider_id')
    .eq('id', reservationId)
    .single()

  if (!res) return { success: false, error: 'Reservation not found' }
  if (res.provider_id !== providerId) return { success: false, error: 'Not your reservation' }
  if (!canTransition(res.status as ReservationStatus, 'completed')) {
    return { success: false, error: `Cannot complete a ${res.status} reservation` }
  }

  try {
    await transitionReservation(reservationId, 'completed')
    revalidatePath('/dashboard/provider/reservations')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function markNoShowAction(reservationId: string) {
  const { providerId } = await requireProvider()
  const supabase = await createClient()

  const { data: res } = await supabase
    .from('reservations')
    .select('id, status, provider_id')
    .eq('id', reservationId)
    .single()

  if (!res) return { success: false, error: 'Reservation not found' }
  if (res.provider_id !== providerId) return { success: false, error: 'Not your reservation' }

  try {
    await transitionReservation(reservationId, 'no_show')
    revalidatePath('/dashboard/provider/reservations')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Admin actions
// =====================================================

export async function adminTransitionReservationAction(
  reservationId: string,
  newStatus: ReservationStatus,
  notes?: string
) {
  const { profile } = await requireAuth()
  if (profile.role !== 'admin') return { success: false, error: 'Admin access required' }

  try {
    const updated = await transitionReservation(reservationId, newStatus, notes)
    if (newStatus === 'rejected' || newStatus === 'cancelled') {
      await refundReservationIfPaid(reservationId)
      await cancelTuriTopBooking(reservationId)
    }
    revalidatePath('/dashboard/admin/reservations')
    return { success: true, reservation: updated }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
