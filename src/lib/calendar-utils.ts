import type { Reservation } from '@/types/database'
import type { CalendarEvent } from '@/lib/calendar-types'

/** Maps reservations to calendar events. `subtitle` picks what to show under the title. */
export function reservationsToEvents(
  reservations: Reservation[],
  subtitle: (r: Reservation) => string | undefined
): CalendarEvent[] {
  return reservations.map((r) => ({
    id: r.id,
    date: r.activity_date,
    time: (r.activity_time ?? '').slice(0, 5),
    title: r.activity?.title ?? '—',
    subtitle: subtitle(r) ?? r.external_customer_name ?? undefined,
    participants: r.participants,
    status: r.status,
  }))
}
