'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ActivityCalendar } from '@/components/booking/ActivityCalendar'
import { getAdminCalendarAction } from '@/app/actions/admin'
import type { CalendarEvent } from '@/lib/calendar-types'

/** Platform-wide calendar: all providers' Exploria reservations plus their TuriTop bookings. */
export function AdminCalendar() {
  const t = useTranslations('activity_calendar')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true)
    const res = await getAdminCalendarAction(from, to)
    setLoading(false)
    if (!res.success) { setWarning(res.error ?? t('load_error')); return }
    setEvents(res.events)
    setWarning(null)
  }, [t])

  return <ActivityCalendar events={events} onRangeChange={load} loading={loading} warning={warning} />
}
