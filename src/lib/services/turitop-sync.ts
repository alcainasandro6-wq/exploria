import { createAdminClient } from '@/lib/supabase/admin'
import { getTuriTopKey, setTuriTopBookingStatus, deleteTuriTopBooking } from '@/lib/services/turitop'

// Best-effort mirroring of an Exploria reservation's lifecycle into TuriTop.
// Failures are logged, never thrown: the reservation itself must keep working
// even if TuriTop is momentarily unreachable.

async function loadLink(reservationId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('reservations')
    .select('id, provider_id, turitop_booking_id')
    .eq('id', reservationId)
    .maybeSingle()
  if (!data?.turitop_booking_id) return null
  const key = await getTuriTopKey(data.provider_id as string)
  if (!key) return null
  return { admin, key, bookingId: data.turitop_booking_id as string }
}

/** Payment confirmed → mark the TuriTop booking as paid. */
export async function markTuriTopBookingPaid(reservationId: string): Promise<void> {
  try {
    const link = await loadLink(reservationId)
    if (!link) return
    await setTuriTopBookingStatus(link.key, link.bookingId, 'paid')
  } catch (err) {
    console.error('TuriTop mark-paid failed for reservation', reservationId, err)
  }
}

/** Reservation cancelled / rejected / refunded → free the seats in TuriTop. */
export async function cancelTuriTopBooking(reservationId: string): Promise<void> {
  try {
    const link = await loadLink(reservationId)
    if (!link) return
    await deleteTuriTopBooking(link.key, link.bookingId)
    await link.admin.from('reservations').update({ turitop_booking_id: null }).eq('id', reservationId)
  } catch (err) {
    console.error('TuriTop cancel failed for reservation', reservationId, err)
  }
}
